import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPortfolioPhotoSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendBookingNotification } from "./gmail";

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

  return httpServer;
}
