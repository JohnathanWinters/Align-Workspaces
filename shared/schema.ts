import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

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

export const colorSwatchSchema = z.object({
  hex: z.string(),
  keyword: z.string(),
});

export type ColorSwatch = z.infer<typeof colorSwatchSchema>;

export const portfolioPhotos = pgTable("portfolio_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  environments: text("environments").array().notNull(),
  brandMessages: text("brand_messages").array().notNull(),
  emotionalImpacts: text("emotional_impacts").array().notNull(),
  colorPalette: jsonb("color_palette").$type<ColorSwatch[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioPhotoSchema = createInsertSchema(portfolioPhotos, {
  colorPalette: z.array(colorSwatchSchema).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertPortfolioPhoto = z.infer<typeof insertPortfolioPhotoSchema>;
export type PortfolioPhoto = typeof portfolioPhotos.$inferSelect;

export const shoots = pgTable("shoots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  environment: text("environment"),
  brandMessage: text("brand_message"),
  emotionalImpact: text("emotional_impact"),
  shootIntent: text("shoot_intent"),
  status: text("status").default("draft"),
  shootDate: text("shoot_date"),
  shootTime: text("shoot_time"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShootSchema = createInsertSchema(shoots).omit({
  id: true,
  createdAt: true,
});

export type InsertShoot = z.infer<typeof insertShootSchema>;
export type Shoot = typeof shoots.$inferSelect;

export const galleryFolders = pgTable("gallery_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shootId: varchar("shoot_id").notNull(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGalleryFolderSchema = createInsertSchema(galleryFolders).omit({
  id: true,
  createdAt: true,
});

export type InsertGalleryFolder = z.infer<typeof insertGalleryFolderSchema>;
export type GalleryFolder = typeof galleryFolders.$inferSelect;

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shootId: varchar("shoot_id").notNull(),
  folderId: varchar("folder_id"),
  imageUrl: text("image_url").notNull(),
  originalFilename: text("original_filename"),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export const imageFavorites = pgTable("image_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  imageId: varchar("image_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ImageFavorite = typeof imageFavorites.$inferSelect;

export const editTokens = pgTable("edit_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  annualTokens: integer("annual_tokens").default(2).notNull(),
  purchasedTokens: integer("purchased_tokens").default(0).notNull(),
  annualTokenResetDate: timestamp("annual_token_reset_date").notNull(),
  lastPhotoshootDate: timestamp("last_photoshoot_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEditTokenSchema = createInsertSchema(editTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertEditToken = z.infer<typeof insertEditTokenSchema>;
export type EditToken = typeof editTokens.$inferSelect;

export const tokenTransactions = pgTable("token_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;

export const editRequests = pgTable("edit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  shootId: varchar("shoot_id"),
  photoCount: integer("photo_count").notNull(),
  annualTokensUsed: integer("annual_tokens_used").default(0).notNull(),
  purchasedTokensUsed: integer("purchased_tokens_used").default(0).notNull(),
  notes: text("notes"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEditRequestSchema = createInsertSchema(editRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertEditRequest = z.infer<typeof insertEditRequestSchema>;
export type EditRequest = typeof editRequests.$inferSelect;

export const editRequestPhotos = pgTable("edit_request_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  editRequestId: varchar("edit_request_id").notNull(),
  imageUrl: text("image_url").notNull(),
  originalFilename: text("original_filename"),
  finishedImageUrl: text("finished_image_url"),
  finishedFilename: text("finished_filename"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEditRequestPhotoSchema = createInsertSchema(editRequestPhotos).omit({
  id: true,
  createdAt: true,
});

export type InsertEditRequestPhoto = z.infer<typeof insertEditRequestPhotoSchema>;
export type EditRequestPhoto = typeof editRequestPhotos.$inferSelect;

export const editRequestMessages = pgTable("edit_request_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  editRequestId: varchar("edit_request_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEditRequestMessageSchema = createInsertSchema(editRequestMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertEditRequestMessage = z.infer<typeof insertEditRequestMessageSchema>;
export type EditRequestMessage = typeof editRequestMessages.$inferSelect;

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  role: text("role").default("client"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("editor"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const featuredProfessionals = pgTable("featured_professionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  profession: text("profession").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  slug: text("slug").notNull().unique(),
  portraitImageUrl: text("portrait_image_url"),
  portraitCropPosition: jsonb("portrait_crop_position").$type<{ x: number; y: number }>(),
  headline: text("headline").notNull(),
  quote: text("quote").notNull(),
  storySections: jsonb("story_sections").notNull().$type<{
    whyStarted: string;
    whatTheyLove: string;
    misunderstanding: string;
  }>(),
  socialLinks: jsonb("social_links").$type<{
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  }>(),
  isFeaturedOfWeek: integer("is_featured_of_week").notNull().default(0),
  isSample: integer("is_sample").notNull().default(0),
  seoTitle: text("seo_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeaturedProfessionalSchema = createInsertSchema(featuredProfessionals).omit({
  id: true,
  createdAt: true,
});

export type InsertFeaturedProfessional = z.infer<typeof insertFeaturedProfessionalSchema>;
export type FeaturedProfessional = typeof featuredProfessionals.$inferSelect;
