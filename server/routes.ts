import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPortfolioPhotoSchema, insertShootSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendBookingNotification } from "./gmail";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { calculatePricing } from "@shared/pricing";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
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

  // Admin: delete a shoot (also cleans up files on disk)
  app.delete("/api/admin/shoots/:id", isAdmin, async (req, res) => {
    try {
      const shootId = req.params.id as string;
      const images = await storage.getGalleryImages(shootId);
      for (const img of images) {
        const filePath = path.join(uploadDir, path.basename(img.imageUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await storage.deleteShoot(shootId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete shoot" });
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

  // Admin: delete gallery image (also removes file from disk)
  app.delete("/api/admin/gallery/:id", isAdmin, async (req, res) => {
    try {
      const image = await storage.getGalleryImageById(req.params.id as string);
      if (image) {
        const filePath = path.join(uploadDir, path.basename(image.imageUrl));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
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
        const image = await storage.createGalleryImage({
          shootId,
          folderId: folderId || null,
          imageUrl: `/uploads/${file.filename}`,
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

  // Serve uploaded files
  app.use("/uploads", (await import("express")).default.static(uploadDir));

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
          const filePath = path.join(uploadDir, path.basename(img.imageUrl));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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

      const filePath = path.join(uploadDir, path.basename(image.imageUrl));
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

      const filename = image.originalFilename || path.basename(image.imageUrl);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.sendFile(filePath);
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
        const filePath = path.join(uploadDir, path.basename(image.imageUrl));
        if (fs.existsSync(filePath)) {
          const filename = image.originalFilename || path.basename(image.imageUrl);
          const folderName = image.folderId ? folderMap.get(image.folderId) || "Other" : "";
          const archivePath = folderName ? `${folderName}/${filename}` : filename;
          archive.file(filePath, { name: archivePath });
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
