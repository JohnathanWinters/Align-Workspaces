import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  environment: text("environment").notNull(),
  brandMessage: text("brand_message").notNull(),
  emotionalImpact: text("emotional_impact").notNull(),
  shootIntent: text("shoot_intent").notNull(),
  preferredDate: text("preferred_date").notNull(),
  notes: text("notes"),
  estimatedMin: integer("estimated_min").notNull(),
  estimatedMax: integer("estimated_max").notNull(),
  paymentStatus: text("payment_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export const portfolioPhotos = pgTable("portfolio_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  environments: text("environments").array().notNull(),
  brandMessages: text("brand_messages").array().notNull(),
  emotionalImpacts: text("emotional_impacts").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioPhotoSchema = createInsertSchema(portfolioPhotos).omit({
  id: true,
  createdAt: true,
});

export type InsertPortfolioPhoto = z.infer<typeof insertPortfolioPhotoSchema>;
export type PortfolioPhoto = typeof portfolioPhotos.$inferSelect;
