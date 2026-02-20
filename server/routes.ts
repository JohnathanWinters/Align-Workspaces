import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPortfolioPhotoSchema, insertShootSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendBookingNotification, sendHelpRequest, sendCollaborateMessage } from "./gmail";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { calculatePricing } from "@shared/pricing";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { randomUUID, createHash } from "crypto";
import { objectStorageClient, ObjectStorageService, ObjectNotFoundError } from "./replit_integrations/object_storage";
import { authStorage } from "./replit_integrations/auth";

const objectStorageService = new ObjectStorageService();

const uploadDir = path.join(process.cwd(), "uploads");

const upload = multer({
  storage: multer.memoryStorage(),
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

function isAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  const token = authHeader.slice(7);
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Invalid admin credentials" });
  }
  next();
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

  // Admin: list all users
  app.get("/api/admin/users", isAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch {
      res.status(500).json({ message: "Failed to fetch users" });
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
  app.get("/api/admin/shoots", isAdmin, async (_req, res) => {
    try {
      const allShoots = await storage.getAllShoots();
      res.json(allShoots);
    } catch {
      res.status(500).json({ message: "Failed to fetch shoots" });
    }
  });

  // Admin: create shoot for a user
  app.post("/api/admin/shoots", isAdmin, async (req, res) => {
    try {
      const data = insertShootSchema.parse(req.body);
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

  // Admin: update a shoot
  app.patch("/api/admin/shoots/:id", isAdmin, async (req, res) => {
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
  app.get("/api/admin/shoots/:id/gallery", isAdmin, async (req, res) => {
    try {
      const images = await storage.getGalleryImages(req.params.id as string);
      res.json(images);
    } catch {
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  // Admin: add gallery image
  app.post("/api/admin/gallery", isAdmin, async (req, res) => {
    try {
      const image = await storage.createGalleryImage(req.body);
      res.status(201).json(image);
    } catch {
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });

  // Admin: delete gallery image (also removes file from storage)
  app.delete("/api/admin/gallery/:id", isAdmin, async (req, res) => {
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
  app.post("/api/admin/shoots/:id/upload", isAdmin, upload.array("photos", 50), async (req: any, res) => {
    try {
      const shootId = req.params.id as string;
      const folderId = req.body.folderId || null;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const images = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const contentType = file.mimetype || "application/octet-stream";
        const objectPath = await uploadBufferToObjectStorage(file.buffer, contentType);
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
      res.status(500).json({ message: err.message || "Failed to upload photos" });
    }
  });

  // Serve files from Object Storage
  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      const objectPath = req.path;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
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
  app.get("/api/admin/shoots/:id/folders", isAdmin, async (req, res) => {
    try {
      const folders = await storage.getFolders(req.params.id as string);
      res.json(folders);
    } catch {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/admin/folders", isAdmin, async (req, res) => {
    try {
      const folder = await storage.createFolder(req.body);
      res.status(201).json(folder);
    } catch {
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.patch("/api/admin/folders/:id", isAdmin, async (req, res) => {
    try {
      const folder = await storage.updateFolder(req.params.id as string, req.body);
      res.json(folder);
    } catch {
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.delete("/api/admin/folders/:id", isAdmin, async (req, res) => {
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

  return httpServer;
}
