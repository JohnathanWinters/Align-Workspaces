import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPortfolioPhotoSchema, insertShootSchema, insertFeaturedProfessionalSchema, insertNominationSchema, insertNewsletterSubscriberSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendBookingNotification, sendHelpRequest, sendCollaborateMessage, sendEditRequestNotification } from "./gmail";
import { sendPushToUser, sendPushToRole } from "./pushNotifications";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { calculatePricing } from "@shared/pricing";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import sharp from "sharp";
import { randomUUID, createHash, scryptSync, randomBytes } from "crypto";
import { objectStorageClient, ObjectStorageService, ObjectNotFoundError } from "./replit_integrations/object_storage";
import { authStorage } from "./replit_integrations/auth";

const objectStorageService = new ObjectStorageService();

const uploadDir = path.join(process.cwd(), "uploads");
const tmpUploadDir = path.join(process.cwd(), "tmp_uploads");
if (!fs.existsSync(tmpUploadDir)) fs.mkdirSync(tmpUploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: tmpUploadDir,
    filename: (_req, _file, cb) => cb(null, `${randomUUID()}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|heic|heif|tiff|bmp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function parseObjectPath(objectPath: string): { bucketName: string; objectName: string } {
  let p = objectPath;
  if (!p.startsWith("/")) p = `/${p}`;
  const parts = p.split("/");
  if (parts.length < 3) throw new Error("Invalid object path");
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
}

async function uploadBufferToObjectStorage(buffer: Buffer, contentType: string): Promise<string> {
  const privateDir = objectStorageService.getPrivateObjectDir();
  const objectId = randomUUID();
  const fullPath = `${privateDir}/uploads/${objectId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  await file.save(buffer, { contentType });
  return `/objects/uploads/${objectId}`;
}

async function uploadFileFromDisk(filePath: string, contentType: string): Promise<string> {
  const privateDir = objectStorageService.getPrivateObjectDir();
  const objectId = randomUUID();
  const fullPath = `${privateDir}/uploads/${objectId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  await new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = file.createWriteStream({ metadata: { contentType } });
    readStream.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    readStream.on("error", reject);
  });
  await fs.promises.unlink(filePath).catch(() => {});
  return `/objects/uploads/${objectId}`;
}

async function deleteFromObjectStorage(imageUrl: string): Promise<void> {
  try {
    if (imageUrl.startsWith("/objects/")) {
      const objectFile = await objectStorageService.getObjectEntityFile(imageUrl);
      await objectFile.delete();
    } else if (imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(uploadDir, path.basename(imageUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Failed to delete file:", imageUrl, err);
  }
}

async function getImageStream(imageUrl: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> {
  try {
    if (imageUrl.startsWith("/objects/")) {
      const objectFile = await objectStorageService.getObjectEntityFile(imageUrl);
      const [metadata] = await objectFile.getMetadata();
      return {
        stream: objectFile.createReadStream(),
        contentType: (metadata.contentType as string) || "application/octet-stream",
      };
    } else if (imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(uploadDir, path.basename(imageUrl));
      if (!fs.existsSync(filePath)) return null;
      return {
        stream: fs.createReadStream(filePath),
        contentType: "application/octet-stream",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getClientDisplayName(claims: any, userId: string): Promise<string> {
  let firstName = claims.first_name || "";
  let lastName = claims.last_name || "";
  if (!firstName && claims.name) {
    const parts = claims.name.split(" ");
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }
  if (!firstName) {
    try {
      const dbUser = await authStorage.getUser(userId);
      if (dbUser) {
        firstName = dbUser.firstName || "";
        lastName = dbUser.lastName || "";
      }
    } catch {}
  }
  if (!firstName) return "Client";
  return lastName ? `${firstName} ${lastName.charAt(0)}.` : firstName;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || randomBytes(16).toString("hex");
  const h = scryptSync(password, s, 64).toString("hex");
  return { hash: `${s}:${h}`, salt: s };
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const { hash: full } = hashPassword(password, salt);
  return full === stored;
}

const EMPLOYEE_ROLES: Record<string, string[]> = {
  editor: [
    "view_users", "view_shoots", "view_gallery", "view_edit_requests",
    "upload_finished_photos", "chat_edit_requests", "view_edit_tokens",
  ],
  manager: [
    "view_users", "view_shoots", "view_gallery", "view_edit_requests",
    "upload_finished_photos", "chat_edit_requests", "view_edit_tokens",
    "create_shoots", "edit_shoots", "manage_gallery", "upload_photos",
    "manage_folders", "adjust_tokens",
  ],
};

function isAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  const token = authHeader.slice(7);
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Invalid admin credentials" });
  }
  (req as any).adminRole = "admin";
  next();
}

function isAdminOrEmployee(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = authHeader.slice(7);
  if (token === process.env.ADMIN_PASSWORD) {
    (req as any).adminRole = "admin";
    return next();
  }
  if (token.startsWith("emp:")) {
    const parts = token.split(":");
    const empId = parts[1];
    const empRole = parts[2];
    if (empId && empRole) {
      (req as any).adminRole = "employee";
      (req as any).employeeId = empId;
      (req as any).employeeRole = empRole;
      return next();
    }
  }
  return res.status(403).json({ message: "Invalid credentials" });
}

function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).adminRole;
    if (role === "admin") return next();
    const empRole = (req as any).employeeRole as string;
    const allowed = EMPLOYEE_ROLES[empRole] || [];
    const hasAll = permissions.every(p => allowed.includes(p));
    if (!hasAll) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/leads", async (req, res) => {
    try {
      const data = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(data);

      sendBookingNotification({
        name: data.name,
        email: data.email,
        phone: data.phone,
        preferredDate: data.preferredDate,
        notes: data.notes,
        environment: data.environment,
        brandMessage: data.brandMessage,
        emotionalImpact: data.emotionalImpact,
        shootIntent: data.shootIntent,
        estimatedMin: data.estimatedMin,
        estimatedMax: data.estimatedMax,
      }).catch((err) => console.error("Failed to send booking email:", err));

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      const allLeads = await storage.getLeads();
      res.json(allLeads);
    } catch {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/portfolio-photos", async (req, res) => {
    try {
      const data = insertPortfolioPhotoSchema.parse(req.body);
      const photo = await storage.createPortfolioPhoto(data);
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create portfolio photo" });
      }
    }
  });

  app.get("/api/portfolio-photos", async (req, res) => {
    try {
      const { environment, brandMessage, emotionalImpact } = req.query;
      if (environment && brandMessage && emotionalImpact) {
        const photos = await storage.getPortfolioPhotosByTags(
          environment as string,
          brandMessage as string,
          emotionalImpact as string
        );
        res.json(photos);
      } else {
        const photos = await storage.getPortfolioPhotos();
        res.json(photos);
      }
    } catch {
      res.status(500).json({ message: "Failed to fetch portfolio photos" });
    }
  });

  app.post("/api/admin/portfolio/upload", isAdmin, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const objectKey = `uploads/portfolio-${randomUUID()}.webp`;
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/${objectKey}`;
      const parts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
      const bucketName = parts[0];
      const objectName = parts.slice(1).join("/");
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const rawBuffer = fs.readFileSync(req.file.path);
      const processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90, effort: 4 })
        .toBuffer();
      await file.save(processedBuffer, { resumable: false, metadata: { contentType: "image/webp" } });
      fs.unlinkSync(req.file.path);
      const imageUrl = `/objects/${objectKey}`;
      const environments = JSON.parse(req.body.environments || "[]");
      const brandMessages = JSON.parse(req.body.brandMessages || "[]");
      const emotionalImpacts = JSON.parse(req.body.emotionalImpacts || "[]");
      const colorPalette = JSON.parse(req.body.colorPalette || "[]");
      const photo = await storage.createPortfolioPhoto({
        imageUrl,
        environments,
        brandMessages,
        emotionalImpacts,
        colorPalette,
      });
      res.json(photo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/portfolio/:id", isAdmin, async (req, res) => {
    try {
      const { environments, brandMessages, emotionalImpacts, colorPalette } = req.body;
      const photo = await storage.updatePortfolioPhoto(req.params.id, {
        environments,
        brandMessages,
        emotionalImpacts,
        colorPalette,
      });
      res.json(photo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/portfolio/:id", isAdmin, async (req, res) => {
    try {
      await storage.deletePortfolioPhoto(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Failed to get Stripe publishable key:", error);
      res.status(500).json({ message: "Failed to get payment configuration" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { leadData } = req.body;

      const lead = insertLeadSchema.parse(leadData);

      const pricing = calculatePricing(lead.shootIntent ?? null);
      const totalAmountDollars = pricing.max;
      const downpaymentCents = Math.round(totalAmountDollars * 100 * 0.5);
      const downpaymentDollars = totalAmountDollars / 2;

      const savedLead = await storage.createLead({
        ...lead,
        estimatedMin: pricing.min,
        estimatedMax: pricing.max,
        paymentStatus: "pending",
      });

      sendBookingNotification({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        preferredDate: lead.preferredDate,
        notes: lead.notes,
        environment: lead.environment,
        brandMessage: lead.brandMessage,
        emotionalImpact: lead.emotionalImpact,
        shootIntent: lead.shootIntent,
        estimatedMin: pricing.min,
        estimatedMax: pricing.max,
      }).catch((err) => console.error("Failed to send booking email:", err));

      const stripe = await getUncachableStripeClient();

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Portrait Session Downpayment (50%)',
                description: `Downpayment for your portrait photoshoot on ${lead.preferredDate}. Total: $${totalAmountDollars}. Remaining $${downpaymentDollars} due at the session.`,
              },
              unit_amount: downpaymentCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
        customer_email: lead.email,
        metadata: {
          leadId: String(savedLead.id),
          totalAmount: String(totalAmountDollars),
          downpayment: String(downpaymentDollars),
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    }
  });

  app.post("/api/booking-shoot", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { environment, brandMessage, emotionalImpact, shootIntent, preferredDate, notes } = req.body;

      if (!preferredDate || typeof preferredDate !== "string") {
        return res.status(400).json({ message: "A preferred date is required" });
      }

      const existingShoots = await storage.getShootsByUser(userId);
      const alreadyExists = existingShoots.some(
        (s) => s.shootDate === preferredDate && s.status === "booked"
      );
      if (alreadyExists) {
        return res.status(200).json(existingShoots.find(
          (s) => s.shootDate === preferredDate && s.status === "booked"
        ));
      }

      const title = `Portrait Session – ${preferredDate}`;
      const shoot = await storage.createShoot({
        userId,
        title,
        environment: typeof environment === "string" ? environment : null,
        brandMessage: typeof brandMessage === "string" ? brandMessage : null,
        emotionalImpact: typeof emotionalImpact === "string" ? emotionalImpact : null,
        shootIntent: typeof shootIntent === "string" ? shootIntent : null,
        status: "booked",
        shootDate: preferredDate,
        notes: typeof notes === "string" ? notes : null,
      });
      await storage.getOrCreateEditTokens(userId);
      res.status(201).json(shoot);
    } catch (error) {
      console.error("Failed to create booking shoot:", error);
      res.status(500).json({ message: "Failed to create shoot from booking" });
    }
  });

  app.post("/api/collaborate", async (req, res) => {
    try {
      const { firstName, email, message, environment, brandMessage, emotionalImpact, shootIntent } = req.body;
      if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "A valid email is required" });
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ message: "A message is required" });
      }

      const existing = await storage.getUserByEmail(email.trim().toLowerCase());
      let userId: string;
      if (existing) {
        userId = existing.id;
        await storage.updateUser(existing.id, { firstName: firstName.trim() });
      } else {
        const newId = randomUUID();
        await authStorage.upsertUser({
          id: newId,
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: null,
        });
        userId = newId;
      }

      const selections = [environment, brandMessage, emotionalImpact, shootIntent].filter(Boolean);
      const title = selections.length > 0
        ? `${firstName.trim()}'s Portrait Session`
        : `${firstName.trim()}'s Concept Review`;

      await storage.createShoot({
        userId,
        title,
        environment: environment || null,
        brandMessage: brandMessage || null,
        emotionalImpact: emotionalImpact || null,
        shootIntent: shootIntent || null,
        status: "pending-review",
        notes: message.trim(),
      });
      await storage.getOrCreateEditTokens(userId);

      try {
        await sendCollaborateMessage({
          clientName: firstName.trim(),
          clientEmail: email.trim().toLowerCase(),
          message: message.trim(),
          environment,
          brandMessage,
          emotionalImpact,
          shootIntent,
        });
      } catch (emailErr) {
        console.error("Failed to send collaborate email (non-blocking):", emailErr);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to process collaboration request:", err);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/help-request", isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      const userId = req.user.claims.sub;
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u) => u.id === userId);
      const clientName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client";
      const clientEmail = user?.email || "Unknown";
      await sendHelpRequest({ clientName, clientEmail, message: message.trim() });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to send help request:", err);
      res.status(500).json({ message: "Failed to send message. Please try again." });
    }
  });

  app.get("/api/shoots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shoots = await storage.getShootsByUser(userId);
      res.json(shoots);
    } catch {
      res.status(500).json({ message: "Failed to fetch shoots" });
    }
  });

  app.post("/api/shoots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertShootSchema.parse({ ...req.body, userId });
      const shoot = await storage.createShoot(data);
      res.status(201).json(shoot);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create shoot" });
      }
    }
  });

  app.get("/api/shoots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }
      if (shoot.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(shoot);
    } catch {
      res.status(500).json({ message: "Failed to fetch shoot" });
    }
  });

  app.get("/api/shoots/:id/gallery", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }
      if (shoot.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      const images = await storage.getGalleryImages(req.params.id);
      res.json(images);
    } catch {
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  // Admin auth check
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(403).json({ message: "Invalid password" });
    }
  });

  app.post("/api/employee/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const employee = await storage.getEmployeeByUsername(username);
      if (!employee || !employee.active) {
        return res.status(403).json({ message: "Invalid credentials" });
      }
      if (!verifyPassword(password, employee.passwordHash)) {
        return res.status(403).json({ message: "Invalid credentials" });
      }
      const token = `emp:${employee.id}:${employee.role}`;
      res.json({
        success: true,
        token,
        employee: {
          id: employee.id,
          username: employee.username,
          displayName: employee.displayName,
          role: employee.role,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Login failed" });
    }
  });

  app.get("/api/employee/me", isAdminOrEmployee, async (req: any, res) => {
    if (req.adminRole === "admin") {
      return res.json({ role: "admin", displayName: "Admin" });
    }
    try {
      const employee = await storage.getEmployeeById(req.employeeId);
      if (!employee || !employee.active) {
        return res.status(403).json({ message: "Account deactivated" });
      }
      res.json({
        id: employee.id,
        username: employee.username,
        displayName: employee.displayName,
        role: employee.role,
      });
    } catch {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/admin/employees", isAdmin, async (_req, res) => {
    try {
      const emps = await storage.getEmployees();
      const safe = emps.map(e => ({ id: e.id, username: e.username, displayName: e.displayName, role: e.role, active: e.active, createdAt: e.createdAt }));
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/admin/employees", isAdmin, async (req, res) => {
    try {
      const { username, password, displayName, role } = req.body;
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Username, password, and display name are required" });
      }
      if (role && !["editor", "manager"].includes(role)) {
        return res.status(400).json({ message: "Role must be editor or manager" });
      }
      const existing = await storage.getEmployeeByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const { hash } = hashPassword(password);
      const employee = await storage.createEmployee({
        username,
        passwordHash: hash,
        displayName,
        role: role || "editor",
      });
      res.status(201).json({
        id: employee.id,
        username: employee.username,
        displayName: employee.displayName,
        role: employee.role,
        active: employee.active,
        createdAt: employee.createdAt,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create employee" });
    }
  });

  app.patch("/api/admin/employees/:id", isAdmin, async (req, res) => {
    try {
      const { username, password, displayName, role, active } = req.body;
      const update: any = {};
      if (username) update.username = username;
      if (displayName) update.displayName = displayName;
      if (role && ["editor", "manager"].includes(role)) update.role = role;
      if (typeof active === "number") update.active = active;
      if (password) {
        const { hash } = hashPassword(password);
        update.passwordHash = hash;
      }
      if (username) {
        const existing = await storage.getEmployeeByUsername(username);
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ message: "Username already taken" });
        }
      }
      const updated = await storage.updateEmployee(req.params.id, update);
      res.json({
        id: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        active: updated.active,
        createdAt: updated.createdAt,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to update employee" });
    }
  });

  app.delete("/api/admin/employees/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.get("/api/admin/users", isAdminOrEmployee, requirePermission("view_users"), async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      const { deletePassword } = req.body;
      if (!deletePassword || deletePassword !== process.env.ADMIN_DELETE_PASSWORD) {
        res.status(403).json({ message: "Invalid delete password" });
        return;
      }
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete user:", err);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      const { firstName, lastName, email } = req.body;
      const updated = await storage.updateUser(userId, { firstName, lastName, email });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin: list all shoots (with user info)
  app.get("/api/admin/shoots", isAdminOrEmployee, requirePermission("view_shoots"), async (_req, res) => {
    try {
      const allShoots = await storage.getAllShoots();
      res.json(allShoots);
    } catch {
      res.status(500).json({ message: "Failed to fetch shoots" });
    }
  });

  // Admin: create shoot for a user
  app.post("/api/admin/shoots", isAdminOrEmployee, requirePermission("create_shoots"), async (req, res) => {
    try {
      const data = insertShootSchema.parse(req.body);
      const shoot = await storage.createShoot(data);
      await storage.getOrCreateEditTokens(data.userId);
      res.status(201).json(shoot);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create shoot" });
      }
    }
  });

  // Admin: update a shoot
  app.patch("/api/admin/shoots/:id", isAdminOrEmployee, requirePermission("edit_shoots"), async (req, res) => {
    try {
      const shoot = await storage.updateShoot(req.params.id as string, req.body);
      res.json(shoot);
    } catch {
      res.status(500).json({ message: "Failed to update shoot" });
    }
  });

  // Admin: delete a shoot (also cleans up files from storage)
  app.delete("/api/admin/shoots/:id", isAdmin, async (req, res) => {
    try {
      const shootId = req.params.id as string;
      const images = await storage.getGalleryImages(shootId);
      for (const img of images) {
        await deleteFromObjectStorage(img.imageUrl);
      }
      await storage.deleteShoot(shootId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete shoot" });
    }
  });

  app.post("/api/admin/shoots/:id/send-invoice", isAdmin, async (req, res) => {
    try {
      const shootId = req.params.id as string;
      const { lineItems, notes, daysUntilDue } = req.body;

      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "At least one line item is required" });
      }
      for (const item of lineItems) {
        if (!item || typeof item.description !== "string" || !item.description.trim()) {
          return res.status(400).json({ message: "Each line item must have a description" });
        }
        if (typeof item.amount !== "number" || isNaN(item.amount) || item.amount <= 0) {
          return res.status(400).json({ message: "Each line item must have a positive amount" });
        }
      }

      const shoot = await storage.getShootById(shootId);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }

      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u) => u.id === shoot.userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Client has no email address on file" });
      }

      const stripe = await getUncachableStripeClient();
      const clientName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client";

      const validDays = [7, 14, 30, 60];
      const dueDays = validDays.includes(Number(daysUntilDue)) ? Number(daysUntilDue) : 30;

      const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customer;
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: clientName,
          metadata: { userId: user.id },
        });
      }

      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: dueDays,
        description: notes?.trim() || undefined,
        metadata: { shootId, shootTitle: shoot.title },
        pending_invoice_items_behavior: "exclude",
      });

      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          description: item.description.trim(),
          amount: Math.round(item.amount * 100),
          currency: "usd",
        });
      }

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

      res.json({
        success: true,
        sentTo: user.email,
        invoiceId: sentInvoice.id,
        invoiceUrl: sentInvoice.hosted_invoice_url,
      });
    } catch (error: any) {
      console.error("Failed to send Stripe invoice:", error);
      res.status(500).json({ message: error?.message || "Failed to send invoice" });
    }
  });

  // Admin: get gallery images for a shoot
  app.get("/api/admin/shoots/:id/gallery", isAdminOrEmployee, requirePermission("view_gallery"), async (req, res) => {
    try {
      const images = await storage.getGalleryImages(req.params.id as string);
      res.json(images);
    } catch {
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  // Admin: add gallery image
  app.post("/api/admin/gallery", isAdminOrEmployee, requirePermission("manage_gallery"), async (req, res) => {
    try {
      const image = await storage.createGalleryImage(req.body);
      res.status(201).json(image);
    } catch {
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });

  // Admin: delete gallery image (also removes file from storage)
  app.delete("/api/admin/gallery/:id", isAdminOrEmployee, requirePermission("manage_gallery"), async (req, res) => {
    try {
      const image = await storage.getGalleryImageById(req.params.id as string);
      if (image) {
        await deleteFromObjectStorage(image.imageUrl);
      }
      await storage.deleteGalleryImage(req.params.id as string);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // Admin: upload photos to a shoot
  app.post("/api/admin/shoots/:id/upload", isAdminOrEmployee, requirePermission("upload_photos"), upload.array("photos", 10), async (req: any, res) => {
    const files = req.files as Express.Multer.File[];
    try {
      const shootId = req.params.id as string;
      const folderId = req.body.folderId || null;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const images = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const contentType = file.mimetype || "application/octet-stream";
        const objectPath = await uploadFileFromDisk(file.path, contentType);
        const image = await storage.createGalleryImage({
          shootId,
          folderId: folderId || null,
          imageUrl: objectPath,
          originalFilename: file.originalname,
          sortOrder: i,
        });
        images.push(image);
      }
      res.status(201).json(images);
    } catch (err: any) {
      for (const file of (files || [])) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
      res.status(500).json({ message: err.message || "Failed to upload photos" });
    }
  });

  // Serve files from Object Storage
  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      const objectPath = req.path;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("Error serving object:", error);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  // Legacy: serve old uploaded files from disk (backward compat)
  if (fs.existsSync(uploadDir)) {
    app.use("/uploads", (await import("express")).default.static(uploadDir));
  }

  // Admin: folder CRUD
  app.get("/api/admin/shoots/:id/folders", isAdminOrEmployee, requirePermission("view_gallery"), async (req, res) => {
    try {
      const folders = await storage.getFolders(req.params.id as string);
      res.json(folders);
    } catch {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/admin/folders", isAdminOrEmployee, requirePermission("manage_folders"), async (req, res) => {
    try {
      const folder = await storage.createFolder(req.body);
      res.status(201).json(folder);
    } catch {
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.patch("/api/admin/folders/:id", isAdminOrEmployee, requirePermission("manage_folders"), async (req, res) => {
    try {
      const folder = await storage.updateFolder(req.params.id as string, req.body);
      res.json(folder);
    } catch {
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.delete("/api/admin/folders/:id", isAdminOrEmployee, requirePermission("manage_folders"), async (req, res) => {
    try {
      const folderId = req.params.id as string;
      const folder = await storage.getFolderById(folderId);
      if (folder) {
        const images = await storage.getGalleryImages(folder.shootId);
        const folderImages = images.filter((img) => img.folderId === folderId);
        for (const img of folderImages) {
          await deleteFromObjectStorage(img.imageUrl);
        }
      }
      await storage.deleteFolder(folderId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Client: get folders for a shoot
  app.get("/api/shoots/:id/folders", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const folders = await storage.getFolders(req.params.id);
      res.json(folders);
    } catch {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  // Client: get favorites for a shoot
  app.get("/api/shoots/:id/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const favoriteIds = await storage.getFavorites(req.user.claims.sub, req.params.id);
      res.json(favoriteIds);
    } catch {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Client: toggle favorite on an image
  app.post("/api/shoots/:shootId/gallery/:imageId/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.shootId);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });

      const image = await storage.getGalleryImageById(req.params.imageId);
      if (!image || image.shootId !== shoot.id) return res.status(404).json({ message: "Image not found" });

      const isFavorited = await storage.toggleFavorite(req.user.claims.sub, req.params.imageId);
      res.json({ favorited: isFavorited });
    } catch {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Client: download single image
  app.get("/api/shoots/:shootId/gallery/:imageId/download", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.shootId);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });

      const image = await storage.getGalleryImageById(req.params.imageId);
      if (!image || image.shootId !== shoot.id) return res.status(404).json({ message: "Image not found" });

      const result = await getImageStream(image.imageUrl);
      if (!result) return res.status(404).json({ message: "File not found" });

      const filename = image.originalFilename || path.basename(image.imageUrl);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", result.contentType);
      (result.stream as any).pipe(res);
    } catch {
      res.status(500).json({ message: "Failed to download image" });
    }
  });

  // Client: download all images as zip
  app.get("/api/shoots/:id/download-all", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });

      const images = await storage.getGalleryImages(req.params.id);
      const folders = await storage.getFolders(req.params.id);
      if (images.length === 0) return res.status(404).json({ message: "No images to download" });

      const folderMap = new Map(folders.map((f) => [f.id, f.name]));

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${shoot.title.replace(/[^a-zA-Z0-9]/g, "_")}_photos.zip"`);

      const archive = archiver("zip", { zlib: { level: 5 } });
      archive.pipe(res);

      for (const image of images) {
        const result = await getImageStream(image.imageUrl);
        if (result) {
          const filename = image.originalFilename || path.basename(image.imageUrl);
          const folderName = image.folderId ? folderMap.get(image.folderId) || "Other" : "";
          const archivePath = folderName ? `${folderName}/${filename}` : filename;
          archive.append(result.stream as any, { name: archivePath });
        }
      }

      await archive.finalize();
    } catch {
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create download" });
      }
    }
  });

  const EDIT_TOKEN_PRICE_CENTS = 500;
  const TOKENS_PER_PHOTO = 1;

  app.get("/api/edit-tokens", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tokens = await storage.resetExpiredAnnualTokens(userId);
      res.json(tokens);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to get tokens" });
    }
  });

  app.get("/api/edit-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getEditRequests(userId);
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to get edit requests" });
    }
  });

  app.post("/api/edit-requests", isAuthenticated, upload.array("photos", 10), async (req: any, res) => {
    const files = req.files as Express.Multer.File[];
    try {
      const userId = req.user.claims.sub;
      const shootId = req.body.shootId || null;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const tokenCost = files.length * TOKENS_PER_PHOTO;
      const notes = req.body.notes || null;
      const { annualUsed, purchasedUsed } = await storage.deductTokens(userId, tokenCost);
      const editRequest = await storage.createEditRequest({
        userId,
        shootId,
        photoCount: files.length,
        annualTokensUsed: annualUsed,
        purchasedTokensUsed: purchasedUsed,
        notes,
        status: "pending",
      });
      if (notes && notes.trim()) {
        const senderName = await getClientDisplayName(req.user.claims, userId);
        await storage.createEditRequestMessage({
          editRequestId: editRequest.id,
          senderId: userId,
          senderRole: "client",
          senderName,
          message: notes.trim(),
        });
      }
      for (const file of files) {
        const contentType = file.mimetype || "application/octet-stream";
        const objectPath = await uploadFileFromDisk(file.path, contentType);
        await storage.createEditRequestPhoto({
          editRequestId: editRequest.id,
          imageUrl: objectPath,
          originalFilename: file.originalname,
        });
      }
      const updatedTokens = await storage.getOrCreateEditTokens(userId);
      const clientName = req.user.claims.name || req.user.claims.email || "Client";
      const clientEmail = req.user.claims.email || "";
      sendEditRequestNotification({
        clientName,
        clientEmail,
        photoCount: files.length,
        tokensUsed: tokenCost,
        notes: notes || undefined,
      }).catch((err) => console.error("Failed to send edit request notification:", err));
      res.status(201).json({ editRequest, tokens: updatedTokens });
    } catch (err: any) {
      for (const file of (files || [])) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
      if (err.message === "Insufficient edit tokens") {
        return res.status(400).json({ message: "You do not have enough Edit Tokens. Please purchase additional tokens to continue." });
      }
      res.status(500).json({ message: err.message || "Failed to submit edit request" });
    }
  });

  app.post("/api/edit-tokens/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const email = req.user.claims.email;
      const quantity = parseInt(req.body.quantity) || 1;
      if (quantity < 1 || quantity > 100) {
        return res.status(400).json({ message: "Quantity must be between 1 and 100" });
      }
      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Edit Token",
                description: "Photo editing token - submit photos for professional editing",
              },
              unit_amount: EDIT_TOKEN_PRICE_CENTS,
            },
            quantity,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/portal?token_purchase=success`,
        cancel_url: `${baseUrl}/portal?token_purchase=cancelled`,
        customer_email: email,
        metadata: {
          type: "edit_tokens",
          userId,
          quantity: String(quantity),
        },
      });
      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create checkout" });
    }
  });

  app.get("/api/edit-tokens/config", (_req, res) => {
    res.json({ pricePerToken: EDIT_TOKEN_PRICE_CENTS / 100, tokensPerPhoto: TOKENS_PER_PHOTO });
  });

  app.get("/api/admin/edit-tokens/:userId", isAdminOrEmployee, requirePermission("view_edit_tokens"), async (req: any, res) => {
    try {
      const tokens = await storage.getOrCreateEditTokens(req.params.userId);
      res.json(tokens);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/edit-tokens/:userId", isAdminOrEmployee, requirePermission("adjust_tokens"), async (req: any, res) => {
    try {
      const { annual, purchased } = req.body;
      const tokens = await storage.adjustTokens(req.params.userId, annual, purchased);
      res.json(tokens);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/edit-requests", isAdminOrEmployee, requirePermission("view_edit_requests"), async (_req: any, res) => {
    try {
      const requests = await storage.getEditRequests();
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/edit-requests/:id/photos", isAdminOrEmployee, requirePermission("view_edit_requests"), async (req: any, res) => {
    try {
      const photos = await storage.getEditRequestPhotos(req.params.id);
      res.json(photos);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/edit-requests/:id", isAdmin, async (req: any, res) => {
    try {
      const request = await storage.getEditRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Edit request not found" });
      }

      const photos = await storage.getEditRequestPhotos(request.id);
      for (const photo of photos) {
        await deleteFromObjectStorage(photo.imageUrl);
      }

      const annualRefund = request.annualTokensUsed;
      const purchasedRefund = request.purchasedTokensUsed;
      if (annualRefund > 0 || purchasedRefund > 0) {
        await storage.refundEditRequestTokens(request.userId, annualRefund, purchasedRefund);
      }

      await storage.deleteEditRequest(request.id);
      res.json({ success: true, refunded: { annual: annualRefund, purchased: purchasedRefund } });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete edit request" });
    }
  });

  app.post("/api/admin/edit-photos/:photoId/finished", isAdminOrEmployee, requirePermission("upload_finished_photos"), upload.single("photo"), async (req: any, res) => {
    const file = req.file as Express.Multer.File | undefined;
    try {
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const photo = await storage.getEditRequestPhotoById(req.params.photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      if (photo.finishedImageUrl) {
        await deleteFromObjectStorage(photo.finishedImageUrl).catch(() => {});
      }
      const contentType = file.mimetype || "application/octet-stream";
      const objectPath = await uploadFileFromDisk(file.path, contentType);
      const updated = await storage.updateEditRequestPhoto(photo.id, {
        finishedImageUrl: objectPath,
        finishedFilename: file.originalname,
      });
      res.json(updated);
    } catch (err: any) {
      if (file) await fs.promises.unlink(file.path).catch(() => {});
      res.status(500).json({ message: err.message || "Failed to upload finished photo" });
    }
  });

  app.get("/api/admin/token-transactions/:userId", isAdminOrEmployee, requirePermission("view_edit_tokens"), async (req: any, res) => {
    try {
      const transactions = await storage.getTokenTransactions(req.params.userId);
      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/all-edit-tokens", isAdminOrEmployee, requirePermission("view_edit_tokens"), async (_req: any, res) => {
    try {
      const tokens = await storage.getAllEditTokens();
      res.json(tokens);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/edit-requests/:id/photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const editRequest = await storage.getEditRequestById(req.params.id);
      if (!editRequest || editRequest.userId !== userId) {
        return res.status(404).json({ message: "Edit request not found" });
      }
      const photos = await storage.getEditRequestPhotos(req.params.id);
      res.json(photos);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/edit-requests/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const editRequest = await storage.getEditRequestById(req.params.id);
      if (!editRequest || editRequest.userId !== userId) {
        return res.status(404).json({ message: "Edit request not found" });
      }
      const messages = await storage.getEditRequestMessages(req.params.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to get messages" });
    }
  });

  app.post("/api/edit-requests/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const editRequest = await storage.getEditRequestById(req.params.id);
      if (!editRequest || editRequest.userId !== userId) {
        return res.status(404).json({ message: "Edit request not found" });
      }
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      const senderName = await getClientDisplayName(req.user.claims, userId);
      const msg = await storage.createEditRequestMessage({
        editRequestId: req.params.id,
        senderId: userId,
        senderRole: "client",
        senderName,
        message: message.trim(),
      });
      sendPushToRole("admin", {
        title: `${senderName} sent a message`,
        body: message.trim().slice(0, 100),
        url: "/admin",
        tag: `chat-${req.params.id}`,
      }).catch(() => {});
      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to send message" });
    }
  });

  app.get("/api/admin/edit-requests/:id/messages", isAdminOrEmployee, requirePermission("chat_edit_requests"), async (req: any, res) => {
    try {
      const messages = await storage.getEditRequestMessages(req.params.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to get messages" });
    }
  });

  app.post("/api/admin/edit-requests/:id/messages", isAdminOrEmployee, requirePermission("chat_edit_requests"), async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      const editRequest = await storage.getEditRequestById(req.params.id);
      const msg = await storage.createEditRequestMessage({
        editRequestId: req.params.id,
        senderId: "admin",
        senderRole: "admin",
        senderName: "Armando R.",
        message: message.trim(),
      });
      if (editRequest) {
        sendPushToUser(editRequest.userId, {
          title: "Armando R. replied to your edit request",
          body: message.trim().slice(0, 100),
          url: "/portal",
          tag: `chat-${req.params.id}`,
        }).catch(() => {});
      }
      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to send message" });
    }
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: "Invalid subscription" });
      }
      await storage.savePushSubscription({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        role: "client",
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", isAuthenticated, async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await storage.deletePushSubscription(endpoint);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to unsubscribe" });
    }
  });

  app.post("/api/admin/push/subscribe", isAdmin, async (req: any, res) => {
    try {
      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: "Invalid subscription" });
      }
      await storage.savePushSubscription({
        userId: "admin",
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        role: "admin",
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to save subscription" });
    }
  });

  app.get("/api/push/vapid-key", (_req, res) => {
    res.json({ key: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.get("/api/featured/categories", async (_req, res) => {
    try {
      const isDev = process.env.NODE_ENV !== "production";
      const categories = await storage.getFeaturedCategories({ includeSamples: isDev });
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/featured/professional-of-the-week", async (_req, res) => {
    try {
      const isDev = process.env.NODE_ENV !== "production";
      const pro = await storage.getFeaturedOfWeek({ includeSamples: isDev });
      res.json(pro || null);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/featured/:slug", async (req, res) => {
    try {
      const pro = await storage.getFeaturedProfessionalBySlug(req.params.slug);
      if (!pro) return res.status(404).json({ message: "Professional not found" });
      if (pro.isSample && process.env.NODE_ENV === "production") {
        return res.status(404).json({ message: "Professional not found" });
      }
      res.json(pro);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/featured", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const isDev = process.env.NODE_ENV !== "production";
      const includeSamples = isDev;
      const pros = await storage.getFeaturedProfessionals({ category, includeSamples });
      res.json(pros);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/featured", isAdmin, async (_req, res) => {
    try {
      const pros = await storage.getFeaturedProfessionals({ includeSamples: true });
      res.json(pros);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/featured", isAdmin, async (req, res) => {
    try {
      const validated = insertFeaturedProfessionalSchema.parse(req.body);
      const pro = await storage.createFeaturedProfessional(validated);
      res.status(201).json(pro);
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(err).message });
      }
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/featured/:id", isAdmin, async (req, res) => {
    try {
      const validated = insertFeaturedProfessionalSchema.partial().parse(req.body);
      const pro = await storage.updateFeaturedProfessional(req.params.id, validated);
      res.json(pro);
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(err).message });
      }
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/featured/:id", isAdmin, async (req, res) => {
    try {
      const pro = await storage.getFeaturedProfessionalById(req.params.id);
      if (pro?.portraitImageUrl) {
        const key = pro.portraitImageUrl.replace("/objects/", "");
        try { await objectStorageClient.delete(key); } catch {}
      }
      await storage.deleteFeaturedProfessional(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/featured/:id/upload-portrait", isAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const objectKey = `uploads/featured-${randomUUID()}.webp`;
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/${objectKey}`;
      const parts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
      const bucketName = parts[0];
      const objectName = parts.slice(1).join("/");
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const rawBuffer = fs.readFileSync(req.file.path);
      const processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90, effort: 4 })
        .toBuffer();
      await file.save(processedBuffer, { resumable: false, metadata: { contentType: "image/webp" } });
      fs.unlinkSync(req.file.path);
      const imageUrl = `/objects/${objectKey}`;
      const pro = await storage.updateFeaturedProfessional(req.params.id, { portraitImageUrl: imageUrl });
      res.json(pro);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/nominations", async (req, res) => {
    try {
      const validated = insertNominationSchema.parse(req.body);
      const nomination = await storage.createNomination(validated);
      res.json(nomination);
    } catch (err: any) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/nominations", isAdmin, async (_req, res) => {
    try {
      const noms = await storage.getNominations();
      res.json(noms);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/nominations/:id", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const nom = await storage.updateNominationStatus(req.params.id, status);
      res.json(nom);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/nominations/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteNomination(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const validated = insertNewsletterSubscriberSchema.parse(req.body);
      const subscriber = await storage.createNewsletterSubscriber(validated);
      res.json(subscriber);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.json({ alreadySubscribed: true });
      }
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/newsletter", isAdmin, async (_req, res) => {
    try {
      const subs = await storage.getNewsletterSubscribers();
      res.json(subs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/featured/seed", isAdmin, async (_req, res) => {
    try {
      const { seedFeaturedProfessionals } = await import("./seed-featured");
      const result = await seedFeaturedProfessionals();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const SITE_URL = "https://alignphotodesign.com";

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /portal
Disallow: /employee
Disallow: /api/

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Anthropic
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const includeSamples = process.env.NODE_ENV !== "production" ? true : false;
    let featuredSlugs: string[] = [];
    try {
      const pros = await storage.getFeaturedProfessionals(includeSamples);
      featuredSlugs = pros.map((p: any) => p.slug);
    } catch {}

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/portfolio", priority: "0.8", changefreq: "weekly" },
      { loc: "/featured", priority: "0.8", changefreq: "weekly" },
    ];

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    for (const slug of featuredSlugs) {
      const encodedSlug = encodeURIComponent(slug).replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      xml += `  <url>
    <loc>${SITE_URL}/featured/${encodedSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;
    res.type("application/xml").send(xml);
  });

  app.get("/llms.txt", (_req, res) => {
    res.type("text/plain").send(`# Align — Personal Branding Portrait Photographer in Miami

## About
Align is a personal branding portrait photography studio based in Miami, Florida. We specialize in creating professional portraits and headshots for therapists, chefs, electricians, plumbers, personal trainers, realtors, and other small business professionals. Our mission is to help professionals look as trustworthy and competent as they are, so their portrait makes the right first impression before any conversation begins.

## Services
- Personal Branding Portraits: Custom portrait sessions designed around a client's brand identity, environment, and emotional tone.
- Professional Headshots: High-quality headshots for websites, social media, and professional directories.
- Small Business Photography: Branding photography packages for chefs, trainers, tradespeople, and service professionals.

## How It Works
Clients use an interactive online configurator to design their photoshoot in 6 steps:
1. Choose profession/industry
2. Select an environment (office, kitchen, gym, urban, nature, restaurant, studio)
3. Define a brand message (assured, confidence, approachable, bold, warmth)
4. Pick an emotional impact (bright, cozy, cinematic, powerful)
5. Review a personalized concept summary with clothing recommendations
6. Book a session or request a collaboration

## Pricing
- Indoor sessions (office, kitchen, studio): Starting at $200
- Outdoor sessions (urban, nature): Starting at $250
- Premium environments (restaurant, gym): Starting at $300
- Edit tokens available for individual photo retouching

## Location
Miami, Florida (serving the greater Miami-Dade area)

## Contact
Website: ${SITE_URL}
Email: ArmandoRamirezRomero89@gmail.com

## Featured Professionals
Align showcases a community directory of featured professionals who have completed portrait sessions. Visit ${SITE_URL}/featured to see their profiles and portfolios.

## Key Pages
- Home / Configurator: ${SITE_URL}/
- Portfolio: ${SITE_URL}/portfolio
- Featured Professionals: ${SITE_URL}/featured
`);
  });

  app.get("/llms-full.txt", async (_req, res) => {
    const includeSamples = process.env.NODE_ENV !== "production" ? true : false;
    let featuredSection = "";
    try {
      const pros = await storage.getFeaturedProfessionals(includeSamples);
      if (pros.length > 0) {
        featuredSection = "\n## Featured Professionals Directory\n\n";
        for (const p of pros) {
          featuredSection += `### ${(p as any).name} — ${(p as any).profession}\n`;
          featuredSection += `${(p as any).bio}\n`;
          featuredSection += `Profile: ${SITE_URL}/featured/${(p as any).slug}\n\n`;
        }
      }
    } catch {}

    res.type("text/plain").send(`# Align — Personal Branding Portrait Photographer in Miami (Full Context)

## About
Align is a personal branding portrait photography studio in Miami, Florida, helping professionals create portraits that make the right first impression. We work with therapists, counselors, chefs, culinary professionals, electricians, plumbers, HVAC technicians, personal trainers, fitness coaches, realtors, barbers, hairstylists, graphic designers, creative professionals, and other small business owners.

## Service Details

### Interactive Photoshoot Configurator
Our website features a 6-step interactive tool that lets clients design their photoshoot concept:
1. Profession selection (therapist, chef, trainer, tradesperson, creative, etc.)
2. Environment (office, kitchen, gym, urban, nature, restaurant, studio)
3. Brand message (assured, confidence, approachable, bold, warmth)
4. Emotional impact (bright, cozy, cinematic, powerful)
5. Concept review with AI-generated clothing recommendations based on selections
6. Booking with 50% downpayment via Stripe or collaboration request

### Client Portal
After booking, clients receive access to a private portal where they can:
- View their finished photos in a side-by-side comparison gallery
- Purchase edit tokens for additional retouching
- Chat directly with their photographer
- Download their final images

### Pricing
- Indoor environments (office, kitchen, studio): Starting at $200
- Outdoor environments (urban, nature): Starting at $250
- Premium environments (restaurant, gym): Starting at $300
- Edit tokens: Available for individual photo retouching requests
- 50% downpayment required at booking, remainder due at session

## Location & Service Area
Based in Miami, Florida, serving all of Miami-Dade County and surrounding areas including:
- Miami Beach, Coral Gables, Coconut Grove, Wynwood, Brickell, Doral, Hialeah, Kendall, Homestead
${featuredSection}
## Contact Information
- Website: ${SITE_URL}
- Email: ArmandoRamirezRomero89@gmail.com
- Hours: Monday-Sunday 8:00 AM - 8:00 PM

## Technical Details
- Built with React, Express, PostgreSQL
- Mobile-first responsive design
- Stripe-powered secure payments
- Real-time push notifications
`);
  });

  return httpServer;
}
