import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPortfolioPhotoSchema, insertShootSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendBookingNotification } from "./gmail";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { calculatePricing } from "@shared/pricing";
import { isAuthenticated } from "./replit_integrations/auth";

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

  return httpServer;
}
