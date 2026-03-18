import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
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

export const insertLeadSchema = createInsertSchema(leads, {
  environment: z.string().nullish().transform(v => v ?? ""),
  brandMessage: z.string().nullish().transform(v => v ?? ""),
  emotionalImpact: z.string().nullish().transform(v => v ?? ""),
  shootIntent: z.string().nullish().transform(v => v ?? ""),
  preferredDate: z.string().nullish().transform(v => v ?? ""),
}).omit({
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
  category: varchar("category", { length: 20 }).notNull().default("people"),
  environments: text("environments").array().notNull(),
  brandMessages: text("brand_messages").array().notNull(),
  emotionalImpacts: text("emotional_impacts").array().notNull(),
  colorPalette: jsonb("color_palette").$type<ColorSwatch[]>().default([]),
  cropPosition: jsonb("crop_position").$type<{ x: number; y: number; zoom: number }>().default({ x: 50, y: 50, zoom: 1 }),
  locationSpaceId: varchar("location_space_id"),
  subjectName: text("subject_name"),
  subjectProfession: text("subject_profession"),
  subjectBio: text("subject_bio"),
  beforeImageUrl: text("before_image_url"),
  displayOrder: integer("display_order").notNull().default(0),
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
  thumbnailUrl: text("thumbnail_url"),
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
  portraitCropPosition: jsonb("portrait_crop_position").$type<{ x: number; y: number; zoom?: number }>(),
  heroCropPosition: jsonb("hero_crop_position").$type<{ x: number; y: number; zoom?: number }>(),
  headline: text("headline").notNull(),
  quote: text("quote").notNull(),
  storySections: jsonb("story_sections").notNull().$type<{
    whyStarted: string;
    whatTheyLove: string;
    misunderstanding: string;
  }>(),
  socialLinks: jsonb("social_links").$type<Array<{ platform: string; url: string }>>(),
  yearsHosting: integer("years_hosting"),
  locationCount: integer("location_count"),
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

export const nominations = pgTable("nominations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nomineeName: text("nominee_name").notNull(),
  nomineeProfession: text("nominee_profession").notNull(),
  reason: text("reason").notNull(),
  nomineeContact: text("nominee_contact"),
  nominatorName: text("nominator_name"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNominationSchema = createInsertSchema(nominations).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertNomination = z.infer<typeof insertNominationSchema>;
export type Nomination = typeof nominations.$inferSelect;

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  zipCode: text("zip_code"),
  interests: text("interests").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
});

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export const spaces = pgTable("spaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  address: text("address").notNull(),
  neighborhood: text("neighborhood"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  pricePerHour: integer("price_per_hour").notNull(),
  pricePerDay: integer("price_per_day"),
  capacity: integer("capacity"),
  amenities: text("amenities").array(),
  imageUrls: text("image_urls").array(),
  targetProfession: text("target_profession"),
  availableHours: text("available_hours"),
  availabilitySchedule: text("availability_schedule"),
  bufferMinutes: integer("buffer_minutes").default(15),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  hostName: text("host_name"),
  userId: text("user_id"),
  approvalStatus: text("approval_status").default("approved"),
  colorPalette: text("color_palette"),
  tags: text("tags").array(),
  isSample: integer("is_sample").default(0),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true,
  createdAt: true,
});

export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type Space = typeof spaces.$inferSelect;

export const spaceBookings = pgTable("space_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  userEmail: text("user_email"),
  status: text("status").default("pending"),
  message: text("message"),
  bookingDate: text("booking_date"),
  bookingStartTime: text("booking_start_time"),
  bookingHours: integer("booking_hours"),

  // Legacy fee fields (kept for backward compatibility with existing bookings)
  paymentAmount: integer("payment_amount"),
  renterFeeAmount: integer("renter_fee_amount"),
  hostFeeAmount: integer("host_fee_amount"),
  hostEarnings: integer("host_earnings"),

  // Three-tier fee fields
  feeTier: text("fee_tier"),                    // 'standard' | 'host_referred' | 'repeat_guest'
  hostFeePercent: text("host_fee_percent"),      // Decimal string e.g. "0.125"
  guestFeePercent: text("guest_fee_percent"),    // Decimal string e.g. "0.05"
  guestFeeAmount: integer("guest_fee_amount"),   // Guest service fee in cents
  taxRate: text("tax_rate"),                     // Decimal string e.g. "0.07"
  taxAmount: integer("tax_amount"),              // Tax in cents
  totalGuestCharged: integer("total_guest_charged"), // subtotal + guest fee + tax
  hostPayoutAmount: integer("host_payout_amount"),   // subtotal - host fee
  platformRevenue: integer("platform_revenue"),      // host fee + guest fee
  referralLinkId: text("referral_link_id"),          // Nullable — if host-referred
  stripeTransferId: text("stripe_transfer_id"),      // For host payout tracking
  payoutStatus: text("payout_status"),               // 'pending' | 'processing' | 'paid' | 'held'

  paymentStatus: text("payment_status"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  refundStatus: text("refund_status"),
  refundAmount: integer("refund_amount"),
  googleCalendarEventId: text("google_calendar_event_id"),
  checkedInAt: timestamp("checked_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  checkedInBy: text("checked_in_by"),       // "guest" | "host"
  checkedOutBy: text("checked_out_by"),     // "guest" | "host" | "system"
  noShow: integer("no_show").default(0),
  overtimeMinutes: integer("overtime_minutes").default(0),
  checkoutNotes: text("checkout_notes"),
  lastReadGuest: timestamp("last_read_guest"),
  lastReadHost: timestamp("last_read_host"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSpaceBookingSchema = createInsertSchema(spaceBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSpaceBooking = z.infer<typeof insertSpaceBookingSchema>;
export type SpaceBooking = typeof spaceBookings.$inferSelect;

export const referralLinks = pgTable("referral_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: text("host_id").notNull(),
  spaceId: varchar("space_id"),                  // Nullable — null means all host listings
  uniqueCode: text("unique_code").notNull().unique(),
  clickCount: integer("click_count").default(0),
  bookingCount: integer("booking_count").default(0),
  totalRevenueGenerated: integer("total_revenue_generated").default(0), // In cents
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralLinkSchema = createInsertSchema(referralLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertReferralLink = z.infer<typeof insertReferralLinkSchema>;
export type ReferralLink = typeof referralLinks.$inferSelect;

export const feeAuditLog = pgTable("fee_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  feeTier: text("fee_tier").notNull(),
  basePriceCents: integer("base_price_cents").notNull(),
  guestFeePercent: text("guest_fee_percent").notNull(),
  guestFeeAmount: integer("guest_fee_amount").notNull(),
  hostFeePercent: text("host_fee_percent").notNull(),
  hostFeeAmount: integer("host_fee_amount").notNull(),
  taxRate: text("tax_rate").notNull(),
  taxAmount: integer("tax_amount").notNull(),
  totalGuestCharged: integer("total_guest_charged").notNull(),
  hostPayoutAmount: integer("host_payout_amount").notNull(),
  platformRevenue: integer("platform_revenue").notNull(),
  isRepeatGuest: integer("is_repeat_guest").default(0),
  isHostReferred: integer("is_host_referred").default(0),
  referralLinkId: text("referral_link_id"),
  taxJurisdiction: text("tax_jurisdiction"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FeeAuditLog = typeof feeAuditLog.$inferSelect;

export const spaceMessages = pgTable("space_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceBookingId: varchar("space_booking_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").default("text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpaceMessageSchema = createInsertSchema(spaceMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertSpaceMessage = z.infer<typeof insertSpaceMessageSchema>;
export type SpaceMessage = typeof spaceMessages.$inferSelect;

export const directConversations = pgTable("direct_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  guestId: text("guest_id").notNull(),
  hostId: text("host_id").notNull(),
  lastReadGuest: timestamp("last_read_guest"),
  lastReadHost: timestamp("last_read_host"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectConversationSchema = createInsertSchema(directConversations).omit({
  id: true,
  createdAt: true,
});

export type InsertDirectConversation = z.infer<typeof insertDirectConversationSchema>;
export type DirectConversation = typeof directConversations.$inferSelect;

export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  country: text("country"),
  device: text("device"),
  duration: integer("duration").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PageView = typeof pageViews.$inferSelect;

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  path: text("path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export const pipelineContacts = pgTable("pipeline_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  instagram: text("instagram"),
  source: text("source").default("website"),
  category: text("category").default("portraits"),
  stage: text("stage").notNull().default("new"),
  notes: text("notes"),
  nextFollowUp: timestamp("next_follow_up"),
  lastContactDate: timestamp("last_contact_date"),
  leadId: varchar("lead_id"),
  bookingId: varchar("booking_id"),
  estimatedValue: integer("estimated_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPipelineContactSchema = createInsertSchema(pipelineContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPipelineContact = z.infer<typeof insertPipelineContactSchema>;
export type PipelineContact = typeof pipelineContacts.$inferSelect;

export const spaceFavorites = pgTable("space_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  spaceId: varchar("space_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpaceFavoriteSchema = createInsertSchema(spaceFavorites).omit({
  id: true,
  createdAt: true,
});

export type InsertSpaceFavorite = z.infer<typeof insertSpaceFavoriteSchema>;
export type SpaceFavorite = typeof spaceFavorites.$inferSelect;

export const pipelineActivities = pgTable("pipeline_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull(),
  type: text("type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPipelineActivitySchema = createInsertSchema(pipelineActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertPipelineActivity = z.infer<typeof insertPipelineActivitySchema>;
export type PipelineActivity = typeof pipelineActivities.$inferSelect;
