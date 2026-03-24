import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPortfolioPhotoSchema, insertShootSchema, insertFeaturedProfessionalSchema, insertNominationSchema, insertNewsletterSubscriberSchema, shoots, pageViews, analyticsEvents, spaceBookings, referralLinks, arrivalGuides, arrivalGuideSteps, teamMembers, invoicePayments } from "@shared/schema";
import { db } from "./db";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendBookingNotification, sendHelpRequest, sendCollaborateMessage, sendEditRequestNotification, sendNewSpaceSubmissionNotification, sendSpaceBookingNotification, sendMagicLinkEmail, sendQuickClientMessage, getGmailAuthUrl, exchangeGmailCode } from "./gmail";
import { sendPushToUser, sendPushToRole, cancelEmailFallback } from "./pushNotifications";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { calculatePricing, calculateSpaceBookingFees, resolveFeeTier, type FeeTier, FEE_TIERS, TAX_RATES, DEFAULT_TAX_JURISDICTION } from "@shared/pricing";
import { createBookingCalendarEvent, createShootCalendarEvent, deleteBookingCalendarEvent, generateAddToCalendarUrl } from "./googleCalendar";
import { calculateRefundAmount, processCompletedBookings, processPendingPayouts, processBookingNotifications, holdPayout, releasePayout, reversePayout } from "./payouts";
import { isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import sharp from "sharp";
import { randomUUID, createHash, scryptSync, randomBytes } from "crypto";
import { uploadBuffer, uploadFile, deleteObject, getObjectStream, serveObject, ObjectNotFoundError } from "./fileStorage";
import { authStorage } from "./auth";
import { users } from "@shared/models/auth";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { magicTokens } from "@shared/models/auth";

function cleanAddressForGeocoding(address: string): string {
  let cleaned = address
    .replace(/(\d)([A-Z][a-z])/g, "$1, $2")
    .replace(/\b(suite|ste|unit|apt|apartment|bldg|building|floor|rm|room|#)\s*[0-9]+[a-z]?(?:\s*,|\s|$)/gi, " ")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned;
}

async function geocodeAddress(address: string): Promise<{ lat: string; lng: string } | null> {
  try {
    const cleaned = cleanAddressForGeocoding(address);
    const encoded = encodeURIComponent(cleaned);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AlignSpaces/1.0 (alignworkspaces.com)" },
    });
    if (!res.ok) return null;
    const results = await res.json() as Array<{ lat: string; lon: string }>;
    if (results.length > 0) {
      return { lat: results[0].lat, lng: results[0].lon };
    }
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

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

async function uploadBufferToObjectStorage(buffer: Buffer, contentType: string): Promise<string> {
  return uploadBuffer(buffer, contentType);
}

async function uploadFileFromDisk(filePath: string, contentType: string): Promise<string> {
  return uploadFile(filePath, contentType);
}

async function deleteFromObjectStorage(imageUrl: string): Promise<void> {
  await deleteObject(imageUrl);
}

async function getImageStream(imageUrl: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> {
  try {
    if (imageUrl.startsWith("/objects/")) {
      return getObjectStream(imageUrl);
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

function generateReferralCode(): string {
  // 8-char alphanumeric code, URL-safe
  return randomBytes(6).toString("base64url").slice(0, 8);
}

const AUTHORIZED_ADMIN_EMAILS = [
  "armandoramirezromero89@gmail.com",
  "armando@alignworkspaces.com",
  "edith@alignworkspaces.com",
  "connect@edithcaballero.com",
];

function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Session-based admin auth (magic link only)
  if ((req as any).session?.adminEmail && AUTHORIZED_ADMIN_EMAILS.includes((req as any).session.adminEmail)) {
    (req as any).adminRole = "admin";
    return next();
  }
  return res.status(401).json({ message: "Admin authentication required" });
}

async function isAdminOrEmployee(req: Request, res: Response, next: NextFunction) {
  // Session-based admin auth (magic link only)
  if ((req as any).session?.adminEmail && AUTHORIZED_ADMIN_EMAILS.includes((req as any).session.adminEmail)) {
    (req as any).adminRole = "admin";
    return next();
  }
  // Employee Bearer token auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = authHeader.slice(7);
  if (token.startsWith("emp:")) {
    const parts = token.split(":");
    const empId = parts[1];
    const empRole = parts[2];
    if (empId && empRole) {
      // Validate employee exists, is active, and role matches
      const employee = await storage.getEmployeeById(empId);
      if (!employee || employee.active !== 1 || employee.role !== empRole) {
        return res.status(403).json({ message: "Invalid or inactive employee credentials" });
      }
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
  // Gmail OAuth2 setup — visit /api/gmail/authorize to start the one-time flow
  app.get("/api/gmail/authorize", (_req, res) => {
    const url = getGmailAuthUrl();
    res.redirect(url);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).send("Missing code parameter");
      const refreshToken = await exchangeGmailCode(code);
      res.send(`<h2>Success!</h2><p>Add this to your <code>.env</code> file:</p><pre>GMAIL_REFRESH_TOKEN=${refreshToken}</pre><p>Then restart the server.</p>`);
    } catch (err: any) {
      console.error("Gmail OAuth callback error:", err);
      const safeMsg = String(err.message || "Unknown error").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      res.status(500).send(`<h2>Error</h2><pre>${safeMsg}</pre>`);
    }
  });

  // Test email endpoint
  app.post("/api/test-email", isAdmin, async (req, res) => {
    try {
      await sendHelpRequest({
        clientName: "Test User",
        clientEmail: "armando@alignworkspaces.com",
        message: "This is a test email from Align Workspaces to verify the email system is working correctly.",
      });
      res.json({ success: true, message: "Test email sent to admin" });
    } catch (err: any) {
      console.error("Test email failed:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/auth/profile-photo", isAuthenticated, upload.single("photo"), async (req: any, res) => {
    try {
      const userId = req.session?.magicUserId || req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!req.file) return res.status(400).json({ message: "No file provided" });

      const buffer = await sharp(req.file.path)
        .rotate()
        .resize(400, 400, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      await fs.promises.unlink(req.file.path).catch(() => {});

      const objectUrl = await uploadBufferToObjectStorage(buffer, "image/webp");

      const [updated] = await db.update(users).set({
        profileImageUrl: objectUrl,
        updatedAt: new Date(),
      }).where(eq(users.id, userId)).returning();

      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _p, pendingEmail: _pe, pendingEmailToken: _pt, pendingEmailExpiresAt: _pea, ...safe } = updated;
      res.json(safe);
    } catch (error: any) {
      console.error("Profile photo upload error:", error);
      if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.post("/api/admin/users/:id/photo", isAdmin, upload.single("photo"), async (req: any, res) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ message: "No file provided" });

      const buffer = await sharp(req.file.path)
        .rotate()
        .resize(400, 400, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      await fs.promises.unlink(req.file.path).catch(() => {});

      const objectUrl = await uploadBufferToObjectStorage(buffer, "image/webp");

      const [updated] = await db.update(users).set({
        profileImageUrl: objectUrl,
        updatedAt: new Date(),
      }).where(eq(users.id, id)).returning();

      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _p, pendingEmail: _pe, pendingEmailToken: _pt, pendingEmailExpiresAt: _pea, ...safe } = updated;
      res.json(safe);
    } catch (error: any) {
      console.error("Admin photo upload error:", error);
      if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

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

      storage.createPipelineContact({
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: "website",
        category: "portraits",
        stage: "new",
        notes: data.notes || undefined,
        leadId: lead.id,
        estimatedValue: data.estimatedMin,
      }).catch((err) => console.error("Failed to create pipeline contact:", err));

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  app.get("/api/leads", isAdmin, async (_req, res) => {
    try {
      const allLeads = await storage.getLeads();
      res.json(allLeads);
    } catch {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/portfolio-photos", isAdmin, async (req, res) => {
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
      const { environment, brandMessage, emotionalImpact, category } = req.query;
      if (environment && brandMessage && emotionalImpact) {
        const photos = await storage.getPortfolioPhotosByTags(
          environment as string,
          brandMessage as string,
          emotionalImpact as string
        );
        res.json(photos);
      } else {
        let photos = await storage.getPortfolioPhotos();
        if (category) {
          photos = photos.filter(p => p.category === category);
        }
        res.json(photos);
      }
    } catch {
      res.status(500).json({ message: "Failed to fetch portfolio photos" });
    }
  });

  app.get("/api/portfolio-photos/by-space/:spaceId", async (req, res) => {
    try {
      const photos = await storage.getPortfolioPhotosBySpace(req.params.spaceId);
      res.json(photos);
    } catch {
      res.status(500).json({ message: "Failed to fetch photos for space" });
    }
  });

  app.post("/api/admin/portfolio/upload", isAdmin, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const rawBuffer = await fs.promises.readFile(req.file.path);
      const processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90, effort: 4 })
        .toBuffer();
      await fs.promises.unlink(req.file.path);
      const imageUrl = await uploadBuffer(processedBuffer, "image/webp");
      const environments = JSON.parse(req.body.environments || "[]");
      const brandMessages = JSON.parse(req.body.brandMessages || "[]");
      const emotionalImpacts = JSON.parse(req.body.emotionalImpacts || "[]");
      const colorPalette = JSON.parse(req.body.colorPalette || "[]");
      const category = req.body.category || "people";
      const photo = await storage.createPortfolioPhoto({
        imageUrl,
        environments,
        brandMessages,
        emotionalImpacts,
        colorPalette,
        category,
      });
      res.json(photo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/portfolio/:id/before-image", isAdmin, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const existing = await storage.getPortfolioPhoto(req.params.id);
      if (existing && (existing as any).beforeImageUrl && (existing as any).beforeImageUrl.startsWith("/objects/uploads/")) {
        try {
          await deleteObject((existing as any).beforeImageUrl);
        } catch {}
      }
      const rawBuffer = await fs.promises.readFile(req.file.path);
      const processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
      await fs.promises.unlink(req.file.path);
      const beforeImageUrl = await uploadBuffer(processedBuffer, "image/webp");
      const photo = await storage.updatePortfolioPhoto(req.params.id, { beforeImageUrl } as any);
      res.json(photo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/portfolio/reorder", isAdmin, async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) return res.status(400).json({ message: "orderedIds array required" });
      for (let i = 0; i < orderedIds.length; i++) {
        await storage.updatePortfolioPhoto(orderedIds[i], { displayOrder: i } as any);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/portfolio/:id", isAdmin, async (req, res) => {
    try {
      const { environments, brandMessages, emotionalImpacts, colorPalette, locationSpaceId, category, cropPosition, subjectName, subjectProfession, subjectBio, beforeImageUrl } = req.body;
      const updates: any = {
        environments,
        brandMessages,
        emotionalImpacts,
        colorPalette,
        locationSpaceId: locationSpaceId || null,
        subjectName: subjectName || null,
        subjectProfession: subjectProfession || null,
        subjectBio: subjectBio || null,
        beforeImageUrl: beforeImageUrl || null,
      };
      if (category) updates.category = category;
      if (cropPosition && typeof cropPosition === "object" && typeof cropPosition.x === "number" && typeof cropPosition.y === "number") {
        updates.cropPosition = {
          x: Math.max(0, Math.min(100, cropPosition.x)),
          y: Math.max(0, Math.min(100, cropPosition.y)),
          zoom: Math.max(1, Math.min(2, cropPosition.zoom ?? 1)),
        };
      }
      const photo = await storage.updatePortfolioPhoto(req.params.id, updates);
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

  app.post("/api/stripe/connect/onboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const stripe = await getUncachableStripeClient();
      let accountId = user.stripeAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email || req.user.claims.email,
          metadata: { alignUserId: userId },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;
        await storage.updateUserStripeAccount(userId, accountId, "false");
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/portal?stripe_connect=refresh`,
        return_url: `${baseUrl}/portal?stripe_connect=return`,
        type: "account_onboarding",
      });

      res.json({ url: accountLink.url });
    } catch (err: any) {
      console.error("Stripe Connect onboard error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/stripe/connect/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.stripeAccountId) {
        return res.json({ connected: false, onboardingComplete: false });
      }

      const stripe = await getUncachableStripeClient();
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      const onboardingComplete = (account.charges_enabled && account.payouts_enabled) || account.details_submitted;

      if (onboardingComplete && user.stripeOnboardingComplete !== "true") {
        await storage.updateUserStripeAccount(userId, user.stripeAccountId, "true");
      }

      res.json({
        connected: true,
        onboardingComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        accountId: user.stripeAccountId,
      });
    } catch (err: any) {
      console.error("Stripe Connect status error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/stripe/connect/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      if (!user?.stripeAccountId) return res.status(400).json({ message: "No Stripe account connected" });

      const stripe = await getUncachableStripeClient();
      const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
      res.json({ url: loginLink.url });
    } catch (err: any) {
      console.error("Stripe Connect dashboard error:", err);
      res.status(500).json({ message: err.message });
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
      const userShoots = await storage.getShootsByUser(userId);
      // Attach gallery image count and cover image to each shoot
      const enriched = await Promise.all(userShoots.map(async (shoot) => {
        const images = await storage.getGalleryImages(shoot.id);
        return {
          ...shoot,
          galleryCount: images.length,
          coverImageUrl: images.length > 0 ? images[0].imageUrl : null,
        };
      }));
      res.json(enriched);
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

  // Admin auth: magic link request
  app.post("/api/admin/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (!AUTHORIZED_ADMIN_EMAILS.includes(normalizedEmail)) {
        // Return success even for unauthorized emails to prevent email enumeration
        return res.json({ sent: true });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(magicTokens).values({
        email: normalizedEmail,
        token,
        expiresAt,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const magicUrl = `${baseUrl}/api/admin/magic-verify?token=${token}`;

      await sendMagicLinkEmail(normalizedEmail, magicUrl);
      res.json({ sent: true });
    } catch (err: any) {
      console.error("Admin magic link error:", err);
      res.status(500).json({ message: "Failed to send sign-in link" });
    }
  });

  // Admin auth: magic link verification
  app.get("/api/admin/magic-verify", async (req: any, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/admin?auth=invalid");
      }

      const [magicToken] = await db
        .select()
        .from(magicTokens)
        .where(
          and(
            eq(magicTokens.token, token),
            eq(magicTokens.used, false),
            gt(magicTokens.expiresAt, new Date())
          )
        );

      if (!magicToken) {
        return res.redirect("/admin?auth=expired");
      }

      if (!AUTHORIZED_ADMIN_EMAILS.includes(magicToken.email)) {
        return res.redirect("/admin?auth=unauthorized");
      }

      await db.update(magicTokens).set({ used: true }).where(eq(magicTokens.id, magicToken.id));

      req.session.adminEmail = magicToken.email;
      req.session.save((err: any) => {
        if (err) console.error("Admin session save error:", err);
        res.redirect("/admin");
      });
    } catch (err: any) {
      console.error("Admin magic verify error:", err);
      res.redirect("/admin?auth=error");
    }
  });

  // Admin auth: check session
  app.get("/api/admin/me", (req: any, res) => {
    if (req.session?.adminEmail && AUTHORIZED_ADMIN_EMAILS.includes(req.session.adminEmail)) {
      return res.json({ authenticated: true, email: req.session.adminEmail });
    }
    return res.status(401).json({ authenticated: false });
  });

  // Admin auth: logout
  app.post("/api/admin/logout", (req: any, res) => {
    delete req.session.adminEmail;
    req.session.save((err: any) => {
      if (err) console.error("Admin logout session save error:", err);
      res.json({ success: true });
    });
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

  // Test client email to exclude from admin views
  const TEST_CLIENT_EMAIL = "nomad.ar89@yahoo.com";

  app.get("/api/admin/users", isAdminOrEmployee, requirePermission("view_users"), async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.filter(u => u.email !== TEST_CLIENT_EMAIL));
    } catch {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      const { deletePassword } = req.body;
      if (!deletePassword || deletePassword !== process.env.ADMIN_PASSWORD) {
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

  // Upload image for message attachment (authenticated users)
  app.post("/api/messages/upload-image", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No image provided" });
      const raw = await fs.promises.readFile(file.path);
      const buffer = await sharp(raw).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      await fs.promises.unlink(file.path).catch(() => {});
      const imageUrl = await uploadBufferToObjectStorage(buffer, "image/webp");
      res.json({ imageUrl });
    } catch (err: any) {
      console.error("Failed to upload message image:", err);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Upload image for message attachment (admin)
  app.post("/api/admin/messages/upload-image", isAdmin, upload.single("image"), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No image provided" });
      const raw = await fs.promises.readFile(file.path);
      const buffer = await sharp(raw).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      await fs.promises.unlink(file.path).catch(() => {});
      const imageUrl = await uploadBufferToObjectStorage(buffer, "image/webp");
      res.json({ imageUrl });
    } catch (err: any) {
      console.error("Failed to upload message image:", err);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Admin: get all admin conversations
  app.get("/api/admin/conversations", isAdmin, async (_req, res) => {
    try {
      const conversations = (await storage.getAllAdminConversations()).filter(c => !c.id.startsWith("test-"));
      const allUsers = await storage.getAllUsers();
      const enriched = await Promise.all(conversations.map(async (c) => {
        const user = allUsers.find((u) => u.id === c.clientId);
        const latestMessage = await storage.getLatestAdminMessage(c.id);
        const messages = await storage.getAdminMessages(c.id);
        const unreadCount = c.lastReadAdmin
          ? messages.filter((m) => m.createdAt! > c.lastReadAdmin! && m.senderId !== "admin").length
          : messages.filter((m) => m.senderId !== "admin").length;
        return {
          ...c,
          clientName: user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client",
          clientEmail: user?.email || "",
          clientPhoto: user?.profileImageUrl || null,
          latestMessage: latestMessage ? { message: latestMessage.message, createdAt: latestMessage.createdAt, senderRole: latestMessage.senderRole } : null,
          unreadCount,
        };
      }));
      // Sort by latest message time
      enriched.sort((a, b) => {
        const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt!).getTime() : new Date(a.createdAt!).getTime();
        const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt!).getTime() : new Date(b.createdAt!).getTime();
        return bTime - aTime;
      });
      res.json(enriched);
    } catch (err: any) {
      console.error("Failed to fetch admin conversations:", err);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Admin: get or create conversation with a client (no message sent)
  app.post("/api/admin/conversations/:clientId", isAdmin, async (req, res) => {
    try {
      const clientId = req.params.clientId as string;
      const conversation = await storage.getOrCreateAdminConversation(clientId);
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u) => u.id === clientId);
      res.json({
        ...conversation,
        clientName: user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client",
        clientEmail: user?.email || "",
        clientPhoto: user?.profileImageUrl || null,
        latestMessage: null,
        unreadCount: 0,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Admin: send message to client (creates conversation if needed)
  app.post("/api/admin/conversations/:clientId/messages", isAdmin, async (req, res) => {
    try {
      const clientId = req.params.id ? req.params.id as string : req.params.clientId as string;
      const { message, imageUrl } = req.body;
      if (!message?.trim() && !imageUrl) return res.status(400).json({ message: "Message or image is required" });

      const conversation = await storage.getOrCreateAdminConversation(clientId);
      const msg = await storage.createAdminMessage({
        conversationId: conversation.id,
        senderId: "admin",
        senderRole: "admin",
        senderName: "Align",
        message: (message || "").trim(),
        imageUrl: imageUrl || null,
      });

      // Mark as read by admin since they just sent it
      await storage.markAdminConversationRead(conversation.id, "admin");

      // Send push notification to client
      try {
        await sendPushToUser(clientId, {
          title: "New message from Align",
          body: message.trim().substring(0, 100),
          url: "/portal?tab=messages",
        });
      } catch {}

      res.json(msg);
    } catch (err: any) {
      console.error("Failed to send admin message:", err);
      res.status(500).json({ message: err?.message || "Failed to send message" });
    }
  });

  // Admin: get messages for a conversation
  app.get("/api/admin/conversations/:id/messages", isAdmin, async (req, res) => {
    try {
      const messages = await storage.getAdminMessages(req.params.id as string);
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Admin: mark conversation as read
  app.post("/api/admin/conversations/:id/read", isAdmin, async (req, res) => {
    try {
      await storage.markAdminConversationRead(req.params.id as string, "admin");
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Admin: list all shoots (with user info)
  app.get("/api/admin/shoots", isAdminOrEmployee, requirePermission("view_shoots"), async (_req, res) => {
    try {
      const allShoots = await storage.getAllShoots();
      res.json(allShoots.filter(s => !s.id.startsWith("test-")));
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

  // Admin: sync shoot to Google Calendar
  app.post("/api/admin/shoots/:id/calendar", isAdmin, async (req, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id as string);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (!shoot.shootDate) return res.status(400).json({ message: "Shoot must have a date to sync to calendar" });

      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u) => u.id === shoot.userId);
      const clientName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client";

      const eventId = await createShootCalendarEvent({
        shootTitle: shoot.title,
        clientName,
        clientEmail: user?.email || undefined,
        shootDate: shoot.shootDate,
        shootTime: shoot.shootTime || undefined,
        durationHours: Number(shoot.durationHours) || 2,
        location: shoot.location || undefined,
        notes: shoot.notes || undefined,
        shootId: shoot.id,
      });

      await db.update(shoots).set({ googleCalendarEventId: eventId }).where(eq(shoots.id, shoot.id));
      res.json({ success: true, eventId });
    } catch (err: any) {
      console.error("Failed to sync shoot to calendar:", err);
      const detail = err?.response?.data?.error?.message || err?.message || "Failed to sync to calendar";
      res.status(500).json({ message: detail });
    }
  });

  // Admin: remove shoot from Google Calendar
  app.delete("/api/admin/shoots/:id/calendar", isAdmin, async (req, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id as string);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (!shoot.googleCalendarEventId) return res.status(400).json({ message: "Shoot is not synced to calendar" });

      await deleteBookingCalendarEvent(shoot.googleCalendarEventId);
      await db.update(shoots).set({ googleCalendarEventId: null }).where(eq(shoots.id, shoot.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to remove shoot from calendar:", err);
      res.status(500).json({ message: err?.message || "Failed to remove from calendar" });
    }
  });

  // Admin: send quick message to shoot client
  // Admin: get shoot messages
  app.get("/api/admin/shoots/:id/messages", isAdmin, async (req, res) => {
    try {
      const messages = await storage.getShootMessages(req.params.id as string);
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Admin: send shoot message
  app.post("/api/admin/shoots/:id/messages", isAdmin, async (req, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id as string);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });

      const { message, imageUrl } = req.body;
      if (!message?.trim() && !imageUrl) return res.status(400).json({ message: "Message or image is required" });

      const msg = await storage.createShootMessage({
        shootId: shoot.id,
        senderId: "admin",
        senderRole: "admin",
        senderName: "Align Team",
        message: (message || "").trim(),
        imageUrl: imageUrl || null,
      });

      // Also send email notification to client
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u) => u.id === shoot.userId);
      if (user?.email) {
        const clientName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client";
        try {
          await sendQuickClientMessage({
            clientEmail: user.email,
            clientName,
            subject: `New message about ${shoot.title}`,
            message: message.trim(),
            shootTitle: shoot.title,
          });
        } catch (emailErr) {
          console.error("Failed to send email notification:", emailErr);
        }
      }

      res.json(msg);
    } catch (err: any) {
      console.error("Failed to send shoot message:", err);
      res.status(500).json({ message: err?.message || "Failed to send message" });
    }
  });

  // Client: get shoot messages
  app.get("/api/shoots/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const messages = await storage.getShootMessages(req.params.id);
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Client: send shoot message
  app.post("/api/shoots/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });

      const { message, imageUrl } = req.body;
      if (!message?.trim() && !imageUrl) return res.status(400).json({ message: "Message or image is required" });

      const user = await storage.getUserById(req.user.claims.sub);
      const senderName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client";

      const msg = await storage.createShootMessage({
        shootId: shoot.id,
        senderId: req.user.claims.sub,
        senderRole: "client",
        senderName,
        message: (message || "").trim(),
        imageUrl: imageUrl || null,
      });

      res.json(msg);
    } catch (err: any) {
      console.error("Failed to send shoot message:", err);
      res.status(500).json({ message: err?.message || "Failed to send message" });
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
        if (typeof item.amount !== "number" || isNaN(item.amount) || item.amount === 0) {
          return res.status(400).json({ message: "Each line item must have a non-zero amount" });
        }
      }

      const totalAmount = lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);
      if (totalAmount <= 0) {
        return res.status(400).json({ message: "Invoice total must be positive" });
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
        const rawBuffer = await fs.promises.readFile(file.path);

        // Generate optimized display version (2400px wide, WebP 90%)
        const displayBuffer = await sharp(rawBuffer)
          .rotate()
          .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 90, effort: 4 })
          .toBuffer();
        const imageUrl = await uploadBufferToObjectStorage(displayBuffer, "image/webp");

        // Generate thumbnail (800px wide, WebP 80%)
        const thumbBuffer = await sharp(rawBuffer)
          .rotate()
          .resize({ width: 800, height: 1067, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
        const thumbnailUrl = await uploadBufferToObjectStorage(thumbBuffer, "image/webp");

        await fs.promises.unlink(file.path).catch(() => {});

        const image = await storage.createGalleryImage({
          shootId,
          folderId: folderId || null,
          imageUrl,
          thumbnailUrl,
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

  // Serve files from Object Storage (Cloudflare R2)
  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      await serveObject(req.path, res);
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
      res.json(tokens.filter(t => !t.id.startsWith("test-")));
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
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
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
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
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
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
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
        try { await deleteObject(pro.portraitImageUrl); } catch {}
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
      const rawBuffer = await fs.promises.readFile(req.file.path);
      const processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90, effort: 4 })
        .toBuffer();
      await fs.promises.unlink(req.file.path);
      const imageUrl = await uploadBuffer(processedBuffer, "image/webp");
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

      // Sync to Kit (non-blocking)
      import("./kit").then(({ kitSubscribe }) =>
        kitSubscribe({
          email: validated.email,
          firstName: validated.firstName,
          interests: validated.interests || [],
          zipCode: validated.zipCode,
        }).catch(err => console.warn("Kit subscribe sync error (non-fatal):", err.message))
      );

      res.json(subscriber);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.json({ alreadySubscribed: true });
      }
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/newsletter/status", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.json({ subscribed: false });
      const sub = await storage.getNewsletterSubscriberByEmail(email);
      if (!sub) return res.json({ subscribed: false });
      res.json({ subscribed: true, interests: sub.interests || [], zipCode: sub.zipCode });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/newsletter/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      if (!userEmail) return res.status(401).json({ message: "No email found" });
      const sub = await storage.getNewsletterSubscriberByEmail(userEmail);
      if (!sub) return res.status(404).json({ message: "Not subscribed" });
      const { interests, zipCode } = req.body;
      const updated = await storage.updateNewsletterSubscriber(sub.id, {
        ...(interests !== undefined ? { interests } : {}),
        ...(zipCode !== undefined ? { zipCode } : {}),
      });

      // Sync to Kit (non-blocking)
      import("./kit").then(({ kitUpdateSubscriber }) =>
        kitUpdateSubscriber({
          email: userEmail,
          interests: interests || undefined,
          zipCode: zipCode !== undefined ? zipCode : undefined,
        }).catch(err => console.warn("Kit preferences sync error (non-fatal):", err.message))
      );

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/newsletter/unsubscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      if (!userEmail) return res.status(401).json({ message: "No email found" });
      const sub = await storage.getNewsletterSubscriberByEmail(userEmail);
      if (!sub) return res.status(404).json({ message: "Not subscribed" });
      await storage.deleteNewsletterSubscriber(sub.id);

      // Sync to Kit (non-blocking)
      import("./kit").then(({ kitUnsubscribe }) =>
        kitUnsubscribe(userEmail).catch(err => console.warn("Kit unsubscribe sync error (non-fatal):", err.message))
      );

      res.json({ success: true });
    } catch (err: any) {
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

  // ══════════════════════════════════════════════════════════════════
  // DATABASE BACKUPS
  // ══════════════════════════════════════════════════════════════════

  app.post("/api/admin/backup", isAdmin, async (_req, res) => {
    try {
      const { createBackup } = await import("./backup");
      const result = await createBackup();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/backups", isAdmin, async (_req, res) => {
    try {
      const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      const listed = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        Prefix: "backups/",
      }));
      const backups = (listed.Contents || []).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      })).sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
      res.json(backups);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/stripe-sync", isAdmin, async (_req, res) => {
    try {
      const { syncStripeBookings } = await import("./stripe-sync");
      const result = await syncStripeBookings();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/backup/restore", isAdmin, async (req, res) => {
    try {
      const { key } = req.body;
      if (!key || typeof key !== "string" || !key.startsWith("backups/")) {
        return res.status(400).json({ message: "Invalid backup key" });
      }
      const { restoreBackup } = await import("./backup");
      const result = await restoreBackup(key);
      res.json(result);
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

  app.get("/api/spaces", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const spacesList = await storage.getSpaces({ type, includeSamples: true });
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      res.json(spacesList);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/spaces/:slug", async (req, res) => {
    try {
      const space = await storage.getSpaceBySlug(req.params.slug);
      if (!space || space.approvalStatus !== "approved" || space.isActive !== 1) {
        return res.status(404).json({ message: "Space not found" });
      }
      // Include host profile info if the space has an owner
      let hostProfile = null;
      if (space.userId) {
        const hostUser = await storage.getUserById(space.userId);
        if (hostUser) {
          hostProfile = {
            firstName: hostUser.firstName,
            lastName: hostUser.lastName,
            profileImageUrl: hostUser.profileImageUrl,
          };
        }
      }
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      res.json({ ...space, hostProfile });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces", isAdmin, async (req, res) => {
    try {
      const space = await storage.createSpace(req.body);
      res.json(space);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/seed", isAdmin, async (_req, res) => {
    try {
      const sampleSpaces = [
        {
          name: "Serenity Therapy Suite",
          slug: "serenity-therapy-suite",
          type: "therapy",
          description: "A warm, calming therapy office designed for counselors and therapists. Features soft lighting, comfortable seating, and complete sound insulation for private sessions. Located in the heart of Coral Gables with easy parking.",
          shortDescription: "Private therapy office with calming atmosphere in Coral Gables",
          address: "245 Miracle Mile, Coral Gables, FL 33134",
          neighborhood: "Coral Gables",
          pricePerHour: 35,
          pricePerDay: 200,
          capacity: 4,
          amenities: ["Sound insulated", "Comfortable seating", "Soft lighting", "Wi-Fi", "Waiting area", "Private restroom", "Climate control", "Street parking"],
          imageUrls: ["/images/space-therapy-1.png"],
          targetProfession: "Therapists & Counselors",
          availableHours: "Mon-Sat 8:00 AM - 8:00 PM",
          hostName: "Dr. Maria Santos",
          isSample: 1,
          isActive: 1,
        },
        {
          name: "Mindful Space Therapy Room",
          slug: "mindful-space-therapy-room",
          type: "therapy",
          description: "A modern, minimalist therapy room in Brickell perfect for licensed therapists and counselors. The space features natural light, plants, and a neutral palette designed to put clients at ease. Includes a small waiting area and private entrance.",
          shortDescription: "Modern minimalist therapy room in Brickell with natural light",
          address: "1200 Brickell Ave, Suite 310, Miami, FL 33131",
          neighborhood: "Brickell",
          pricePerHour: 45,
          pricePerDay: 250,
          capacity: 3,
          amenities: ["Natural light", "Private entrance", "Waiting room", "Wi-Fi", "Sound machine", "Climate control", "Elevator access", "Valet parking available"],
          imageUrls: ["/images/space-therapy-2.png"],
          targetProfession: "Therapists & Counselors",
          availableHours: "Mon-Fri 7:00 AM - 9:00 PM, Sat 9:00 AM - 5:00 PM",
          hostName: "Wellness Center Brickell",
          isSample: 1,
          isActive: 1,
        },
        {
          name: "Iron District Training Studio",
          slug: "iron-district-training-studio",
          type: "wellness",
          description: "A fully equipped private training studio in Wynwood for personal trainers and fitness coaches. Includes free weights, resistance bands, TRX system, battle ropes, and a turf area. Perfect for 1-on-1 or small group sessions up to 6 people. Industrial aesthetic with natural light.",
          shortDescription: "Private training studio in Wynwood with full equipment",
          address: "2520 NW 2nd Ave, Miami, FL 33127",
          neighborhood: "Wynwood",
          pricePerHour: 40,
          pricePerDay: 220,
          capacity: 6,
          amenities: ["Free weights", "TRX system", "Battle ropes", "Turf area", "Mirrors", "Bluetooth speaker", "Shower", "Wi-Fi", "Parking lot", "Water station"],
          imageUrls: ["/images/space-gym.png"],
          targetProfession: "Personal Trainers & Fitness Coaches",
          availableHours: "Mon-Sun 6:00 AM - 10:00 PM",
          hostName: "Carlos Mendez",
          isSample: 1,
          isActive: 1,
        },
        {
          name: "Elevate Meeting Room",
          slug: "elevate-meeting-room",
          type: "coaching",
          description: "A professional meeting room in Downtown Miami ideal for client consultations, team meetings, and presentations. Features a large conference table seating 8, whiteboard, projector, and floor-to-ceiling windows with skyline views. Perfect for lawyers, realtors, and consultants.",
          shortDescription: "Professional meeting room in Downtown Miami with skyline views",
          address: "100 SE 2nd St, Suite 2400, Miami, FL 33131",
          neighborhood: "Downtown Miami",
          pricePerHour: 55,
          pricePerDay: 300,
          capacity: 8,
          amenities: ["Conference table", "Projector", "Whiteboard", "Wi-Fi", "Coffee station", "Floor-to-ceiling windows", "Skyline views", "Elevator access", "Reception desk"],
          imageUrls: ["/images/space-meeting-1.png"],
          targetProfession: "Lawyers, Realtors & Consultants",
          availableHours: "Mon-Fri 7:00 AM - 8:00 PM",
          hostName: "Miami Business Hub",
          isSample: 1,
          isActive: 1,
        },
        {
          name: "The Coconut Grove Boardroom",
          slug: "coconut-grove-boardroom",
          type: "coaching",
          description: "An intimate, design-forward meeting space in Coconut Grove. Seats up to 6 people around a handcrafted wood table. Features a calming garden courtyard view, espresso machine, and dedicated Wi-Fi. Ideal for small team meetings, strategy sessions, and professional consultations.",
          shortDescription: "Intimate design-forward boardroom in Coconut Grove",
          address: "3390 Mary St, Suite 200, Coconut Grove, FL 33133",
          neighborhood: "Coconut Grove",
          pricePerHour: 40,
          pricePerDay: 220,
          capacity: 6,
          amenities: ["Garden view", "Espresso machine", "Dedicated Wi-Fi", "Whiteboard", "Monitor for presentations", "Natural light", "Street parking", "Bike rack"],
          imageUrls: ["/images/space-meeting-2.png"],
          targetProfession: "Entrepreneurs & Small Business Owners",
          availableHours: "Mon-Sat 8:00 AM - 7:00 PM",
          hostName: "Grove Collective",
          isSample: 1,
          isActive: 1,
        },
      ];

      const results = [];
      for (const s of sampleSpaces) {
        const existing = await storage.getSpaceBySlug(s.slug);
        if (!existing) {
          const created = await storage.createSpace(s);
          results.push(created);
        } else {
          await storage.updateSpace(existing.id, { imageUrls: s.imageUrls, amenities: s.amenities });
        }
      }
      res.json({ seeded: results.length, total: sampleSpaces.length });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/spaces", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { name, type, description, shortDescription, address, neighborhood, pricePerHour, pricePerDay, capacity, amenities, targetProfession, availableHours, hostName } = req.body;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      let latitude: string | null = null;
      let longitude: string | null = null;
      if (address) {
        const coords = await geocodeAddress(address);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      const space = await storage.createSpace({
        name,
        slug,
        type,
        description,
        shortDescription: shortDescription || null,
        address,
        neighborhood: neighborhood || null,
        latitude,
        longitude,
        pricePerHour: parseInt(pricePerHour),
        pricePerDay: pricePerDay ? parseInt(pricePerDay) : null,
        capacity: capacity ? parseInt(capacity) : null,
        amenities: amenities || [],
        imageUrls: [],
        targetProfession: targetProfession || null,
        availableHours: availableHours || null,
        contactEmail: user.claims?.email || null,
        hostName: hostName || user.claims?.first_name || "Space Host",
        userId: user.claims.sub,
        approvalStatus: "pending",
        isSample: 0,
        isActive: 1,
      });

      try {
        await sendNewSpaceSubmissionNotification({
          spaceName: name,
          spaceType: type,
          address,
          hostName: hostName || user.claims?.first_name || "Space Host",
          submitterName: user.claims?.first_name || "Unknown",
          submitterEmail: user.claims?.email || "",
        });
      } catch (emailErr) {
        console.error("Failed to send space submission email:", emailErr);
      }

      res.json(space);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/spaces/:id/photos", isAuthenticated, upload.array("photos", 10), async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      if (space.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No files uploaded" });

      const newUrls: string[] = [];
      for (const f of files) {
        const rawBuffer = await fs.promises.readFile(f.path);
        const processedBuffer = await sharp(rawBuffer)
          .rotate()
          .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85, effort: 4 })
          .toBuffer();
        await fs.promises.unlink(f.path);
        const objectUrl = await uploadBuffer(processedBuffer, "image/webp");
        newUrls.push(objectUrl);
      }

      const existingUrls = space.imageUrls || [];
      const updated = await storage.updateSpace(space.id, { imageUrls: [...existingUrls, ...newUrls] });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/spaces/:id/photos", isAuthenticated, async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      if (space.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });

      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ message: "imageUrl required" });

      const existingUrls = space.imageUrls || [];
      const updated = await storage.updateSpace(space.id, { imageUrls: existingUrls.filter((u: string) => u !== imageUrl) });

      try {
        await deleteObject(imageUrl);
      } catch {}

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/spaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      if (space.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });

      const body = req.body;
      const updates: Record<string, any> = {};

      if (body.name !== undefined) {
        const v = String(body.name).trim();
        if (!v) return res.status(400).json({ message: "Name cannot be empty" });
        updates.name = v;
      }
      if (body.type !== undefined) updates.type = String(body.type).trim();
      if (body.description !== undefined) {
        const v = String(body.description).trim();
        if (!v) return res.status(400).json({ message: "Description cannot be empty" });
        updates.description = v;
      }
      if (body.shortDescription !== undefined) updates.shortDescription = String(body.shortDescription).trim();
      if (body.address !== undefined) {
        const v = String(body.address).trim();
        if (!v) return res.status(400).json({ message: "Address cannot be empty" });
        updates.address = v;
      }
      if (body.neighborhood !== undefined) updates.neighborhood = String(body.neighborhood).trim();
      if (body.hostName !== undefined) updates.hostName = String(body.hostName).trim();
      if (body.contactEmail !== undefined) updates.contactEmail = String(body.contactEmail).trim();
      if (body.targetProfession !== undefined) updates.targetProfession = String(body.targetProfession).trim();
      if (body.availableHours !== undefined) updates.availableHours = String(body.availableHours).trim();
      if (body.cancellationPolicy !== undefined && ["flexible", "moderate", "strict"].includes(body.cancellationPolicy)) {
        updates.cancellationPolicy = body.cancellationPolicy;
      }

      if (body.pricePerHour !== undefined) {
        const n = Number(body.pricePerHour);
        if (isNaN(n) || n < 0) return res.status(400).json({ message: "Invalid price per hour" });
        updates.pricePerHour = n;
      }
      if (body.pricePerDay !== undefined) {
        const n = Number(body.pricePerDay);
        if (isNaN(n) || n < 0) return res.status(400).json({ message: "Invalid price per day" });
        updates.pricePerDay = n;
      }
      if (body.capacity !== undefined) {
        const n = Number(body.capacity);
        if (isNaN(n) || n < 0) return res.status(400).json({ message: "Invalid capacity" });
        updates.capacity = n;
      }
      if (body.amenities !== undefined) {
        if (!Array.isArray(body.amenities)) return res.status(400).json({ message: "Amenities must be an array" });
        updates.amenities = body.amenities.map((a: any) => String(a).trim()).filter(Boolean);
      }

      if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No valid fields to update" });

      if (updates.address && updates.address !== space.address) {
        const coords = await geocodeAddress(updates.address);
        if (coords) {
          updates.latitude = coords.lat;
          updates.longitude = coords.lng;
        }
      }

      const updated = await storage.updateSpace(space.id, updates);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/spaces/:id/photos/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      if (space.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });

      const { imageUrls } = req.body;
      if (!Array.isArray(imageUrls)) return res.status(400).json({ message: "imageUrls must be an array" });

      const existing = space.imageUrls || [];
      const existingSet = new Set(existing);
      const submittedSet = new Set(imageUrls);
      if (imageUrls.length !== existing.length || submittedSet.size !== existing.length) return res.status(400).json({ message: "Must provide exact same photos in new order" });
      for (const url of imageUrls) { if (!existingSet.has(url)) return res.status(400).json({ message: "Unknown photo URL in reorder list" }); }

      const updated = await storage.updateSpace(space.id, { imageUrls });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/my-spaces", isAuthenticated, async (req: any, res) => {
    try {
      const userSpaces = await storage.getSpacesByUser(req.user.claims.sub);
      res.json(userSpaces);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/space-favorites", isAuthenticated, async (req: any, res) => {
    try {
      const favorites = await storage.getSpaceFavorites(req.user.claims.sub);
      const spaceIds = favorites.map(f => f.spaceId);
      const allSpaces = await storage.getSpaces({ includeSamples: true });
      const favoriteSpaces = allSpaces.filter(s => spaceIds.includes(s.id));
      res.json(favoriteSpaces);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-favorites/:spaceId", isAuthenticated, async (req: any, res) => {
    try {
      const fav = await storage.addSpaceFavorite(req.user.claims.sub, req.params.spaceId);
      res.json(fav);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/space-favorites/:spaceId", isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeSpaceFavorite(req.user.claims.sub, req.params.spaceId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/space-favorites/check/:spaceId", isAuthenticated, async (req: any, res) => {
    try {
      const isFav = await storage.isSpaceFavorited(req.user.claims.sub, req.params.spaceId);
      res.json({ favorited: isFav });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/spaces/all", isAdmin, async (_req, res) => {
    try {
      const allSpaces = (await storage.getAllSpaces()).filter(s => !s.id.startsWith("test-"));
      const enriched = await Promise.all(allSpaces.map(async (space) => {
        let ownerInfo = null;
        if (space.userId) {
          try {
            const { authStorage } = await import("./auth");
            const user = await authStorage.getUser(space.userId);
            if (user) {
              ownerInfo = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl };
            }
          } catch {}
        }
        return { ...space, ownerInfo };
      }));
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/spaces/:id", isAdmin, async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.address && !updates.latitude && !updates.longitude) {
        const coords = await geocodeAddress(updates.address);
        if (coords) {
          updates.latitude = coords.lat;
          updates.longitude = coords.lng;
        }
      }
      const space = await storage.updateSpace(req.params.id, updates);
      res.json(space);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/:id/geocode", isAdmin, async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      if (!space.address) return res.status(400).json({ message: "Space has no address" });

      const coords = await geocodeAddress(space.address);
      if (!coords) return res.status(404).json({ message: "Could not geocode this address. Try a more specific address." });

      const updated = await storage.updateSpace(space.id, { latitude: coords.lat, longitude: coords.lng });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/geocode-all", isAdmin, async (_req, res) => {
    try {
      const allSpaces = await storage.getAllSpaces();
      const results: { id: string; name: string; success: boolean }[] = [];
      for (const space of allSpaces) {
        if (space.latitude && space.longitude) {
          results.push({ id: space.id, name: space.name, success: true });
          continue;
        }
        if (!space.address) {
          results.push({ id: space.id, name: space.name, success: false });
          continue;
        }
        const coords = await geocodeAddress(space.address);
        if (coords) {
          await storage.updateSpace(space.id, { latitude: coords.lat, longitude: coords.lng });
          results.push({ id: space.id, name: space.name, success: true });
        } else {
          results.push({ id: space.id, name: space.name, success: false });
        }
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/:id/photos", isAdmin, upload.array("photos", 10), async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No files uploaded" });

      const newUrls: string[] = [];
      for (const f of files) {
        const rawBuffer = await fs.promises.readFile(f.path);
        const processedBuffer = await sharp(rawBuffer)
          .rotate()
          .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85, effort: 4 })
          .toBuffer();
        await fs.promises.unlink(f.path);
        const objectUrl = await uploadBuffer(processedBuffer, "image/webp");
        newUrls.push(objectUrl);
      }

      const existingUrls = space.imageUrls || [];
      const updated = await storage.updateSpace(space.id, { imageUrls: [...existingUrls, ...newUrls] });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/spaces/:id/photos", isAdmin, async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ message: "imageUrl required" });

      const existingUrls = space.imageUrls || [];
      const updated = await storage.updateSpace(space.id, { imageUrls: existingUrls.filter((u: string) => u !== imageUrl) });

      try {
        await deleteObject(imageUrl);
      } catch {}

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/spaces/:id/photos/reorder", isAdmin, async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const { imageUrls } = req.body;
      if (!Array.isArray(imageUrls)) return res.status(400).json({ message: "imageUrls must be an array" });

      const existing = space.imageUrls || [];
      const existingSet = new Set(existing);
      const submittedSet = new Set(imageUrls);
      if (imageUrls.length !== existing.length || submittedSet.size !== existing.length) return res.status(400).json({ message: "Must provide exact same photos in new order" });
      for (const url of imageUrls) { if (!existingSet.has(url)) return res.status(400).json({ message: "Unknown photo URL in reorder list" }); }

      const updated = await storage.updateSpace(space.id, { imageUrls });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/:id/transfer", isAdmin, async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const { newUserId, email } = req.body;
      let targetUserId = newUserId;

      if (email && !newUserId) {
        const user = await storage.getUserByEmail(email.trim().toLowerCase());
        if (!user) return res.status(404).json({ message: "No user found with that email" });
        targetUserId = user.id;
      }

      if (!targetUserId) return res.status(400).json({ message: "email or newUserId required" });

      let newOwnerInfo = null;
      try {
        const { authStorage } = await import("./auth");
        const user = await authStorage.getUser(targetUserId);
        if (user) {
          newOwnerInfo = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
        }
      } catch {}

      const updated = await storage.updateSpace(space.id, { userId: targetUserId });
      res.json({ ...updated, ownerInfo: newOwnerInfo });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/users/search", isAdmin, async (req, res) => {
    try {
      const q = ((req.query.q as string) || "").trim().toLowerCase();
      if (q.length < 2) return res.json([]);
      const allUsers = await storage.getAllUsers();
      const matches = allUsers
        .filter(u => u.email?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q))
        .slice(0, 8)
        .map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName }));
      res.json(matches);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/spaces/pending", isAdmin, async (_req, res) => {
    try {
      const pending = await storage.getPendingSpaces();
      res.json(pending);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/spaces/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteSpace(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/purge-samples", isAdmin, async (_req, res) => {
    try {
      const allSpaces = await storage.getAllSpaces();
      const samples = allSpaces.filter((s: any) => s.isSample === 1);
      for (const s of samples) {
        await storage.deleteSpace(s.id);
      }
      res.json({ deleted: samples.length });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/:id/approve", isAdmin, async (req, res) => {
    try {
      const space = await storage.updateSpace(req.params.id, { approvalStatus: "approved" });
      res.json(space);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/spaces/:id/reject", isAdmin, async (req, res) => {
    try {
      const space = await storage.updateSpace(req.params.id, { approvalStatus: "rejected" });
      res.json(space);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Admin payout management ---

  app.post("/api/admin/payouts/process", isAdmin, async (_req, res) => {
    try {
      const completed = await processCompletedBookings();
      const paid = await processPendingPayouts();
      res.json({ completedBookings: completed, payoutsProcessed: paid });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/notifications/process", isAdmin, async (_req, res) => {
    try {
      await processBookingNotifications();
      res.json({ success: true, message: "Booking notifications processed" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/payouts/:bookingId/hold", isAdmin, async (req, res) => {
    try {
      await holdPayout(req.params.bookingId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/payouts/:bookingId/release", isAdmin, async (req, res) => {
    try {
      await releasePayout(req.params.bookingId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/payouts/:bookingId/reverse", isAdmin, async (req, res) => {
    try {
      await reversePayout(req.params.bookingId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Host payout history ---

  app.get("/api/host/payouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payouts = await storage.getPayoutsByHost(userId);

      const enriched = await Promise.all(payouts.map(async (b) => {
        const space = await storage.getSpaceById(b.spaceId);
        // Host sees: gross booking amount (subtotal), their fee, and net payout
        // Per visibility rules: DO NOT show guest fee amounts or guest totals
        const subtotal = (b.hostPayoutAmount ?? b.hostEarnings ?? 0) + (b.hostFeeAmount ?? 0);
        return {
          id: b.id,
          spaceName: space?.name || "Unknown Space",
          bookingDate: b.bookingDate,
          bookingHours: b.bookingHours,
          bookingAmount: subtotal, // What the host listed (subtotal)
          hostFeeAmount: b.hostFeeAmount,
          hostFeePercent: b.hostFeePercent,
          feeTier: b.feeTier === "host_referred" ? "referral" : b.feeTier === "repeat_guest" ? "repeat" : "standard",
          payoutAmount: b.hostPayoutAmount ?? b.hostEarnings,
          payoutStatus: b.payoutStatus || "pending",
          stripeTransferId: b.stripeTransferId,
          createdAt: b.createdAt,
        };
      }));

      // Summary stats
      const totalEarnings = enriched.reduce((sum, p) => sum + (p.payoutAmount || 0), 0);
      const paidPayouts = enriched.filter(p => p.payoutStatus === "paid");
      const totalPaid = paidPayouts.reduce((sum, p) => sum + (p.payoutAmount || 0), 0);
      const pendingPayouts = enriched.filter(p => p.payoutStatus === "pending" || p.payoutStatus === "processing");
      const totalPending = pendingPayouts.reduce((sum, p) => sum + (p.payoutAmount || 0), 0);

      // Savings vs Peerspace (20% host fee)
      const totalGross = enriched.reduce((sum, p) => sum + (p.bookingAmount || 0), 0);
      const peerspaceWouldCharge = Math.round(totalGross * 0.20);
      const alignCharged = enriched.reduce((sum, p) => sum + (p.hostFeeAmount || 0), 0);
      const savedVsPeerspace = peerspaceWouldCharge - alignCharged;

      res.json({
        payouts: enriched,
        summary: {
          totalEarnings,
          totalPaid,
          totalPending,
          payoutCount: enriched.length,
          savedVsPeerspace,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Host earnings summary ---

  app.get("/api/host/earnings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hostSpaces = await storage.getSpacesByUser(userId);
      if (hostSpaces.length === 0) {
        return res.json({ hasSpaces: false });
      }

      // Get all bookings for host's spaces
      const allBookings: any[] = [];
      for (const space of hostSpaces) {
        const bookings = await storage.getSpaceBookingsBySpace(space.id);
        for (const b of bookings) {
          if (b.paymentStatus === "paid") {
            allBookings.push({ ...b, spaceName: space.name });
          }
        }
      }

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // All-time stats
      let totalEarnings = 0;
      let totalHostFees = 0;
      let monthEarnings = 0;
      let monthHostFees = 0;
      let monthBookingCount = 0;
      const tierCounts: Record<string, number> = { standard: 0, referral: 0, repeat: 0 };

      for (const b of allBookings) {
        const payout = b.hostPayoutAmount ?? b.hostEarnings ?? 0;
        const hostFee = b.hostFeeAmount ?? 0;
        totalEarnings += payout;
        totalHostFees += hostFee;

        const bookingMonth = (b.bookingDate || "").slice(0, 7);
        if (bookingMonth === thisMonth) {
          monthEarnings += payout;
          monthHostFees += hostFee;
          monthBookingCount++;
        }

        const tier = b.feeTier === "host_referred" ? "referral" : b.feeTier === "repeat_guest" ? "repeat" : "standard";
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      }

      // Average fee percentage
      const totalSubtotal = allBookings.reduce((s, b) => s + ((b.hostPayoutAmount ?? b.hostEarnings ?? 0) + (b.hostFeeAmount ?? 0)), 0);
      const avgFeePercent = totalSubtotal > 0 ? ((totalHostFees / totalSubtotal) * 100).toFixed(1) : "0";

      // Savings vs Peerspace (20% host fee)
      const peerspaceMonthFees = Math.round(
        allBookings
          .filter(b => (b.bookingDate || "").slice(0, 7) === thisMonth)
          .reduce((s, b) => s + ((b.hostPayoutAmount ?? b.hostEarnings ?? 0) + (b.hostFeeAmount ?? 0)), 0) * 0.20
      );
      const savedVsPeerspaceMonth = peerspaceMonthFees - monthHostFees;

      res.json({
        hasSpaces: true,
        allTime: {
          totalEarnings,
          totalHostFees,
          bookingCount: allBookings.length,
          avgFeePercent,
        },
        thisMonth: {
          earnings: monthEarnings,
          hostFees: monthHostFees,
          bookingCount: monthBookingCount,
          savedVsPeerspace: savedVsPeerspaceMonth,
        },
        tierBreakdown: tierCounts,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Guest loyalty status ---

  app.get("/api/guest/loyalty", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completedCount = await storage.getCompletedBookingCount(userId);
      const isRepeatGuest = completedCount >= 1;

      // Calculate lifetime loyalty savings from bookings that used repeat_guest tier
      const guestBookings = await storage.getSpaceBookingsByUser(userId);
      const loyaltyBookings = guestBookings.filter(b => b.feeTier === "repeat_guest" && b.paymentStatus === "paid");
      const lifetimeSavings = loyaltyBookings.reduce((sum, b) => {
        // Standard guest fee would be 5%, repeat is 3%, savings = 2% of base
        const baseCents = (b.totalGuestCharged || b.paymentAmount || 0) - (b.guestFeeAmount || b.renterFeeAmount || 0) - (b.taxAmount || 0);
        const wouldHavePaid = Math.round(baseCents * 0.07);
        const actuallyPaid = b.guestFeeAmount || b.renterFeeAmount || 0;
        return sum + Math.max(0, wouldHavePaid - actuallyPaid);
      }, 0);

      // First completed booking date
      const completedBookings = guestBookings
        .filter(b => b.status === "completed")
        .sort((a, b) => new Date(a.bookingDate || "").getTime() - new Date(b.bookingDate || "").getTime());
      const firstCompletedDate = completedBookings[0]?.bookingDate || null;

      res.json({
        isRepeatGuest,
        completedBookings: completedCount,
        loyaltyBookingsCount: loyaltyBookings.length,
        lifetimeSavings,
        firstCompletedDate,
        currentGuestFeePercent: isRepeatGuest ? 0.03 : 0.05,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Host referral link management ---

  app.get("/api/host/referral-links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await storage.getReferralLinksByHost(userId);

      // Enrich with space names
      const enriched = await Promise.all(links.map(async (link) => {
        let spaceName = "All listings";
        let spaceSlug = "";
        if (link.spaceId) {
          const space = await storage.getSpaceById(link.spaceId);
          spaceName = space?.name || "Unknown Space";
          spaceSlug = space?.slug || "";
        }

        // Calculate savings from referral tier (8%) vs standard (12.5%)
        const standardFeeOnRevenue = Math.round((link.totalRevenueGenerated || 0) * (0.125 / 0.13));
        const referralFeeOnRevenue = Math.round((link.totalRevenueGenerated || 0) * (0.08 / 0.13));
        const savedAmount = standardFeeOnRevenue - referralFeeOnRevenue;

        return {
          ...link,
          spaceName,
          spaceSlug,
          savedAmount,
        };
      }));

      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/host/referral-links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { spaceId } = req.body; // null/undefined = master link for all listings

      // Verify the host owns the space if a specific space is given
      if (spaceId) {
        const space = await storage.getSpaceById(spaceId);
        if (!space || space.userId !== userId) {
          return res.status(403).json({ message: "You can only create referral links for your own spaces" });
        }
      }

      // Check if a link already exists for this host + space combo
      const existing = await storage.getReferralLinksByHost(userId);
      const duplicate = existing.find(l =>
        (spaceId && l.spaceId === spaceId) || (!spaceId && !l.spaceId)
      );
      if (duplicate) {
        return res.json(duplicate); // Return existing link instead of creating duplicate
      }

      // Generate a unique short code
      const code = generateReferralCode();

      const link = await storage.createReferralLink({
        hostId: userId,
        spaceId: spaceId || null,
        uniqueCode: code,
      });

      res.json(link);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/host/referral-links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify ownership via the host's links
      const hostLinks = await storage.getReferralLinksByHost(userId);
      const targetLink = hostLinks.find(l => l.id === req.params.id);
      if (!targetLink) {
        return res.status(404).json({ message: "Referral link not found" });
      }

      await storage.deleteReferralLink(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Admin: bookings per space ---

  app.get("/api/admin/spaces/:id/bookings", isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getSpaceBookingsBySpace(req.params.id);
      const enriched = bookings
        .filter(b => b.status !== "awaiting_payment")
        .map(b => ({
          id: b.id,
          guestName: b.userName || "Guest",
          guestEmail: b.userEmail,
          bookingDate: b.bookingDate,
          bookingStartTime: b.bookingStartTime,
          bookingHours: b.bookingHours,
          status: b.status,
          paymentStatus: b.paymentStatus,
          feeTier: b.feeTier || "standard",
          subtotal: (b.hostPayoutAmount ?? b.hostEarnings ?? 0) + (b.hostFeeAmount ?? 0),
          guestFeeAmount: b.guestFeeAmount ?? b.renterFeeAmount ?? 0,
          hostFeeAmount: b.hostFeeAmount ?? 0,
          taxAmount: b.taxAmount ?? 0,
          totalCharged: b.totalGuestCharged ?? b.paymentAmount ?? 0,
          hostPayout: b.hostPayoutAmount ?? b.hostEarnings ?? 0,
          platformRevenue: b.platformRevenue ?? ((b.guestFeeAmount ?? b.renterFeeAmount ?? 0) + (b.hostFeeAmount ?? 0)),
          payoutStatus: b.payoutStatus,
          refundStatus: b.refundStatus,
          refundAmount: b.refundAmount,
          createdAt: b.createdAt,
        }));

      // Summary
      const paid = enriched.filter(b => b.paymentStatus === "paid");
      const totalRevenue = paid.reduce((s, b) => s + b.totalCharged, 0);
      const totalPlatformRevenue = paid.reduce((s, b) => s + b.platformRevenue, 0);
      const totalHostPayouts = paid.reduce((s, b) => s + b.hostPayout, 0);
      const totalTax = paid.reduce((s, b) => s + b.taxAmount, 0);

      res.json({
        bookings: enriched,
        summary: {
          totalBookings: enriched.length,
          paidBookings: paid.length,
          totalRevenue,
          totalPlatformRevenue,
          totalHostPayouts,
          totalTax,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Referral link click tracking ---
  // When a guest visits a space page via a referral link (e.g. /spaces/my-studio?ref=abc123),
  // the client calls this endpoint to set the referral cookie and track the click.
  app.post("/api/referral/track", async (req: any, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Missing referral code" });

      const refLink = await storage.getReferralLinkByCode(code);
      if (!refLink) return res.status(404).json({ message: "Invalid referral code" });

      // Set cookie — 30 days, last-click attribution
      res.cookie("align_ref", code, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      await storage.incrementReferralClicks(refLink.id);
      res.json({ success: true, hostId: refLink.hostId });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Fee tier detection helper ---
  async function detectFeeTier(req: any, space: any): Promise<{ tier: FeeTier; isRepeatGuest: boolean; isHostReferred: boolean; referralLinkId: string | null }> {
    let isRepeatGuest = false;
    let isHostReferred = false;
    let referralLinkId: string | null = null;

    // Get user ID from auth middleware or session directly
    const userId = req.user?.claims?.sub || req.session?.magicUserId;

    // Check repeat guest status: at least 1 completed booking
    if (userId) {
      const completedCount = await storage.getCompletedBookingCount(userId);
      isRepeatGuest = completedCount >= 1;
    }

    // Check host referral: cookie or query param
    const refCode = req.query.ref as string || req.cookies?.align_ref;
    if (refCode) {
      const refLink = await storage.getReferralLinkByCode(refCode);
      if (refLink) {
        // Referral applies if the referral link's host owns this space,
        // OR if the referral link has no spaceId (master link for all host listings)
        const refHostOwnsSpace = space.userId === refLink.hostId;
        const isMasterLink = !refLink.spaceId;
        const isSpaceSpecificMatch = refLink.spaceId === space.id;

        if (refHostOwnsSpace && (isMasterLink || isSpaceSpecificMatch)) {
          isHostReferred = true;
          referralLinkId = refLink.id;
        }
      }
    }

    const tier = resolveFeeTier({ isRepeatGuest, isHostReferred });
    return { tier, isRepeatGuest, isHostReferred, referralLinkId };
  }

  // Return booked time ranges for a space on a given date
  app.get("/api/spaces/:id/booked-slots", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ message: "Date required" });

      const bookings = await storage.getSpaceBookingsBySpace(req.params.id);
      const space = await storage.getSpaceById(req.params.id);
      const bufferMinutes = space?.bufferMinutes ?? 15;

      const bookedSlots = bookings
        .filter(b => b.bookingDate === date && b.status !== "cancelled" && b.status !== "rejected" && b.bookingStartTime)
        .map(b => {
          const [h, m] = b.bookingStartTime!.split(":").map(Number);
          const startMin = h * 60 + m;
          const endMin = startMin + (b.bookingHours || 1) * 60 + bufferMinutes;
          return { start: b.bookingStartTime!, hours: b.bookingHours || 1, startMin, endMin };
        });

      res.json({ date, bookedSlots });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/spaces/:id/booking-fees", async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space || space.approvalStatus !== "approved" || space.isActive !== 1) {
        return res.status(404).json({ message: "Space not found" });
      }

      const hours = parseInt(req.query.hours as string) || 1;
      const basePriceCents = space.pricePerHour * 100 * hours;

      // Detect tier if user is authenticated
      const { tier, isRepeatGuest, isHostReferred } = await detectFeeTier(req, space);
      const fees = calculateSpaceBookingFees(basePriceCents, tier);

      // Guest-facing response: only dollar amounts, no percentages or host details
      res.json({
        basePriceCents: fees.basePriceCents,
        guestFeeAmount: fees.guestFeeAmount,
        taxAmount: fees.taxAmount,
        totalGuestCharged: fees.totalGuestCharged,
        pricePerHour: space.pricePerHour,
        hours,
        spaceName: space.name,
        isRepeatGuest,
        isHostReferred,
        // Legacy fields for existing client code
        renterFee: fees.renterFee,
        totalCharge: fees.totalCharge,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/spaces/:id/book", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const space = await storage.getSpaceById(req.params.id);
      if (!space || space.approvalStatus !== "approved" || space.isActive !== 1) {
        return res.status(404).json({ message: "Space not found" });
      }

      const { bookingDate, bookingStartTime, bookingHours } = req.body;
      if (!bookingDate) return res.status(400).json({ message: "Booking date is required" });
      const hours = parseInt(bookingHours) || 1;

      const basePriceCents = space.pricePerHour * 100 * hours;

      // Detect fee tier
      const { tier, isRepeatGuest, isHostReferred, referralLinkId } = await detectFeeTier(req, space);
      const fees = calculateSpaceBookingFees(basePriceCents, tier);

      let hostStripeAccountId: string | null = null;
      if (space.userId) {
        const hostUser = await storage.getUserById(space.userId);
        if (hostUser?.stripeAccountId && hostUser.stripeOnboardingComplete === "true") {
          hostStripeAccountId = hostUser.stripeAccountId;
        }
      }

      const guestName = user.claims?.first_name || "Guest";

      // Use advisory lock to prevent race conditions on concurrent bookings for the same space.
      // pg_advisory_xact_lock serializes booking creation per space and auto-releases on commit/rollback.
      const spaceId = space.id;
      const booking = await db.transaction(async (tx) => {
        // Acquire advisory lock scoped to this space
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${spaceId}))`);

        // Check for overlapping bookings inside the lock
        if (bookingStartTime) {
          const existingBookings = await storage.getSpaceBookingsBySpace(spaceId);
          const bufferMinutes = space.bufferMinutes ?? 15;

          const [startH, startM] = bookingStartTime.split(":").map(Number);
          const requestedStart = startH * 60 + startM;
          const requestedEnd = requestedStart + hours * 60;

          const hasConflict = existingBookings.some(b => {
            if (b.bookingDate !== bookingDate) return false;
            if (b.status === "cancelled" || b.status === "rejected") return false;
            if (!b.bookingStartTime) return false;

            const [bH, bM] = b.bookingStartTime.split(":").map(Number);
            const bStart = bH * 60 + bM;
            const bEnd = bStart + (b.bookingHours || 1) * 60 + bufferMinutes;

            // Overlap check: requested slot overlaps if it starts before existing ends
            // AND ends after existing starts (accounting for buffer)
            return requestedStart < bEnd && requestedEnd + bufferMinutes > bStart;
          });

          if (hasConflict) {
            throw new Error("TIME_SLOT_CONFLICT");
          }
        }

        // Create the booking inside the same transaction so the lock is still held
        const newBooking = await storage.createSpaceBooking({
          spaceId,
          userId: user.claims.sub,
          userName: guestName,
          userEmail: user.claims?.email || null,
          status: "awaiting_payment",
          bookingDate,
          bookingStartTime: bookingStartTime || null,
          bookingHours: hours,
          // Legacy fields
          paymentAmount: fees.totalGuestCharged,
          renterFeeAmount: fees.guestFeeAmount,
          hostFeeAmount: fees.hostFeeAmount,
          hostEarnings: fees.hostPayoutAmount,
          // New tier fields
          feeTier: fees.feeTier,
          hostFeePercent: String(fees.hostFeePercent),
          guestFeePercent: String(fees.guestFeePercent),
          guestFeeAmount: fees.guestFeeAmount,
          taxRate: String(fees.taxRate),
          taxAmount: fees.taxAmount,
          totalGuestCharged: fees.totalGuestCharged,
          hostPayoutAmount: fees.hostPayoutAmount,
          platformRevenue: fees.platformRevenue,
          referralLinkId,
          payoutStatus: hostStripeAccountId ? "paid" : "pending",
          paymentStatus: "pending",
        });

        return newBooking;
      });

      // Audit log for every fee calculation
      await storage.createFeeAuditLog({
        bookingId: booking.id,
        feeTier: fees.feeTier,
        basePriceCents: fees.basePriceCents,
        guestFeePercent: String(fees.guestFeePercent),
        guestFeeAmount: fees.guestFeeAmount,
        hostFeePercent: String(fees.hostFeePercent),
        hostFeeAmount: fees.hostFeeAmount,
        taxRate: String(fees.taxRate),
        taxAmount: fees.taxAmount,
        totalGuestCharged: fees.totalGuestCharged,
        hostPayoutAmount: fees.hostPayoutAmount,
        platformRevenue: fees.platformRevenue,
        isRepeatGuest: isRepeatGuest ? 1 : 0,
        isHostReferred: isHostReferred ? 1 : 0,
        referralLinkId,
        taxJurisdiction: DEFAULT_TAX_JURISDICTION,
      });

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const sessionConfig: any = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${space.name} — ${bookingDate}`,
                description: `${hours} hour${hours > 1 ? "s" : ""} at $${space.pricePerHour}/hr`,
              },
              unit_amount: fees.totalGuestCharged,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/portal?tab=messages&space_payment=success`,
        cancel_url: `${baseUrl}/workspaces?space_payment=cancelled`,
        customer_email: user.claims?.email || booking.userEmail,
        metadata: {
          type: "space_booking",
          bookingId: booking.id,
          spaceId: space.id,
          userId: user.claims.sub,
          guestName,
          guestEmail: user.claims?.email || "",
          spaceName: space.name,
          hostEmail: space.contactEmail || "armando@alignworkspaces.com",
          bookingDate,
          bookingStartTime: bookingStartTime || "",
          bookingHours: String(hours),
          feeTier: fees.feeTier,
        },
      };

      // Destination charges: host gets paid directly by Stripe.
      // Platform collects application fee = guest fee + host fee + tax.
      // Host receives: totalGuestCharged - applicationFee = subtotal - hostFee
      if (hostStripeAccountId) {
        const applicationFee = fees.guestFeeAmount + fees.hostFeeAmount + fees.taxAmount;
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: hostStripeAccountId,
          },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);
      await storage.updateSpaceBooking(booking.id, { stripeSessionId: session.id });

      // Update referral link stats if applicable
      if (referralLinkId) {
        await storage.incrementReferralBookings(referralLinkId, fees.platformRevenue);
      }

      res.json({ booking, checkoutUrl: session.url });
    } catch (err: any) {
      if (err.message === "TIME_SLOT_CONFLICT") {
        return res.status(409).json({ message: "This time slot is already booked. Please choose a different time." });
      }
      console.error("Booking error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/space-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allGuestBookings = await storage.getSpaceBookingsByUser(userId);
      const guestBookings = allGuestBookings.filter(b => b.status !== "awaiting_payment");

      const userSpaces = await storage.getSpacesByUser(userId);
      const hostBookings: any[] = [];
      for (const space of userSpaces) {
        const bookings = await storage.getSpaceBookingsBySpace(space.id);
        for (const b of bookings) {
          if (b.status === "awaiting_payment") continue;
          hostBookings.push({ ...b, spaceName: space.name });
        }
      }

      const enrichBooking = async (b: any, role: "guest" | "host") => {
        const latest = await storage.getLatestSpaceMessage(b.id);
        const space = await storage.getSpaceById(b.spaceId);
        const lastRead = role === "guest" ? b.lastReadGuest : b.lastReadHost;
        const msgs = await storage.getSpaceMessages(b.id);
        const unreadCount = lastRead
          ? msgs.filter((m: any) => m.createdAt > lastRead && m.senderId !== userId).length
          : msgs.filter((m: any) => m.senderId !== userId).length;
        return {
          ...b,
          spaceName: space?.name || b.spaceName || "Unknown Space",
          spaceType: space?.type,
          spaceAddress: space?.address || null,
          spaceSchedule: space?.availabilitySchedule || null,
          spaceBufferMinutes: space?.bufferMinutes ?? 15,
          otherPartyName: role === "guest" ? (space?.hostName || "Host") : (b.userName || "Guest"),
          latestMessage: latest ? { message: latest.message, createdAt: latest.createdAt, senderRole: latest.senderRole, messageType: latest.messageType } : null,
          unreadCount,
          role,
        };
      };

      const enrichedGuest = await Promise.all(guestBookings.map((b) => enrichBooking(b, "guest")));
      const enrichedHost = await Promise.all(hostBookings.map((b) => enrichBooking(b, "host")));

      // Enrich direct conversations
      const dmConversations = await storage.getDirectConversationsByUser(userId);
      const enrichedDMs = await Promise.all(dmConversations.map(async (c) => {
        const space = await storage.getSpaceById(c.spaceId);
        const role = c.guestId === userId ? "guest" as const : "host" as const;
        const otherId = role === "guest" ? c.hostId : c.guestId;
        const otherUser = await storage.getUserById(otherId);
        const latest = await storage.getLatestDirectMessage(c.id);
        const msgs = await storage.getDirectMessages(c.id);
        const lastRead = role === "guest" ? c.lastReadGuest : c.lastReadHost;
        const unreadCount = lastRead
          ? msgs.filter((m) => m.createdAt! > lastRead && m.senderId !== userId).length
          : msgs.filter((m) => m.senderId !== userId).length;
        return {
          ...c,
          spaceName: space?.name || "Unknown Space",
          spaceSlug: space?.slug || "",
          otherPartyName: otherUser?.firstName || (role === "guest" ? (space?.hostName || "Host") : "Guest"),
          latestMessage: latest ? { message: latest.message, createdAt: latest.createdAt, senderRole: latest.senderRole } : null,
          unreadCount,
          role,
          type: "direct" as const,
        };
      }));

      res.json({ guestBookings: enrichedGuest, hostBookings: enrichedHost, directConversations: enrichedDMs });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/space-bookings/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      if (booking.userId !== userId) {
        const space = await storage.getSpaceById(booking.spaceId);
        if (!space || space.userId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }

      const messages = await storage.getSpaceMessages(req.params.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      let senderRole = "guest";

      if (booking.userId === userId) {
        senderRole = "guest";
      } else {
        const space = await storage.getSpaceById(booking.spaceId);
        if (!space || space.userId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        senderRole = "host";
      }

      const messageText = String(req.body.message || "").trim();
      const imageUrl = req.body.imageUrl || null;
      if (!messageText && !imageUrl) return res.status(400).json({ message: "Message cannot be empty" });

      const senderName = req.user.claims?.first_name || (senderRole === "host" ? "Host" : "Guest");
      const msg = await storage.createSpaceMessage({
        spaceBookingId: req.params.id,
        senderId: userId,
        senderName,
        senderRole,
        message: messageText || "",
        imageUrl,
      });

      // Send push notification to the other party
      try {
        const space = senderRole === "host" ? null : await storage.getSpaceById(booking.spaceId);
        const recipientId = senderRole === "guest" ? (space?.userId || null) : booking.userId;
        if (recipientId) {
          const spaceName = space?.name || (senderRole === "host" ? await storage.getSpaceById(booking.spaceId).then(s => s?.name) : undefined);
          sendPushToUser(recipientId, {
            title: `New message${spaceName ? ` about ${spaceName}` : ""}`,
            body: messageText.slice(0, 100),
            url: "/portal?tab=messages",
            tag: `booking-${req.params.id}`,
          });
        }
      } catch (pushErr) {
        console.error("Failed to send booking message push:", pushErr);
      }

      res.json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Direct Messaging (pre-booking inquiries) ──

  app.post("/api/spaces/:id/inquire", isAuthenticated, async (req: any, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const userId = req.user.claims.sub;
      if (space.userId === userId) return res.status(400).json({ message: "You cannot message yourself" });

      const messageText = String(req.body.message || "").trim();
      if (!messageText) return res.status(400).json({ message: "Message cannot be empty" });

      const senderUser = await storage.getUserById(userId);
      const senderName = req.user.claims?.first_name || senderUser?.firstName || "Guest";
      const senderEmail = senderUser?.email || "";

      // If the space has a registered host, create a DM conversation
      if (space.userId) {
        const conversation = await storage.getOrCreateDirectConversation(space.id, userId, space.userId);
        const msg = await storage.createDirectMessage({
          conversationId: conversation.id,
          senderId: userId,
          senderName,
          senderRole: "guest",
          message: messageText,
        });

        try {
          sendPushToUser(space.userId, {
            title: `New inquiry about ${space.name}`,
            body: messageText.slice(0, 100),
            url: "/portal?tab=messages",
            tag: `dm-${conversation.id}`,
          });
        } catch {}

        return res.json({ conversation, message: msg });
      }

      // No registered host — send inquiry via email to admin
      try {
        await sendHelpRequest({
          clientName: senderName,
          clientEmail: senderEmail,
          message: `Space inquiry about "${space.name}" (${space.address}):\n\n${messageText}`,
        });
      } catch {}

      res.json({ sent: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/direct-conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getDirectConversationById(req.params.id);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });

      const userId = req.user.claims.sub;
      if (conversation.guestId !== userId && conversation.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const messages = await storage.getDirectMessages(req.params.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/direct-conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getDirectConversationById(req.params.id);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });

      const userId = req.user.claims.sub;
      if (conversation.guestId !== userId && conversation.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const senderRole = conversation.guestId === userId ? "guest" : "host";
      const messageText = String(req.body.message || "").trim();
      const imageUrl = req.body.imageUrl || null;
      if (!messageText && !imageUrl) return res.status(400).json({ message: "Message cannot be empty" });

      const msg = await storage.createDirectMessage({
        conversationId: req.params.id,
        senderId: userId,
        senderName: req.user.claims?.first_name || (senderRole === "host" ? "Host" : "Guest"),
        senderRole,
        message: messageText || "",
        imageUrl,
      });

      const recipientId = senderRole === "guest" ? conversation.hostId : conversation.guestId;
      const space = await storage.getSpaceById(conversation.spaceId);
      try {
        sendPushToUser(recipientId, {
          title: `New message${space ? ` about ${space.name}` : ""}`,
          body: messageText.slice(0, 100),
          url: "/portal?tab=messages",
          tag: `dm-${conversation.id}`,
        });
      } catch {}

      res.json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/direct-conversations/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getDirectConversationById(req.params.id);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });

      const userId = req.user.claims.sub;
      if (conversation.guestId !== userId && conversation.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const role = conversation.guestId === userId ? "guest" : "host";
      await storage.markDirectConversationRead(req.params.id, role);
      cancelEmailFallback(userId, `dm-${req.params.id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Client: get my admin conversation
  app.get("/api/admin-conversations/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversation = await storage.getAdminConversationByClient(userId);
      if (!conversation) return res.json(null);

      const latestMessage = await storage.getLatestAdminMessage(conversation.id);
      const messages = await storage.getAdminMessages(conversation.id);
      const unreadCount = conversation.lastReadClient
        ? messages.filter((m) => m.createdAt! > conversation.lastReadClient! && m.senderId !== userId).length
        : messages.filter((m) => m.senderId !== userId).length;

      res.json({
        id: conversation.id,
        clientId: conversation.clientId,
        otherPartyName: "Align",
        latestMessage: latestMessage ? { message: latestMessage.message, createdAt: latestMessage.createdAt, senderRole: latestMessage.senderRole } : null,
        unreadCount,
        createdAt: conversation.createdAt,
        type: "admin",
      });
    } catch (err: any) {
      console.error("Failed to fetch admin conversation:", err);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Client: get admin conversation messages
  app.get("/api/admin-conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversation = await storage.getAdminConversationById(req.params.id);
      if (!conversation || conversation.clientId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const messages = await storage.getAdminMessages(conversation.id);
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Client: reply to admin conversation
  app.post("/api/admin-conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversation = await storage.getAdminConversationById(req.params.id);
      if (!conversation || conversation.clientId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { message, imageUrl } = req.body;
      if (!message?.trim() && !imageUrl) return res.status(400).json({ message: "Message or image is required" });

      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u) => u.id === userId);
      const senderName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client";

      const msg = await storage.createAdminMessage({
        conversationId: conversation.id,
        senderId: userId,
        senderRole: "client",
        senderName,
        message: (message || "").trim(),
        imageUrl: imageUrl || null,
      });

      // Mark as read by client since they just sent it
      await storage.markAdminConversationRead(conversation.id, "client");

      // Notify admin
      try {
        await sendPushToRole("admin", {
          title: `${senderName} replied`,
          body: message.trim().substring(0, 100),
          url: "/admin",
        });
      } catch {}

      res.json(msg);
    } catch (err: any) {
      console.error("Failed to send client reply:", err);
      res.status(500).json({ message: err?.message || "Failed to send message" });
    }
  });

  // Client: mark admin conversation as read
  app.post("/api/admin-conversations/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversation = await storage.getAdminConversationById(req.params.id);
      if (!conversation || conversation.clientId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.markAdminConversationRead(req.params.id, "client");
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.patch("/api/space-bookings/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const { status } = req.body;
      const space = await storage.getSpaceById(booking.spaceId);

      if (status === "approved" || status === "rejected") {
        if (!space || space.userId !== userId) return res.status(403).json({ message: "Only the host can approve or reject" });
      } else if (status === "cancelled") {
        if (booking.userId !== userId && (!space || space.userId !== userId)) {
          return res.status(403).json({ message: "Not authorized" });
        }
        // Allow cancelling approved or checked_in bookings
        if (booking.status !== "approved" && booking.status !== "pending" && booking.status !== "checked_in") {
          return res.status(400).json({ message: "Cannot cancel a booking with status: " + booking.status });
        }
      } else {
        return res.status(400).json({ message: "Invalid status" });
      }

      let refundResult: { refunded: boolean; amount?: number; reason?: string } = { refunded: false };

      if (status === "cancelled" && booking.paymentStatus === "paid" && booking.stripePaymentIntentId) {
        const cancelledBy = (space?.userId === userId) ? "host" as const : "guest" as const;
        const { amount: refundAmount, reason: refundReason } = calculateRefundAmount(booking, cancelledBy);

        if (refundAmount > 0) {
          try {
            const stripe = await getUncachableStripeClient();
            const refund = await stripe.refunds.create({
              payment_intent: booking.stripePaymentIntentId,
              amount: refundAmount,
            });
            await storage.updateSpaceBooking(booking.id, {
              refundStatus: "refunded",
              refundAmount: refund.amount,
              paymentStatus: refundAmount >= (booking.totalGuestCharged ?? booking.paymentAmount ?? 0) ? "refunded" : "partial_refund",
              payoutStatus: "reversed", // Stripe auto-reverses the host transfer on refund
              updatedAt: new Date(),
            });
            refundResult = { refunded: true, amount: refund.amount, reason: refundReason };
          } catch (refundErr: any) {
            console.error("Refund error:", refundErr.message);
            refundResult = { refunded: false, reason: "Refund processing failed — please contact support" };
          }
        } else {
          await storage.updateSpaceBooking(booking.id, {
            refundStatus: "non_refundable",
            payoutStatus: "pending",
            updatedAt: new Date(),
          });
          refundResult = { refunded: false, reason: refundReason };
        }
      }

      if (status === "cancelled" && booking.googleCalendarEventId) {
        try {
          await deleteBookingCalendarEvent(booking.googleCalendarEventId);
          await storage.updateSpaceBooking(booking.id, { googleCalendarEventId: null });
        } catch (calErr) {
          console.error("Failed to delete calendar event:", calErr);
        }
      }

      const updated = await storage.updateSpaceBookingStatus(booking.id, status);

      const statusLabels: Record<string, string> = { approved: "approved", rejected: "declined", cancelled: "cancelled" };
      const actorName = req.user.claims?.first_name || (space?.userId === userId ? "Host" : "Guest");
      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: "system",
        senderName: "System",
        senderRole: space?.userId === userId ? "host" : "guest",
        message: `${actorName} ${statusLabels[status]} this booking.`,
        messageType: "system",
      });

      if (status === "cancelled" && refundResult.refunded) {
        await storage.createSpaceMessage({
          spaceBookingId: booking.id,
          senderId: "system",
          senderName: "System",
          senderRole: "system",
          message: `Refund of $${((refundResult.amount || 0) / 100).toFixed(2)} issued. ${refundResult.reason} Refunds typically arrive within 3–5 business days.`,
          messageType: "system",
        });
      } else if (status === "cancelled" && booking.paymentStatus === "paid" && !refundResult.refunded) {
        await storage.createSpaceMessage({
          spaceBookingId: booking.id,
          senderId: "system",
          senderName: "System",
          senderRole: "system",
          message: refundResult.reason || "This cancellation is non-refundable per the cancellation policy.",
          messageType: "system",
        });
      }

      res.json({ ...updated, refundResult });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/request-payment", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      if (!space || space.userId !== userId) return res.status(403).json({ message: "Only the host can request payment" });

      const { amount, description } = req.body;
      const cents = Math.round(Number(amount) * 100);
      if (!cents || cents < 100) return res.status(400).json({ message: "Amount must be at least $1.00" });

      await storage.updateSpaceBooking(booking.id, { paymentAmount: cents, paymentStatus: "requested" });

      const hostName = req.user.claims?.first_name || space.hostName || "Host";
      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: userId,
        senderName: hostName,
        senderRole: "host",
        message: JSON.stringify({ amount: cents, description: description || `Payment for ${space.name}` }),
        messageType: "payment_request",
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      if (booking.userId !== userId) return res.status(403).json({ message: "Only the guest can pay" });
      if (!booking.paymentAmount) return res.status(400).json({ message: "No payment requested" });
      if (booking.paymentStatus === "paid") return res.status(400).json({ message: "Already paid" });

      const space = await storage.getSpaceById(booking.spaceId);
      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: space?.name || "Space Booking",
                description: `Booking payment for ${space?.name || "space"}`,
              },
              unit_amount: booking.paymentAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/portal?tab=messages&space_payment=success`,
        cancel_url: `${baseUrl}/portal?space_payment=cancelled`,
        customer_email: booking.userEmail || req.user.claims.email,
        metadata: {
          type: "space_booking",
          bookingId: booking.id,
          spaceId: booking.spaceId,
          userId,
        },
      });

      await storage.updateSpaceBooking(booking.id, { stripeSessionId: session.id, paymentStatus: "pending" });
      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create checkout" });
    }
  });

  app.post("/api/space-bookings/:id/reschedule", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      const isGuest = booking.userId === userId;
      const isHost = space && space.userId === userId;
      if (!isGuest && !isHost) return res.status(403).json({ message: "Not authorized" });
      if (booking.status !== "approved") return res.status(400).json({ message: "Can only reschedule confirmed bookings" });

      const { newDate, newStartTime, newHours } = req.body;
      if (!newDate || !newStartTime || !newHours) return res.status(400).json({ message: "Missing reschedule details" });

      if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return res.status(400).json({ message: "Invalid date format" });
      if (!/^\d{2}:\d{2}$/.test(newStartTime)) return res.status(400).json({ message: "Invalid time format" });
      const hours = Number(newHours);
      if (!Number.isInteger(hours) || hours < 1 || hours > 24) return res.status(400).json({ message: "Invalid hours" });

      const proposedDate = new Date(newDate + "T12:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (proposedDate < today) return res.status(400).json({ message: "Date must be in the future" });

      const messages = await storage.getSpaceMessages(booking.id);
      const hasPending = messages.some((m: any) => {
        if (m.messageType !== "reschedule_request") return false;
        try { const d = JSON.parse(m.message); return !d.resolved; } catch { return false; }
      });
      if (hasPending) return res.status(400).json({ message: "There is already a pending reschedule request" });

      const senderRole = isGuest ? "guest" : "host";
      const senderName = isGuest ? (booking.userName || "Guest") : (space?.hostName || "Host");

      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: userId,
        senderName,
        senderRole,
        message: JSON.stringify({ newDate, newStartTime, newHours: hours, resolved: false }),
        messageType: "reschedule_request",
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/reschedule-respond", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      const isGuest = booking.userId === userId;
      const isHost = space && space.userId === userId;
      if (!isGuest && !isHost) return res.status(403).json({ message: "Not authorized" });

      if (booking.status !== "approved") return res.status(400).json({ message: "Can only respond to reschedule for confirmed bookings" });

      const { messageId, action } = req.body;
      if (!messageId || !["accept", "decline"].includes(action)) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const messages = await storage.getSpaceMessages(booking.id);
      const rescheduleMsg = messages.find((m: any) => String(m.id) === String(messageId) && m.messageType === "reschedule_request");
      if (!rescheduleMsg) return res.status(404).json({ message: "Reschedule request not found" });

      if (rescheduleMsg.senderId === userId) return res.status(400).json({ message: "Cannot respond to your own reschedule request" });

      let rescheduleData: any;
      try { rescheduleData = JSON.parse(rescheduleMsg.message); } catch { return res.status(400).json({ message: "Invalid reschedule data" }); }
      if (rescheduleData.resolved) return res.status(400).json({ message: "Already responded to" });

      const senderRole = isGuest ? "guest" : "host";
      const senderName = isGuest ? (booking.userName || "Guest") : (space?.hostName || "Host");

      if (action === "accept") {
        await storage.updateSpaceBooking(booking.id, {
          bookingDate: rescheduleData.newDate,
          bookingStartTime: rescheduleData.newStartTime,
          bookingHours: rescheduleData.newHours,
        });

        await storage.createSpaceMessage({
          spaceBookingId: booking.id,
          senderId: userId,
          senderName,
          senderRole,
          message: JSON.stringify({ ...rescheduleData, resolved: true }),
          messageType: "reschedule_accepted",
        });
      } else {
        await storage.createSpaceMessage({
          spaceBookingId: booking.id,
          senderId: userId,
          senderName,
          senderRole,
          message: JSON.stringify({ ...rescheduleData, resolved: true }),
          messageType: "reschedule_declined",
        });
      }

      const updatedData = { ...rescheduleData, resolved: true };
      await storage.updateSpaceMessage(rescheduleMsg.id, { message: JSON.stringify(updatedData) });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Check-in / Check-out / No-show ---

  app.post("/api/space-bookings/:id/check-in", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      const isGuest = booking.userId === userId;
      const isHost = space?.userId === userId;
      if (!isGuest && !isHost) return res.status(403).json({ message: "Not authorized" });

      if (booking.status !== "approved") return res.status(400).json({ message: "Booking must be approved to check in" });
      if (booking.paymentStatus !== "paid") return res.status(400).json({ message: "Payment must be completed before check-in" });
      if (booking.checkedInAt) return res.status(400).json({ message: "Already checked in" });

      // Time window: can check in starting 15 min before start time (no upper bound - late check-in OK)
      const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
      const earliestCheckIn = new Date(startDateTime.getTime() - 15 * 60 * 1000);
      if (Date.now() < earliestCheckIn.getTime()) {
        return res.status(400).json({ message: "Too early to check in. You can check in starting 15 minutes before your booking." });
      }

      const role = isGuest ? "guest" : "host";
      const actorName = req.user.claims?.first_name || (isHost ? "Host" : "Guest");

      await storage.updateSpaceBooking(booking.id, {
        status: "checked_in",
        checkedInAt: new Date(),
        checkedInBy: role,
        updatedAt: new Date(),
      });

      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: "system",
        senderName: "System",
        senderRole: role,
        message: `${actorName} checked in.`,
        messageType: "check_in",
      });

      // Notify the other party
      const recipientId = isGuest ? space?.userId : booking.userId;
      if (recipientId) {
        sendPushToUser(recipientId, {
          title: "Guest checked in",
          body: `${actorName} has checked in for their booking at ${space?.name || "your space"}.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}`,
        }, "booking");
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/check-out", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      const isGuest = booking.userId === userId;
      const isHost = space?.userId === userId;
      if (!isGuest && !isHost) return res.status(403).json({ message: "Not authorized" });

      if (booking.status !== "checked_in") return res.status(400).json({ message: "Booking must be checked in first" });
      if (booking.checkedOutAt) return res.status(400).json({ message: "Already checked out" });

      const { notes } = req.body || {};
      const role = isGuest ? "guest" : "host";
      const actorName = req.user.claims?.first_name || (isHost ? "Host" : "Guest");

      // Calculate overtime: minutes past scheduled end, rounded up to 30-min increments
      const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (booking.bookingHours || 1) * 60 * 60 * 1000);
      const minutesPastEnd = Math.max(0, (Date.now() - endDateTime.getTime()) / (1000 * 60));
      const overtimeMinutes = minutesPastEnd > 0 ? Math.ceil(minutesPastEnd / 30) * 30 : 0;

      await storage.updateSpaceBooking(booking.id, {
        status: "completed",
        checkedOutAt: new Date(),
        checkedOutBy: role,
        overtimeMinutes,
        checkoutNotes: notes || null,
        updatedAt: new Date(),
      });

      const overtimeText = overtimeMinutes > 0 ? ` (${overtimeMinutes} min overtime)` : "";
      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: "system",
        senderName: "System",
        senderRole: role,
        message: `${actorName} checked out.${overtimeText}`,
        messageType: "check_out",
      });

      // Notify the other party
      const recipientId = isGuest ? space?.userId : booking.userId;
      if (recipientId) {
        sendPushToUser(recipientId, {
          title: "Session ended",
          body: `${actorName} has checked out.${overtimeText}`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}`,
        }, "booking");
      }

      res.json({ success: true, overtimeMinutes });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/no-show", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      if (!space || space.userId !== userId) return res.status(403).json({ message: "Only the host can mark no-show" });

      if (booking.status !== "approved") return res.status(400).json({ message: "Booking must be approved" });
      if (booking.checkedInAt) return res.status(400).json({ message: "Guest already checked in" });

      // Must be 30+ min past start time
      const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
      const minutesPastStart = (Date.now() - startDateTime.getTime()) / (1000 * 60);
      if (minutesPastStart < 30) {
        return res.status(400).json({ message: "Must wait at least 30 minutes after start time to mark no-show" });
      }

      await storage.updateSpaceBooking(booking.id, {
        noShow: 1,
        status: "completed",
        updatedAt: new Date(),
      });

      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: "system",
        senderName: "System",
        senderRole: "host",
        message: "Guest was marked as a no-show.",
        messageType: "no_show",
      });

      // Notify guest
      if (booking.userId) {
        sendPushToUser(booking.userId, {
          title: "Marked as no-show",
          body: `You were marked as a no-show for your booking at ${space.name}.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}`,
        }, "booking");
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/space-bookings/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const requestedRole = req.body?.role;

      if (requestedRole === "host") {
        const space = await storage.getSpaceById(booking.spaceId);
        if (space?.userId === userId) {
          await storage.markBookingRead(booking.id, "host");
        }
      } else if (requestedRole === "guest") {
        if (booking.userId === userId) {
          await storage.markBookingRead(booking.id, "guest");
        }
      } else {
        // Legacy: auto-detect role
        if (booking.userId === userId) {
          await storage.markBookingRead(booking.id, "guest");
        }
        const space = await storage.getSpaceById(booking.spaceId);
        if (space?.userId === userId) {
          await storage.markBookingRead(booking.id, "host");
        }
      }
      cancelEmailFallback(userId, `booking-${req.params.id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/space-bookings/:id/calendar-url", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(booking.spaceId);
      if (booking.userId !== userId && (!space || space.userId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (!booking.bookingDate || !booking.bookingStartTime || !booking.bookingHours) {
        return res.status(400).json({ message: "Booking details incomplete" });
      }

      const url = generateAddToCalendarUrl({
        spaceName: space?.name || "Space",
        guestName: booking.userName || "Guest",
        guestEmail: booking.userEmail || "",
        hostEmail: space?.contactEmail || "",
        hostName: space?.hostName || "",
        bookingDate: booking.bookingDate,
        bookingStartTime: booking.bookingStartTime,
        bookingHours: booking.bookingHours,
        spaceAddress: space?.address || "",
        bookingId: booking.id,
      });

      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // REVIEWS & RATINGS
  // ══════════════════════════════════════════════════════════════════

  // Get reviews for a space (public)
  app.get("/api/spaces/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getSpaceReviews(req.params.id);
      const { avg, count } = await storage.getSpaceAverageRating(req.params.id);
      res.json({ reviews, averageRating: avg, reviewCount: count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Submit a review (guest, after completed booking)
  app.post("/api/space-bookings/:id/review", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });
      if (booking.status !== "completed") return res.status(400).json({ message: "Can only review completed bookings" });

      const existing = await storage.getReviewByBooking(booking.id);
      if (existing) return res.status(400).json({ message: "Already reviewed this booking" });

      const { rating, title, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });

      const review = await storage.createSpaceReview({
        spaceId: booking.spaceId,
        bookingId: booking.id,
        guestId: req.user.claims.sub,
        guestName: booking.userName || req.user.claims.first_name || "Guest",
        rating: Number(rating),
        title: title ? String(title).trim().slice(0, 200) : null,
        comment: comment ? String(comment).trim().slice(0, 2000) : null,
      });
      res.json(review);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Host responds to a review
  app.post("/api/reviews/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const reviews = await storage.getAllReviews();
      const review = reviews.find(r => r.id === req.params.id);
      if (!review) return res.status(404).json({ message: "Review not found" });

      const space = await storage.getSpaceById(review.spaceId);
      if (!space || space.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });

      const { response } = req.body;
      if (!response) return res.status(400).json({ message: "Response required" });

      const updated = await storage.updateSpaceReview(review.id, {
        hostResponse: String(response).trim().slice(0, 2000),
        hostRespondedAt: new Date(),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Check if user can review a booking
  app.get("/api/space-bookings/:id/can-review", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ canReview: false });
      if (booking.userId !== req.user.claims.sub) return res.json({ canReview: false });
      if (booking.status !== "completed") return res.json({ canReview: false });
      const existing = await storage.getReviewByBooking(booking.id);
      res.json({ canReview: !existing, existingReview: existing || null });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: get all reviews
  app.get("/api/admin/reviews", isAdmin, async (req: any, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews.filter((r: any) => !r.id?.startsWith("test-")));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: update review status (hide/flag/publish)
  app.patch("/api/admin/reviews/:id", isAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["published", "hidden", "flagged"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updated = await storage.updateSpaceReview(req.params.id, { status });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: delete review
  app.delete("/api/admin/reviews/:id", isAdmin, async (req: any, res) => {
    try {
      await storage.deleteSpaceReview(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // SHOOT REVIEWS
  // ══════════════════════════════════════════════════════════════════

  // Client: get own review for a shoot
  app.get("/api/shoots/:id/review", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const review = await storage.getReviewByShoot(shoot.id);
      res.json({ review: review || null, canReview: shoot.status === "completed" && !review });
    } catch {
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  // Client: submit a review for a completed shoot
  app.post("/api/shoots/:id/review", isAuthenticated, async (req: any, res) => {
    try {
      const shoot = await storage.getShootById(req.params.id);
      if (!shoot) return res.status(404).json({ message: "Shoot not found" });
      if (shoot.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      if (shoot.status !== "completed") return res.status(400).json({ message: "Can only review completed shoots" });

      const existing = await storage.getReviewByShoot(shoot.id);
      if (existing) return res.status(400).json({ message: "You have already reviewed this shoot" });

      const { rating, title, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });

      const user = await storage.getUserById(req.user.claims.sub);
      const clientName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client";

      const review = await storage.createShootReview({
        shootId: shoot.id,
        clientId: req.user.claims.sub,
        clientName,
        rating,
        title: title?.trim()?.slice(0, 200) || null,
        comment: comment?.trim()?.slice(0, 2000) || null,
      });

      res.json(review);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || "Failed to submit review" });
    }
  });

  // Admin: get all shoot reviews (enriched with shoot title)
  app.get("/api/admin/shoot-reviews", isAdmin, async (_req, res) => {
    try {
      const reviews = await storage.getAllShootReviews();
      const allShoots = await storage.getAllShoots();
      const shootMap = new Map(allShoots.map((s) => [s.id, s.title]));
      const enriched = reviews.filter(r => !r.id.startsWith("test-")).map((r) => ({ ...r, shootTitle: shootMap.get(r.shootId) || "Unknown Shoot" }));
      res.json(enriched);
    } catch {
      res.status(500).json({ message: "Failed to fetch shoot reviews" });
    }
  });

  // Admin: update shoot review status
  app.patch("/api/admin/shoot-reviews/:id", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["published", "hidden", "flagged"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const review = await storage.updateShootReview(req.params.id as string, { status });
      res.json(review);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: delete shoot review
  app.delete("/api/admin/shoot-reviews/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteShootReview(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: respond to shoot review
  app.post("/api/admin/shoot-reviews/:id/respond", isAdmin, async (req, res) => {
    try {
      const { response } = req.body;
      if (!response?.trim()) return res.status(400).json({ message: "Response is required" });
      const review = await storage.updateShootReview(req.params.id as string, {
        adminResponse: response.trim().slice(0, 2000),
        adminRespondedAt: new Date(),
      });
      res.json(review);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Public: get testimonials for homepage
  app.get("/api/testimonials", async (_req, res) => {
    try {
      const [photography, workspaces] = await Promise.all([
        storage.getPublishedShootReviews(),
        storage.getPublishedSpaceReviews(),
      ]);
      res.json({
        photography: photography.slice(0, 10),
        workspaces: workspaces.slice(0, 10),
      });
    } catch {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // SIMILAR / RECOMMENDED SPACES
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/spaces/:id/similar", async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const allSpaces = await storage.getSpaces();
      const similar = allSpaces
        .filter(s => s.id !== space.id && s.approvalStatus === "approved" && s.isActive === 1)
        .map(s => {
          let score = 0;
          if (s.type === space.type) score += 3;
          if (s.neighborhood && s.neighborhood === space.neighborhood) score += 2;
          if (s.targetProfession && s.targetProfession === space.targetProfession) score += 2;
          const priceDiff = Math.abs((s.pricePerHour || 0) - (space.pricePerHour || 0));
          if (priceDiff <= 20) score += 1;
          return { space: s, score };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(s => s.space);

      res.json(similar);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // HOST RESPONSE RATE & TIME
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/spaces/:id/host-metrics", async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space || !space.userId) return res.json({ avgMinutes: 0, responseRate: 0, responseLabel: "" });

      const metrics = await storage.getHostResponseMetrics(space.userId);
      let responseLabel = "";
      if (metrics.responseRate >= 90) {
        if (metrics.avgMinutes <= 60) responseLabel = "Typically responds within an hour";
        else if (metrics.avgMinutes <= 240) responseLabel = "Typically responds within a few hours";
        else if (metrics.avgMinutes <= 1440) responseLabel = "Typically responds within a day";
        else responseLabel = "Typically responds within a few days";
      } else if (metrics.responseRate >= 50) {
        responseLabel = "Sometimes responds within a day";
      }

      res.json({ ...metrics, responseLabel });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // SEARCH BY DATE/TIME AVAILABILITY
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/spaces/search/available", async (req, res) => {
    try {
      const { date, startTime, hours, type } = req.query;
      let allSpaces = await storage.getSpaces(type ? { type: String(type) } : undefined);
      allSpaces = allSpaces.filter(s => s.approvalStatus === "approved" && s.isActive === 1);

      if (date && startTime && hours) {
        const dateStr = String(date);
        const startStr = String(startTime);
        const numHours = Number(hours);

        const [sH, sM] = startStr.split(":").map(Number);
        const requestedStart = sH * 60 + sM;
        const requestedEnd = requestedStart + numHours * 60;

        const available: typeof allSpaces = [];
        for (const space of allSpaces) {
          const bookings = await storage.getSpaceBookingsBySpace(space.id);
          const dayBookings = bookings.filter(b =>
            b.bookingDate === dateStr &&
            b.status !== "cancelled" && b.status !== "rejected"
          );

          let conflict = false;
          for (const b of dayBookings) {
            if (!b.bookingStartTime || !b.bookingHours) continue;
            const [bH, bM] = b.bookingStartTime.split(":").map(Number);
            const bStart = bH * 60 + bM;
            const buffer = space.bufferMinutes || 15;
            const bEnd = bStart + b.bookingHours * 60 + buffer;
            if (requestedStart < bEnd && requestedEnd > bStart) {
              conflict = true;
              break;
            }
          }
          if (!conflict) available.push(space);
        }
        res.json(available);
      } else {
        res.json(allSpaces);
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // WISHLISTS / COLLECTIONS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/wishlists", isAuthenticated, async (req: any, res) => {
    try {
      const collections = await storage.getWishlistCollections(req.user.claims.sub);
      const result = await Promise.all(collections.map(async (c) => {
        const items = await storage.getWishlistItems(c.id);
        return { ...c, items, itemCount: items.length };
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/wishlists", isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name required" });
      const collection = await storage.createWishlistCollection({
        userId: req.user.claims.sub,
        name: String(name).trim().slice(0, 100),
      });
      res.json(collection);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/wishlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const collections = await storage.getWishlistCollections(req.user.claims.sub);
      const collection = collections.find(c => c.id === req.params.id);
      if (!collection) return res.status(404).json({ message: "Collection not found" });
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name required" });
      const updated = await storage.updateWishlistCollection(req.params.id, String(name).trim().slice(0, 100));
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/wishlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const collections = await storage.getWishlistCollections(req.user.claims.sub);
      const collection = collections.find(c => c.id === req.params.id);
      if (!collection) return res.status(404).json({ message: "Collection not found" });
      await storage.deleteWishlistCollection(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/wishlists/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const collections = await storage.getWishlistCollections(req.user.claims.sub);
      const collection = collections.find(c => c.id === req.params.id);
      if (!collection) return res.status(404).json({ message: "Collection not found" });
      const { spaceId } = req.body;
      if (!spaceId) return res.status(400).json({ message: "spaceId required" });
      const item = await storage.addWishlistItem(req.params.id, spaceId);
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/wishlists/:collectionId/items/:spaceId", isAuthenticated, async (req: any, res) => {
    try {
      const collections = await storage.getWishlistCollections(req.user.claims.sub);
      const collection = collections.find(c => c.id === req.params.collectionId);
      if (!collection) return res.status(404).json({ message: "Collection not found" });
      await storage.removeWishlistItem(req.params.collectionId, req.params.spaceId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // RECURRING BOOKINGS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/recurring-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const recurring = await storage.getRecurringBookingsByUser(req.user.claims.sub);
      res.json(recurring);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/recurring-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const { spaceId, dayOfWeek, startTime, hours, startDate, endDate } = req.body;
      if (!spaceId || dayOfWeek === undefined || !startTime || !hours || !startDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const space = await storage.getSpaceById(spaceId);
      if (!space) return res.status(404).json({ message: "Space not found" });
      if (space.approvalStatus !== "approved" || space.isActive !== 1) {
        return res.status(400).json({ message: "Space is not available for booking" });
      }

      const dow = Number(dayOfWeek);
      const numHours = Number(hours);
      if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
        return res.status(400).json({ message: "dayOfWeek must be 0-6" });
      }
      if (!Number.isInteger(numHours) || numHours < 1 || numHours > 24) {
        return res.status(400).json({ message: "hours must be 1-24" });
      }
      if (!/^\d{2}:\d{2}$/.test(String(startTime))) {
        return res.status(400).json({ message: "startTime must be HH:MM format" });
      }

      const recurring = await storage.createRecurringBooking({
        spaceId,
        userId: req.user.claims.sub,
        userName: req.user.claims.first_name || "Guest",
        userEmail: req.user.claims.email || "",
        dayOfWeek: dow,
        startTime: String(startTime),
        hours: numHours,
        startDate: String(startDate),
        endDate: endDate ? String(endDate) : null,
      });
      res.json(recurring);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/recurring-bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const all = await storage.getRecurringBookingsByUser(req.user.claims.sub);
      const rec = all.find(r => r.id === req.params.id);
      if (!rec) return res.status(404).json({ message: "Not found" });

      const { status, endDate } = req.body;
      const updates: Partial<any> = {};
      if (status && ["active", "paused", "cancelled"].includes(status)) updates.status = status;
      if (endDate !== undefined) updates.endDate = endDate;

      const updated = await storage.updateRecurringBooking(req.params.id, updates);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/recurring-bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const all = await storage.getRecurringBookingsByUser(req.user.claims.sub);
      const rec = all.find(r => r.id === req.params.id);
      if (!rec) return res.status(404).json({ message: "Not found" });
      await storage.deleteRecurringBooking(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // CANCELLATION POLICY
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/spaces/:id/cancellation-policy", async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const policy = space.cancellationPolicy || "flexible";
      const details = {
        flexible: {
          name: "Flexible",
          description: "Full refund up to 24 hours before the booking. 50% refund if cancelled within 24 hours.",
          fullRefundHours: 24,
          partialRefundPercent: 50,
        },
        moderate: {
          name: "Moderate",
          description: "Full refund up to 5 days before the booking. 50% refund up to 24 hours before.",
          fullRefundHours: 120,
          partialRefundPercent: 50,
        },
        strict: {
          name: "Strict",
          description: "Full refund up to 7 days before the booking. No refund within 7 days.",
          fullRefundHours: 168,
          partialRefundPercent: 0,
        },
      }[policy];

      res.json({ policy, ...(details || { name: "Flexible", description: "Full refund up to 24 hours before the booking.", fullRefundHours: 24, partialRefundPercent: 50 }) });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // GUEST PORTFOLIO ON SPACES ("Work created here")
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/spaces/:id/portfolio", async (req, res) => {
    try {
      const photos = await storage.getPortfolioPhotosBySpace(req.params.id);
      res.json(photos);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // HOST BADGES
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/spaces/:id/badges", async (req, res) => {
    try {
      const space = await storage.getSpaceById(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });

      const badges: { key: string; label: string; description: string }[] = [];

      // "New" badge - space created within last 30 days
      if (space.createdAt) {
        const daysSinceCreated = (Date.now() - new Date(space.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 30) {
          badges.push({ key: "new", label: "New", description: "Recently listed on Align" });
        }
      }

      // "Superhost" - high response rate + completed bookings
      if (space.userId) {
        const metrics = await storage.getHostResponseMetrics(space.userId);
        const bookings = await storage.getSpaceBookingsBySpace(space.id);
        const completedBookings = bookings.filter(b => b.status === "completed").length;

        if (metrics.responseRate >= 90 && completedBookings >= 5) {
          badges.push({ key: "superhost", label: "Superhost", description: "Highly responsive with many successful bookings" });
        } else if (metrics.responseRate >= 80) {
          badges.push({ key: "responsive", label: "Responsive", description: "Typically responds quickly to inquiries" });
        }

        // "Experienced" badge
        if (completedBookings >= 10) {
          badges.push({ key: "experienced", label: "Experienced", description: `${completedBookings}+ completed bookings` });
        }
      }

      // "Top Rated" badge
      const { avg, count } = await storage.getSpaceAverageRating(space.id);
      if (avg >= 4.5 && count >= 3) {
        badges.push({ key: "top_rated", label: "Top Rated", description: `${avg} stars from ${count} reviews` });
      }

      // "Verified" badge — space has been approved by admin
      if (space.approvalStatus === "approved") {
        badges.push({ key: "verified", label: "Verified", description: "Verified by Align" });
      }

      res.json(badges);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // HOST ANALYTICS DASHBOARD
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/host/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hostSpaces = await storage.getSpacesByUser(userId);
      if (hostSpaces.length === 0) return res.json({ spaces: [], totals: {} });

      // Batch-fetch ratings for all host spaces in a single query
      const spaceIds = hostSpaces.map(s => s.id);
      const ratingsMap = await storage.getAverageRatingsForSpaces(spaceIds);

      const spaceAnalytics = await Promise.all(hostSpaces.map(async (space) => {
        const bookings = await storage.getSpaceBookingsBySpace(space.id);
        const completed = bookings.filter(b => b.status === "completed");
        const pending = bookings.filter(b => b.status === "pending");
        const { avg, count: reviewCount } = ratingsMap.get(space.id) || { avg: 0, count: 0 };

        // Calculate revenue
        const totalRevenue = completed.reduce((sum, b) => sum + (b.hostPayoutAmount || b.hostEarnings || 0), 0);

        // Get page views for this space
        const slug = space.slug;
        const viewCount = 0; // Page views would need a query - keeping simple

        return {
          spaceId: space.id,
          spaceName: space.name,
          slug: space.slug,
          totalBookings: bookings.length,
          completedBookings: completed.length,
          pendingBookings: pending.length,
          cancelledBookings: bookings.filter(b => b.status === "cancelled").length,
          totalRevenue,
          averageRating: avg,
          reviewCount,
          occupancyRate: completed.length > 0
            ? Math.round((completed.reduce((s, b) => s + (b.bookingHours || 0), 0) / (30 * 8)) * 100)
            : 0,
        };
      }));

      const totals = {
        totalSpaces: hostSpaces.length,
        totalBookings: spaceAnalytics.reduce((s, a) => s + a.totalBookings, 0),
        totalCompleted: spaceAnalytics.reduce((s, a) => s + a.completedBookings, 0),
        totalRevenue: spaceAnalytics.reduce((s, a) => s + a.totalRevenue, 0),
        avgRating: spaceAnalytics.filter(a => a.reviewCount > 0).length > 0
          ? Math.round(spaceAnalytics.filter(a => a.reviewCount > 0).reduce((s, a) => s + a.averageRating, 0) / spaceAnalytics.filter(a => a.reviewCount > 0).length * 10) / 10
          : 0,
      };

      res.json({ spaces: spaceAnalytics, totals });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const SITE_URL = "https://alignworkspaces.com";

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *
Allow: /
Allow: /featured
Allow: /featured/
Allow: /portfolio
Disallow: /admin
Disallow: /portal
Disallow: /employee
Disallow: /api/

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

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

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: FacebookExternalHit
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: YouBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const includeSamples = process.env.NODE_ENV !== "production" ? true : false;
    let featuredPros: { slug: string; name: string; profession: string }[] = [];
    try {
      const pros = await storage.getFeaturedProfessionals(includeSamples);
      featuredPros = pros.map((p: any) => ({ slug: p.slug, name: p.name, profession: p.profession }));
    } catch {}

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/workspaces", priority: "0.9", changefreq: "daily" },
      { loc: "/portrait-builder", priority: "0.8", changefreq: "monthly" },
      { loc: "/portfolio", priority: "0.8", changefreq: "weekly" },
      { loc: "/featured", priority: "0.9", changefreq: "daily" },
      { loc: "/our-vision", priority: "0.6", changefreq: "monthly" },
    ];

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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

    for (const pro of featuredPros) {
      const encodedSlug = encodeURIComponent(pro.slug).replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      xml += `  <url>
    <loc>${SITE_URL}/featured/${encodedSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    xml += `</urlset>`;
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.type("application/xml").send(xml);
  });

  app.get("/llms.txt", (_req, res) => {
    res.set("Cache-Control", "public, max-age=86400");
    res.type("text/plain").send(`# Align

> Align helps independent professionals find flexible workspaces and visually present their brand through curated spaces, photography, and visual planning tools.

## What Is Align?
Align is a platform that helps small business professionals find flexible workspaces that match their needs, brand, and client experience. It connects professionals with short-term or fluid workspaces, while also providing tools and services that help them present themselves and their environment intentionally.

## What Align Offers

### 1. Workspace Discovery
Professionals can find flexible workspaces that suit their work style, client needs, and the type of experience they want to create. Spaces are curated and organized to help users find environments that align with their work.

### 2. Visual Alignment Tools
Align includes a photo builder that helps users define the emotional tone, setting, and client experience they want to communicate through imagery. This is not a generic photo session — it's a planning tool that ensures your visual presence matches your brand.

### 3. Professional Photography Services
Headshots and space photography so professionals and space owners can present themselves and their environments clearly and professionally.

### 4. Curated Space Matching
Spaces on the platform are organized and presented in a way that helps users find environments that align with their work and the experience they want to create for clients.

## Who Align Is For
Independent professionals and growing practices in Miami:
- Therapists & Counselors
- Chefs & Culinary Professionals
- Personal Trainers & Fitness Coaches
- Photographers & Creatives
- Real Estate Agents & Realtors
- Barbers & Hairstylists
- Lawyers & Consultants
- Entrepreneurs & Small Business Owners
- Designers & Architects

## Featured Professionals
A storytelling platform for Miami small business owners. Professionals are featured with editorial-style profiles, portraits, and their story.

## Service Area
Miami, Florida — all of Miami-Dade County:
Miami Beach, Coral Gables, Coconut Grove, Wynwood, Brickell, Doral, Hialeah, Kendall, Homestead

## Contact
- Website: ${SITE_URL}
- Email: hello@alignworkspaces.com

## Key Pages
- Home: ${SITE_URL}/
- Workspaces: ${SITE_URL}/workspaces
- Portrait Builder: ${SITE_URL}/portrait-builder
- Portfolio: ${SITE_URL}/portfolio
- Featured Professionals: ${SITE_URL}/featured
- Our Vision: ${SITE_URL}/our-vision
`);
  });

  app.get("/llms-full.txt", async (_req, res) => {
    const includeSamples = process.env.NODE_ENV !== "production" ? true : false;
    let featuredSection = "";
    try {
      const pros = await storage.getFeaturedProfessionals(includeSamples);
      if (pros.length > 0) {
        featuredSection = "\n## Featured Professionals — Miami Small Business Stories Directory\n\n";
        featuredSection += "The following Miami small business owners have been featured on Align with portrait photography and editorial storytelling:\n\n";
        for (const p of pros) {
          featuredSection += `### ${(p as any).name} — ${(p as any).profession}`;
          if ((p as any).location) featuredSection += ` (${(p as any).location})`;
          featuredSection += `\n`;
          if ((p as any).headline) featuredSection += `"${(p as any).headline}"\n`;
          featuredSection += `${(p as any).bio}\n`;
          featuredSection += `Profile: ${SITE_URL}/featured/${(p as any).slug}\n\n`;
        }
      }
    } catch {}

    res.set("Cache-Control", "public, max-age=86400");
    res.type("text/plain").send(`# Align — Full Context

> Align helps independent professionals find flexible workspaces and visually present their brand through curated spaces, photography, and visual planning tools.

## What Is Align?
Align is a platform that helps small business professionals find flexible workspaces that match their needs, brand, and client experience. It connects professionals with short-term or fluid workspaces, while also providing tools and services that help them present themselves and their environment intentionally.

## What Align Offers

### 1. Workspace Discovery
Professionals can find flexible workspaces that suit their work style, client needs, and the type of experience they want to create. Spaces include therapy offices, creative studios, commercial kitchens, photo studios, and more — each curated and organized to help users find environments that align with their work.

#### How booking works
1. Browse available spaces by type, location, and amenities
2. Select your preferred date, time, and duration
3. Review the transparent fee breakdown
4. Complete payment securely via Stripe
5. Booking is confirmed automatically and added to your calendar

#### Cancellation policy
Full refund if cancelled 24+ hours before booking. Non-refundable within 24 hours.

#### Listing your space
Space owners can submit listings through the Client Portal. Listings go through approval before appearing on the platform. Hosts receive payouts via Stripe Connect.

### 2. Visual Alignment Tools
Align includes a photo builder that helps users define the emotional tone, setting, and client experience they want to communicate through imagery. The 6-step process:
1. **Profession**: Select your industry (therapist, chef, trainer, tradesperson, creative, etc.)
2. **Environment**: Choose where you want to be photographed (office, kitchen, gym, urban, nature, restaurant, studio)
3. **Brand Message**: Define how you want to come across (assured, confident, approachable, bold, warm)
4. **Emotional Impact**: Pick the mood of your photos (bright, cozy, cinematic, powerful)
5. **Concept Review**: See a personalized concept summary with clothing recommendations tailored to your selections
6. **Book**: Reserve your session with a 50% downpayment via Stripe, or request a collaboration

The tool updates a visual preview gallery in real time as you make selections. This is not a generic photo session — it's a planning tool that ensures your visual presence matches your brand.

### 3. Professional Photography Services
Headshots and space photography so professionals and space owners can present themselves and their environments clearly and professionally.

#### Pricing
- Indoor environments (office, kitchen, studio): Starting at $200
- Outdoor environments (urban, nature): Starting at $250
- Premium environments (restaurant, gym): Starting at $300
- 50% downpayment required at booking, remainder due at session

### 4. Curated Space Matching
Spaces are organized and presented in a way that helps users find environments that align with their work and the experience they want to create for clients. Each space is verified with amenities, photos, and availability listed upfront.

## Client Portal
After booking, clients receive access to a private portal where they can:
- View their finished photos in a side-by-side comparison gallery
- Purchase edit tokens for additional retouching
- Chat directly with their photographer
- Download their final images
- Submit and manage their own workspace listings

## Who Align Is For
Independent professionals and growing practices in Miami, Florida:
- Therapists & Counselors
- Chefs & Culinary Professionals
- Personal Trainers & Fitness Coaches
- Photographers & Creatives
- Real Estate Agents & Realtors
- Barbers & Hairstylists
- Lawyers & Legal Professionals
- Entrepreneurs & Startup Founders
- Artists & Designers
- Electricians, Plumbers, HVAC Technicians
- Any small business professional in the Miami area

## Featured Professionals
A storytelling platform for Miami's small business community. Each featured professional receives:
- A dedicated editorial-style profile page
- Professional portrait photography
- A written story about their work, mission, and impact
- Links to their social media and business profiles
- Exposure to the Align community and newsletter subscribers

Anyone can nominate a Miami small business owner to be featured through the nomination form.

## Location & Service Area
Based in Miami, Florida, serving all of Miami-Dade County and surrounding areas:
Miami Beach, Coral Gables, Coconut Grove, Wynwood, Brickell, Doral, Hialeah, Kendall, Homestead, and beyond.
${featuredSection}
## Contact Information
- Website: ${SITE_URL}
- Email: hello@alignworkspaces.com
- Hours: Monday–Sunday 8:00 AM – 8:00 PM

## Key Pages
- Home: ${SITE_URL}/
- Workspaces: ${SITE_URL}/workspaces
- Portrait Builder: ${SITE_URL}/portrait-builder
- Portfolio: ${SITE_URL}/portfolio
- Featured Professionals: ${SITE_URL}/featured
- Our Vision: ${SITE_URL}/our-vision
`);
  });

  const botRegex = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduck|slurp|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

  app.post("/api/track", async (req, res) => {
    try {
      const { sessionId, userId, viewId, path: pagePath, referrer } = req.body;
      if (!sessionId || !pagePath || !viewId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const ua = req.headers["user-agent"] || "";
      let device = "desktop";
      if (/mobile|android|iphone|ipad/i.test(ua)) {
        device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
      }

      if (botRegex.test(ua)) return res.status(200).json({ ok: true });

      await db.insert(pageViews).values({
        id: viewId,
        sessionId: String(sessionId).substring(0, 100),
        userId: userId ? String(userId).substring(0, 100) : null,
        path: String(pagePath).substring(0, 500),
        referrer: referrer ? String(referrer).substring(0, 1000) : null,
        userAgent: ua.substring(0, 500),
        device,
        duration: 0,
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(200).json({ ok: true });
    }
  });

  app.post("/api/track/duration", async (req, res) => {
    try {
      const { viewId, duration } = req.body;
      if (!viewId || typeof duration !== "number" || duration < 0 || duration > 86400) {
        return res.status(200).json({ ok: true });
      }

      const { eq } = await import("drizzle-orm");
      await db
        .update(pageViews)
        .set({ duration: Math.round(duration) })
        .where(eq(pageViews.id, viewId));

      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(200).json({ ok: true });
    }
  });

  // Track custom events
  app.post("/api/track/event", async (req, res) => {
    try {
      const { sessionId, userId, eventType, metadata, path: eventPath } = req.body;
      if (!sessionId || !eventType) return res.status(200).json({ ok: true });

      const ua = req.headers["user-agent"] || "";
      if (botRegex.test(ua)) return res.status(200).json({ ok: true });

      await db.insert(analyticsEvents).values({
        sessionId: String(sessionId).substring(0, 100),
        userId: userId ? String(userId).substring(0, 100) : null,
        eventType: String(eventType).substring(0, 50),
        metadata: metadata || {},
        path: eventPath ? String(eventPath).substring(0, 500) : null,
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(200).json({ ok: true });
    }
  });

  // --- Tax & Revenue Reporting ---

  app.get("/api/admin/revenue", isAdmin, async (req, res) => {
    try {
      const source = (req.query.source as string) || "all"; // "all" | "bookings" | "invoices"

      // All paid bookings (exclude test seed data)
      const allBookingsRaw = await db.select().from(spaceBookings)
        .where(eq(spaceBookings.paymentStatus, "paid"))
        .orderBy(desc(spaceBookings.createdAt));
      const allBookings = allBookingsRaw.filter(b => !b.id.startsWith("test-"));

      // All invoice payments
      const allInvoices = await db.select().from(invoicePayments).orderBy(desc(invoicePayments.paidAt));

      // Build unified revenue entries based on filter
      type RevenueEntry = { date: string; amount: number; source: "booking" | "invoice" };
      const entries: RevenueEntry[] = [];

      if (source === "all" || source === "bookings") {
        for (const b of allBookings) {
          const rev = b.platformRevenue || ((b.guestFeeAmount || b.renterFeeAmount || 0) + (b.hostFeeAmount || 0));
          const date = b.bookingDate || b.createdAt?.toISOString().split("T")[0] || "";
          entries.push({ date, amount: rev, source: "booking" });
        }
      }

      if (source === "all" || source === "invoices") {
        for (const inv of allInvoices) {
          const date = inv.paidAt?.toISOString().split("T")[0] || inv.createdAt?.toISOString().split("T")[0] || "";
          entries.push({ date, amount: inv.amount, source: "invoice" });
        }
      }

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      let todayRevenue = 0, weekRevenue = 0, monthRevenue = 0, allTimeRevenue = 0;
      let todayBookings = 0, weekBookings = 0, monthBookings = 0;
      const todayStr = now.toISOString().split("T")[0];

      const dailyRevenue: Record<string, { date: string; revenue: number; bookings: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dailyRevenue[key] = { date: key, revenue: 0, bookings: 0 };
      }

      for (const e of entries) {
        allTimeRevenue += e.amount;

        if (e.date === todayStr) { todayRevenue += e.amount; todayBookings++; }
        if (e.date >= thisWeekStart.toISOString().split("T")[0]) { weekRevenue += e.amount; weekBookings++; }
        if (e.date.startsWith(thisMonth)) { monthRevenue += e.amount; monthBookings++; }

        if (dailyRevenue[e.date]) {
          dailyRevenue[e.date].revenue += e.amount;
          dailyRevenue[e.date].bookings++;
        }
      }

      // Target tracker: $3,000/month platform revenue
      const monthlyTarget = 300000; // $3,000 in cents
      const targetProgress = Math.min(100, Math.round((monthRevenue / monthlyTarget) * 100));
      const grossNeeded = monthlyTarget > monthRevenue
        ? Math.round((monthlyTarget - monthRevenue) / 0.16) // ~16% blended take
        : 0;

      // Bookings per day average (last 30 days)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentBookings = allBookings.filter(b => {
        const d = b.bookingDate || "";
        return d >= thirtyDaysAgo.toISOString().split("T")[0];
      });
      const bookingsPerDay = (recentBookings.length / 30).toFixed(1);

      // Host & guest metrics
      const allUsers = await storage.getAllUsers();
      const allSpaces = await storage.getAllSpaces();
      const activeHosts = new Set(allSpaces.filter(s => s.isActive === 1 && s.userId).map(s => s.userId)).size;
      const guestIds = new Set(allBookings.map(b => b.userId));
      const totalGuests = guestIds.size;

      // Repeat guest conversion: guests with 2+ bookings / total guests
      const guestBookingCounts: Record<string, number> = {};
      for (const b of allBookings) {
        guestBookingCounts[b.userId] = (guestBookingCounts[b.userId] || 0) + 1;
      }
      const repeatGuests = Object.values(guestBookingCounts).filter(c => c >= 2).length;
      const repeatConversion = totalGuests > 0 ? Math.round((repeatGuests / totalGuests) * 100) : 0;

      // Top hosts by referral revenue
      const allReferralLinks = await db.select().from(referralLinks)
        .orderBy(desc(referralLinks.totalRevenueGenerated));

      const topReferrers = [];
      for (const link of allReferralLinks.slice(0, 10)) {
        if ((link.bookingCount || 0) === 0) continue;
        const host = await storage.getUserById(link.hostId);
        let spaceName = "All listings";
        if (link.spaceId) {
          const space = await storage.getSpaceById(link.spaceId);
          spaceName = space?.name || "Unknown";
        }
        topReferrers.push({
          hostName: host?.firstName || "Unknown",
          spaceName,
          clicks: link.clickCount || 0,
          bookings: link.bookingCount || 0,
          revenue: link.totalRevenueGenerated || 0,
        });
      }

      res.json({
        source,
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          allTime: allTimeRevenue,
        },
        bookings: {
          today: todayBookings,
          week: weekBookings,
          month: monthBookings,
          allTime: entries.length,
          perDay: bookingsPerDay,
        },
        counts: {
          bookings: allBookings.length,
          invoices: allInvoices.length,
        },
        target: {
          monthly: monthlyTarget,
          current: monthRevenue,
          progress: targetProgress,
          grossNeeded,
        },
        dailyRevenue: Object.values(dailyRevenue),
        metrics: {
          totalUsers: allUsers.length,
          activeHosts,
          totalGuests,
          repeatGuests,
          repeatConversion,
        },
        topReferrers,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/tax-report", isAdmin, async (req, res) => {
    try {
      const FL_TAX_RATE = 0.07; // FL 6% + Miami-Dade 1%

      // Fetch all paid bookings with tax data (exclude test seed data)
      const allBookingsRaw = await db.select().from(spaceBookings)
        .where(and(
          eq(spaceBookings.paymentStatus, "paid"),
          sql`${spaceBookings.taxAmount} IS NOT NULL AND ${spaceBookings.taxAmount} > 0`,
        ))
        .orderBy(desc(spaceBookings.createdAt));
      const allBookings = allBookingsRaw.filter(b => !b.id.startsWith("test-"));

      // Fetch all invoice payments
      const allInvoices = await db.select().from(invoicePayments).orderBy(desc(invoicePayments.paidAt));

      // Group by month
      type MonthData = {
        month: string;
        bookingCount: number;
        invoiceCount: number;
        totalSubtotal: number;
        totalTaxCollected: number;
        totalGuestFees: number;
        totalHostFees: number;
        totalPlatformRevenue: number;
        totalGuestCharged: number;
        byTier: Record<string, { count: number; revenue: number }>;
        bySource: { bookings: number; invoices: number };
      };
      const monthlyData: Record<string, MonthData> = {};

      const ensureMonth = (month: string): MonthData => {
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month, bookingCount: 0, invoiceCount: 0,
            totalSubtotal: 0, totalTaxCollected: 0, totalGuestFees: 0,
            totalHostFees: 0, totalPlatformRevenue: 0, totalGuestCharged: 0,
            byTier: {}, bySource: { bookings: 0, invoices: 0 },
          };
        }
        return monthlyData[month];
      };

      for (const b of allBookings) {
        const date = b.bookingDate || b.createdAt?.toISOString().split("T")[0] || "";
        const month = date.slice(0, 7);
        if (!month) continue;

        const m = ensureMonth(month);
        const subtotal = (b.totalGuestCharged || b.paymentAmount || 0) - (b.guestFeeAmount || b.renterFeeAmount || 0) - (b.taxAmount || 0);
        m.bookingCount++;
        m.totalSubtotal += subtotal;
        m.totalTaxCollected += b.taxAmount || 0;
        m.totalGuestFees += b.guestFeeAmount || b.renterFeeAmount || 0;
        m.totalHostFees += b.hostFeeAmount || 0;
        m.totalPlatformRevenue += b.platformRevenue || ((b.guestFeeAmount || b.renterFeeAmount || 0) + (b.hostFeeAmount || 0));
        m.totalGuestCharged += b.totalGuestCharged || b.paymentAmount || 0;
        m.bySource.bookings += b.totalGuestCharged || b.paymentAmount || 0;

        const tier = b.feeTier || "standard";
        if (!m.byTier[tier]) m.byTier[tier] = { count: 0, revenue: 0 };
        m.byTier[tier].count++;
        m.byTier[tier].revenue += b.platformRevenue || 0;
      }

      // Add invoice payments (apply FL 7% tax estimate)
      for (const inv of allInvoices) {
        const date = inv.paidAt?.toISOString().split("T")[0] || inv.createdAt?.toISOString().split("T")[0] || "";
        const month = date.slice(0, 7);
        if (!month) continue;

        const m = ensureMonth(month);
        const taxEstimate = Math.round(inv.amount * FL_TAX_RATE / (1 + FL_TAX_RATE));
        const subtotal = inv.amount - taxEstimate;
        m.invoiceCount++;
        m.totalSubtotal += subtotal;
        m.totalTaxCollected += taxEstimate;
        m.totalPlatformRevenue += inv.amount;
        m.totalGuestCharged += inv.amount;
        m.bySource.invoices += inv.amount;

        if (!m.byTier["invoice"]) m.byTier["invoice"] = { count: 0, revenue: 0 };
        m.byTier["invoice"].count++;
        m.byTier["invoice"].revenue += inv.amount;
      }

      const months = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));

      // Quarterly aggregation
      const quarterlyData: Record<string, { quarter: string; taxCollected: number; bookingCount: number; invoiceCount: number }> = {};
      for (const m of months) {
        const [year, mon] = m.month.split("-");
        const q = Math.ceil(parseInt(mon) / 3);
        const qKey = `${year}-Q${q}`;
        if (!quarterlyData[qKey]) quarterlyData[qKey] = { quarter: qKey, taxCollected: 0, bookingCount: 0, invoiceCount: 0 };
        quarterlyData[qKey].taxCollected += m.totalTaxCollected;
        quarterlyData[qKey].bookingCount += m.bookingCount;
        quarterlyData[qKey].invoiceCount += m.invoiceCount;
      }

      // Totals
      const totalTaxCollected = months.reduce((s, m) => s + m.totalTaxCollected, 0);
      const totalPlatformRevenue = months.reduce((s, m) => s + m.totalPlatformRevenue, 0);
      const totalBookings = months.reduce((s, m) => s + m.bookingCount + m.invoiceCount, 0);
      const totalGrossBookings = months.reduce((s, m) => s + m.totalSubtotal, 0);
      const blendedTakeRate = totalGrossBookings > 0 ? (totalPlatformRevenue / totalGrossBookings * 100).toFixed(1) : "0";

      res.json({
        monthly: months,
        quarterly: Object.values(quarterlyData).sort((a, b) => b.quarter.localeCompare(a.quarter)),
        totals: {
          taxCollected: totalTaxCollected,
          platformRevenue: totalPlatformRevenue,
          grossBookings: totalGrossBookings,
          bookingCount: totalBookings,
          blendedTakeRate,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/tax-export", isAdmin, async (req, res) => {
    try {
      const { quarter } = req.query; // e.g. "2026-Q1"
      const FL_TAX_RATE = 0.07;

      const filterByQuarter = (date: string) => {
        if (!quarter) return true;
        const [year, mon] = date.split("-");
        const q = Math.ceil(parseInt(mon) / 3);
        return `${year}-Q${q}` === quarter;
      };

      const bookings = await db.select().from(spaceBookings)
        .where(and(
          eq(spaceBookings.paymentStatus, "paid"),
          sql`${spaceBookings.taxAmount} IS NOT NULL AND ${spaceBookings.taxAmount} > 0`,
        ))
        .orderBy(spaceBookings.bookingDate);

      const invoices = await db.select().from(invoicePayments).orderBy(invoicePayments.paidAt);

      const header = "ID,Date,Type,Description,Subtotal ($),Tax Rate,Tax Amount ($),Total ($),Tier\n";
      const rows: string[] = [];

      for (const b of bookings) {
        const date = b.bookingDate || "";
        if (!filterByQuarter(date)) continue;
        const subtotal = (b.totalGuestCharged || b.paymentAmount || 0) - (b.guestFeeAmount || b.renterFeeAmount || 0) - (b.taxAmount || 0);
        rows.push([
          b.id, date, "booking", `Space: ${b.spaceId}`,
          (subtotal / 100).toFixed(2), b.taxRate || "0.07",
          ((b.taxAmount || 0) / 100).toFixed(2),
          ((b.totalGuestCharged || b.paymentAmount || 0) / 100).toFixed(2),
          b.feeTier || "standard",
        ].join(","));
      }

      for (const inv of invoices) {
        const date = inv.paidAt?.toISOString().split("T")[0] || inv.createdAt?.toISOString().split("T")[0] || "";
        if (!filterByQuarter(date)) continue;
        const taxEstimate = Math.round(inv.amount * FL_TAX_RATE / (1 + FL_TAX_RATE));
        const subtotal = inv.amount - taxEstimate;
        rows.push([
          inv.id, date, "invoice", `"${(inv.description || "Invoice").replace(/"/g, '""')}"`,
          (subtotal / 100).toFixed(2), String(FL_TAX_RATE),
          (taxEstimate / 100).toFixed(2),
          (inv.amount / 100).toFixed(2),
          "invoice",
        ].join(","));
      }

      const filename = quarter ? `align-tax-report-${quarter}.csv` : "align-tax-report-all.csv";
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(header + rows.join("\n"));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/analytics", isAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { sql: sqlTag } = await import("drizzle-orm");

      // Filter out bots/AI crawlers by user agent
      const botPatterns = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|semrush|ahref|mj12|dotbot|bytespider|gptbot|claudebot|anthropic|chatgpt|google-inspectiontool|petalbot|yandex|baidu|sogou|headlesschrome|puppeteer|phantom|selenium/i;

      const allViewsRaw = await db.select().from(pageViews)
        .where(sqlTag`${pageViews.createdAt} >= ${since}`)
        .orderBy(pageViews.createdAt);
      const allViews = allViewsRaw.filter(v => !v.userAgent || !botPatterns.test(v.userAgent));

      const allEventsRaw = await db.select().from(analyticsEvents)
        .where(sqlTag`${analyticsEvents.createdAt} >= ${since}`)
        .orderBy(analyticsEvents.createdAt);
      const allEvents = allEventsRaw.filter(e => !e.userId || !e.userId.startsWith("test-"));

      const totalViews = allViews.length;
      const uniqueSessions = new Set(allViews.map(v => v.sessionId)).size;

      const pageCounts: Record<string, number> = {};
      const dailyCounts: Record<string, { views: number; sessions: Set<string> }> = {};
      const deviceCounts: Record<string, number> = {};
      const referrerCounts: Record<string, number> = {};
      const durations: number[] = [];
      const sessionPageCounts: Record<string, number> = {};

      for (const v of allViews) {
        pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
        sessionPageCounts[v.sessionId] = (sessionPageCounts[v.sessionId] || 0) + 1;

        const day = v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : "unknown";
        if (!dailyCounts[day]) dailyCounts[day] = { views: 0, sessions: new Set() };
        dailyCounts[day].views++;
        dailyCounts[day].sessions.add(v.sessionId);

        const dev = v.device || "desktop";
        deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

        if (v.referrer) {
          try {
            const host = new URL(v.referrer).hostname.replace(/^www\./, "");
            referrerCounts[host] = (referrerCounts[host] || 0) + 1;
          } catch {
            referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1;
          }
        }

        if (v.duration && v.duration > 0) durations.push(v.duration);
      }

      // Bounce rate: sessions with only 1 page view
      const totalSessions = Object.keys(sessionPageCounts).length;
      const bounceSessions = Object.values(sessionPageCounts).filter(c => c === 1).length;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      // Event aggregation
      const eventCounts: Record<string, number> = {};
      const eventSessions: Record<string, Set<string>> = {};
      for (const e of allEvents) {
        eventCounts[e.eventType] = (eventCounts[e.eventType] || 0) + 1;
        if (!eventSessions[e.eventType]) eventSessions[e.eventType] = new Set();
        eventSessions[e.eventType].add(e.sessionId);
      }

      // Shoot funnel
      const shootStarts = eventSessions["shoot_builder_start"]?.size || 0;
      const shootCompletes = eventSessions["shoot_builder_complete"]?.size || 0;
      const shootFunnel = {
        starts: shootStarts,
        completes: shootCompletes,
        rate: shootStarts > 0 ? Math.round((shootCompletes / shootStarts) * 100) : 0,
      };

      // Space funnel
      const spaceViews = eventSessions["space_view"]?.size || 0;
      const spaceInquiries = (eventSessions["space_inquiry"]?.size || 0) + (eventSessions["contact_host_click"]?.size || 0);
      const spaceBookings = eventSessions["space_booking"]?.size || 0;
      const spaceFunnel = {
        views: spaceViews,
        inquiries: spaceInquiries,
        bookings: spaceBookings,
        viewToInquiryRate: spaceViews > 0 ? Math.round((spaceInquiries / spaceViews) * 100) : 0,
        inquiryToBookingRate: spaceInquiries > 0 ? Math.round((spaceBookings / spaceInquiries) * 100) : 0,
      };

      // Recent user activity
      const userEvents = allEvents
        .filter(e => e.userId)
        .slice(-20)
        .reverse();
      const userIds = [...new Set(userEvents.map(e => e.userId!))];
      const userNames: Record<string, string> = {};
      for (const uid of userIds) {
        const u = await storage.getUserById(uid);
        userNames[uid] = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || uid : uid;
      }
      const recentActivity = userEvents.map(e => ({
        userId: e.userId!,
        userName: userNames[e.userId!] || e.userId!,
        eventType: e.eventType,
        metadata: e.metadata,
        path: e.path,
        createdAt: e.createdAt,
      }));

      const topPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([page, count]) => ({ page, count }));

      const daily = Object.entries(dailyCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({ date, views: data.views, visitors: data.sessions.size }));

      const devices = Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }));

      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([source, count]) => ({ source, count }));

      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      res.json({
        totalViews, uniqueVisitors: uniqueSessions, avgDuration, bounceRate,
        topPages, daily, devices, topReferrers,
        shootFunnel, spaceFunnel, eventCounts, recentActivity,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/pipeline", isAdmin, async (_req, res) => {
    try {
      const contacts = await storage.getPipelineContacts();
      res.json(contacts);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pipeline", isAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.nextFollowUp && typeof body.nextFollowUp === "string") body.nextFollowUp = new Date(body.nextFollowUp);
      if (body.lastContactDate && typeof body.lastContactDate === "string") body.lastContactDate = new Date(body.lastContactDate);
      const contact = await storage.createPipelineContact(body);
      if (req.body.notes) {
        await storage.createPipelineActivity({ contactId: contact.id, type: "note", note: req.body.notes });
      }
      res.json(contact);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/pipeline/:id", isAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.nextFollowUp && typeof body.nextFollowUp === "string") body.nextFollowUp = new Date(body.nextFollowUp);
      if (body.nextFollowUp === null) body.nextFollowUp = null;
      if (body.lastContactDate && typeof body.lastContactDate === "string") body.lastContactDate = new Date(body.lastContactDate);
      const contact = await storage.updatePipelineContact(req.params.id, body);
      res.json(contact);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/pipeline/:id", isAdmin, async (req, res) => {
    try {
      await storage.deletePipelineContact(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/pipeline/:id/activities", isAdmin, async (req, res) => {
    try {
      const activities = await storage.getPipelineActivities(req.params.id);
      res.json(activities);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pipeline/:id/activities", isAdmin, async (req, res) => {
    try {
      const activity = await storage.createPipelineActivity({
        contactId: req.params.id,
        type: req.body.type || "note",
        note: req.body.note,
      });
      const updates: any = { lastContactDate: new Date() };
      if (req.body.followUpDays && typeof req.body.followUpDays === "number") {
        const next = new Date();
        next.setDate(next.getDate() + req.body.followUpDays);
        updates.nextFollowUp = next;
      }
      await storage.updatePipelineContact(req.params.id, updates);
      const updated = await storage.getPipelineContact(req.params.id);
      res.json({ activity, contact: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pipeline/import-leads", isAdmin, async (_req, res) => {
    try {
      const existingLeads = await storage.getLeads();
      const existingContacts = await storage.getPipelineContacts();
      const existingLeadIds = new Set(existingContacts.filter(c => c.leadId).map(c => c.leadId));
      let imported = 0;
      for (const lead of existingLeads) {
        if (existingLeadIds.has(lead.id)) continue;
        await storage.createPipelineContact({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: "website",
          category: "portraits",
          stage: lead.paymentStatus === "paid" ? "booked" : "new",
          notes: lead.notes || undefined,
          leadId: lead.id,
          estimatedValue: lead.estimatedMin,
        });
        imported++;
      }
      res.json({ imported, total: existingLeads.length });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/pipeline/export", isAdmin, async (_req, res) => {
    try {
      const contacts = await storage.getPipelineContacts();
      const header = "Name,Email,Phone,Instagram,Source,Category,Stage,Notes,Next Follow-Up,Last Contact,Estimated Value,Created";
      const rows = contacts.map(c => {
        const esc = (v: string | null | undefined) => {
          if (!v) return "";
          const s = String(v).replace(/"/g, '""');
          return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
        };
        return [
          esc(c.name), esc(c.email), esc(c.phone), esc(c.instagram),
          esc(c.source), esc(c.category), esc(c.stage), esc(c.notes),
          c.nextFollowUp ? new Date(c.nextFollowUp).toISOString().split("T")[0] : "",
          c.lastContactDate ? new Date(c.lastContactDate).toISOString().split("T")[0] : "",
          c.estimatedValue ?? "",
          c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
        ].join(",");
      });
      const csv = [header, ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=pipeline-contacts.csv");
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pipeline/import-csv", isAdmin, async (req, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows)) return res.status(400).json({ message: "rows array required" });
      let imported = 0;
      for (const row of rows) {
        if (!row.name) continue;
        await storage.createPipelineContact({
          name: row.name,
          email: row.email || undefined,
          phone: row.phone || undefined,
          instagram: row.instagram || undefined,
          source: row.source || "import",
          category: row.category || "portraits",
          stage: row.stage || "new",
          notes: row.notes || undefined,
          estimatedValue: row.estimatedValue ? parseInt(row.estimatedValue) : undefined,
          nextFollowUp: row.nextFollowUp ? new Date(row.nextFollowUp) : undefined,
        });
        imported++;
      }
      res.json({ imported });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Arrival Guides ─────────────────────────────────────────────────

  // Host: get arrival guide for a space
  app.get("/api/spaces/:id/arrival-guide", isAuthenticated, async (req: any, res) => {
    try {
      const [guide] = await db.select().from(arrivalGuides).where(eq(arrivalGuides.spaceId, req.params.id));
      if (!guide) return res.json(null);
      const steps = await db.select().from(arrivalGuideSteps).where(eq(arrivalGuideSteps.guideId, guide.id)).orderBy(arrivalGuideSteps.sortOrder);
      res.json({ ...guide, steps });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Host: create or update arrival guide
  app.put("/api/spaces/:id/arrival-guide", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(req.params.id);
      if (!space || space.userId !== userId) return res.status(403).json({ message: "Not your space" });

      const { wifiName, wifiPassword, doorCode, notes, steps } = req.body;

      // Upsert guide
      let [guide] = await db.select().from(arrivalGuides).where(eq(arrivalGuides.spaceId, req.params.id));
      if (guide) {
        await db.update(arrivalGuides).set({ wifiName, wifiPassword, doorCode, notes, updatedAt: new Date() }).where(eq(arrivalGuides.id, guide.id));
      } else {
        const [newGuide] = await db.insert(arrivalGuides).values({ spaceId: req.params.id, wifiName, wifiPassword, doorCode, notes }).returning();
        guide = newGuide;
      }

      // Replace steps
      await db.delete(arrivalGuideSteps).where(eq(arrivalGuideSteps.guideId, guide.id));
      if (steps && Array.isArray(steps) && steps.length > 0) {
        await db.insert(arrivalGuideSteps).values(
          steps.map((s: any, i: number) => ({
            guideId: guide.id,
            imageUrl: s.imageUrl,
            caption: s.caption || null,
            sortOrder: i,
          }))
        );
      }

      const updatedSteps = await db.select().from(arrivalGuideSteps).where(eq(arrivalGuideSteps.guideId, guide.id)).orderBy(arrivalGuideSteps.sortOrder);
      res.json({ ...guide, steps: updatedSteps });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Host: upload arrival guide step image
  app.post("/api/spaces/:id/arrival-guide/upload", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const space = await storage.getSpaceById(req.params.id);
      if (!space || space.userId !== userId) return res.status(403).json({ message: "Not your space" });
      if (!req.file) return res.status(400).json({ message: "No image provided" });

      const buffer = await sharp(req.file.buffer).resize(1200, 900, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
      const key = `arrival-guides/${req.params.id}/${randomUUID()}.webp`;
      await uploadBuffer(buffer, key, "image/webp");
      res.json({ imageUrl: key });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Guest: get arrival guide for a confirmed booking
  app.get("/api/space-bookings/:id/arrival-guide", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const booking = await storage.getSpaceBookingById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.userId !== userId) return res.status(403).json({ message: "Not your booking" });
      if (!["approved", "confirmed", "checked_in"].includes(booking.status || "")) {
        return res.json(null); // Only show after confirmation
      }

      const [guide] = await db.select().from(arrivalGuides).where(eq(arrivalGuides.spaceId, booking.spaceId));
      if (!guide) return res.json(null);
      const steps = await db.select().from(arrivalGuideSteps).where(eq(arrivalGuideSteps.guideId, guide.id)).orderBy(arrivalGuideSteps.sortOrder);
      res.json({ ...guide, steps });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Team Members (Our Vision) ──────────────────────────────────────

  // Public: get all active team members
  app.get("/api/team-members", async (_req, res) => {
    try {
      const members = await db.select().from(teamMembers).where(eq(teamMembers.isActive, 1)).orderBy(teamMembers.sortOrder);
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: get all team members (including inactive)
  app.get("/api/admin/team-members", isAdmin, async (_req, res) => {
    try {
      const members = await db.select().from(teamMembers).orderBy(teamMembers.sortOrder);
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: create team member
  app.post("/api/admin/team-members", isAdmin, async (req, res) => {
    try {
      const [member] = await db.insert(teamMembers).values(req.body).returning();
      res.json(member);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: update team member
  app.patch("/api/admin/team-members/:id", isAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(teamMembers).set(req.body).where(eq(teamMembers.id, req.params.id)).returning();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: delete team member
  app.delete("/api/admin/team-members/:id", isAdmin, async (req, res) => {
    try {
      await db.delete(teamMembers).where(eq(teamMembers.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: upload team member photo
  app.post("/api/admin/team-members/:id/photo", isAdmin, upload.single("photo"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No photo" });
      const buffer = await sharp(req.file.buffer).resize(1024, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      const key = `team-members/${req.params.id}-${randomUUID()}.webp`;
      await uploadBuffer(buffer, key, "image/webp");
      const [updated] = await db.update(teamMembers).set({ photoUrl: key }).where(eq(teamMembers.id, req.params.id)).returning();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Re-seed test client data
  app.post("/api/admin/test-client/seed", isAdmin, async (_req, res) => {
    try {
      const { reseedTestClient } = await import("./seed-test-client");
      await reseedTestClient();
      res.json({ message: "Test client re-seeded successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Auto-cleanup: delete message images older than 3 months
  const cleanupMessageImages = async () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const tables = [
      { table: "admin_messages", name: "adminMessages" },
      { table: "direct_messages", name: "directMessages" },
      { table: "space_messages", name: "spaceMessages" },
      { table: "shoot_messages", name: "shootMessages" },
      { table: "edit_request_messages", name: "editRequestMessages" },
    ];
    for (const { table } of tables) {
      try {
        const { rows } = await db.execute(sql`SELECT id, image_url FROM ${sql.identifier(table)} WHERE image_url IS NOT NULL AND created_at < ${threeMonthsAgo}`);
        for (const row of rows as any[]) {
          try {
            await deleteObject(row.image_url);
            await db.execute(sql`UPDATE ${sql.identifier(table)} SET image_url = NULL WHERE id = ${row.id}`);
          } catch {}
        }
        if ((rows as any[]).length > 0) console.log(`Cleaned up ${(rows as any[]).length} expired images from ${table}`);
      } catch (err) {
        console.error(`Failed to cleanup ${table}:`, err);
      }
    }
  };
  // Run cleanup daily
  setInterval(cleanupMessageImages, 24 * 60 * 60 * 1000);
  // Run once on startup after a delay
  setTimeout(cleanupMessageImages, 30000);

  return httpServer;
}
