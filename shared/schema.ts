import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Session table managed by connect-pg-simple — defined here so drizzle-kit push doesn't drop it
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

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
  durationHours: text("duration_hours").default("2"),
  googleCalendarEventId: text("google_calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShootSchema = createInsertSchema(shoots).omit({
  id: true,
  createdAt: true,
});

export type InsertShoot = z.infer<typeof insertShootSchema>;
export type Shoot = typeof shoots.$inferSelect;

export const shootMessages = pgTable("shoot_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shootId: varchar("shoot_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").notNull(), // "admin" | "client"
  senderName: text("sender_name"),
  message: text("message").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShootMessageSchema = createInsertSchema(shootMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertShootMessage = z.infer<typeof insertShootMessageSchema>;
export type ShootMessage = typeof shootMessages.$inferSelect;

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
  imageUrl: text("image_url"),
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
    narrativeHook?: string;
    qaSections?: Array<{ question: string; answer: string }>;
    whyStarted?: string;
    whatTheyLove?: string;
    misunderstanding?: string;
  }>(),
  socialLinks: jsonb("social_links").$type<Array<{ platform: string; url: string }>>(),
  credentials: jsonb("credentials").$type<string[]>(),
  yearsInPractice: integer("years_in_practice"),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  spaceImageUrl: text("space_image_url"),
  spaceImageCropPosition: jsonb("space_image_crop_position").$type<{ x: number; y: number; zoom?: number }>(),
  spaceName: text("space_name"),
  spaceQuote: text("space_quote"),
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
  cancellationPolicy: text("cancellation_policy").default("flexible"), // 'flexible' | 'moderate' | 'strict'
  bookingTypes: text("booking_types").default("both"), // 'hourly' | 'recurring' | 'both'
  recurringMinBookings: integer("recurring_min_bookings").default(1), // minimum weeks commitment (1 day per week)
  recurringDiscountPercent: integer("recurring_discount_percent"),
  recurringDiscountAfter: integer("recurring_discount_after").default(0), // bookings before discount kicks in
  isFoundingHost: integer("is_founding_host").default(0), // 1 = founding host (0% host fee), first 20 spaces, one per account
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
  arrivalGuideSentAt: timestamp("arrival_guide_sent_at"),
  recurringBookingId: varchar("recurring_booking_id"),     // links to parent recurring booking
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
  imageUrl: text("image_url"),
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
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

// Admin-to-client conversations (one per client)
export const adminConversations = pgTable("admin_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: text("client_id").notNull(),
  lastReadAdmin: timestamp("last_read_admin"),
  lastReadClient: timestamp("last_read_client"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminConversationSchema = createInsertSchema(adminConversations).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminConversation = z.infer<typeof insertAdminConversationSchema>;
export type AdminConversation = typeof adminConversations.$inferSelect;

// Admin-to-client messages
export const adminMessages = pgTable("admin_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type AdminMessage = typeof adminMessages.$inferSelect;

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
  spaceId: varchar("space_id"),
  shootId: varchar("shoot_id"),
  assignedTo: text("assigned_to"), // 'armando' | 'edith' | null
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
  referredContactId: varchar("referred_contact_id"),
  editHistory: jsonb("edit_history").$type<{ note: string; editedAt: string }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPipelineActivitySchema = createInsertSchema(pipelineActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertPipelineActivity = z.infer<typeof insertPipelineActivitySchema>;
export type PipelineActivity = typeof pipelineActivities.$inferSelect;

// ── Reviews & Ratings ──────────────────────────────────────────────
export const spaceReviews = pgTable("space_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  guestId: text("guest_id").notNull(),
  guestName: text("guest_name"),
  rating: integer("rating").notNull(),                    // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  hostResponse: text("host_response"),
  hostRespondedAt: timestamp("host_responded_at"),
  status: text("status").default("published"),            // 'published' | 'hidden' | 'flagged'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpaceReviewSchema = createInsertSchema(spaceReviews, {
  rating: z.number().int().min(1).max(5),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertSpaceReview = z.infer<typeof insertSpaceReviewSchema>;
export type SpaceReview = typeof spaceReviews.$inferSelect;

export const shootReviews = pgTable("shoot_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shootId: varchar("shoot_id").notNull(),
  clientId: text("client_id").notNull(),
  clientName: text("client_name"),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  adminResponse: text("admin_response"),
  adminRespondedAt: timestamp("admin_responded_at"),
  status: text("status").default("published"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShootReviewSchema = createInsertSchema(shootReviews, {
  rating: z.number().int().min(1).max(5),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertShootReview = z.infer<typeof insertShootReviewSchema>;
export type ShootReview = typeof shootReviews.$inferSelect;

// ── Wishlist Collections ───────────────────────────────────────────
export const wishlistCollections = pgTable("wishlist_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWishlistCollectionSchema = createInsertSchema(wishlistCollections).omit({
  id: true,
  createdAt: true,
});

export type InsertWishlistCollection = z.infer<typeof insertWishlistCollectionSchema>;
export type WishlistCollection = typeof wishlistCollections.$inferSelect;

export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull(),
  spaceId: varchar("space_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
});

export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// ── Recurring Bookings ─────────────────────────────────────────────
export const recurringBookings = pgTable("recurring_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  userEmail: text("user_email"),
  dayOfWeek: integer("day_of_week").notNull(),             // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: text("start_time").notNull(),                 // "09:00"
  hours: integer("hours").notNull(),
  startDate: text("start_date").notNull(),                 // "2026-04-01"
  endDate: text("end_date"),                               // null = indefinite
  status: text("status").default("pending_confirmation"),  // 'pending_confirmation' | 'confirmed' | 'declined' | 'active' | 'paused' | 'cancelled'
  requestedBy: text("requested_by"),                       // userId of proposer
  requestedByRole: text("requested_by_role"),              // 'guest' | 'host'
  confirmedBy: text("confirmed_by"),                       // userId of confirmer
  confirmedAt: timestamp("confirmed_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRecurringBookingSchema = createInsertSchema(recurringBookings).omit({
  id: true,
  createdAt: true,
});

export type InsertRecurringBooking = z.infer<typeof insertRecurringBookingSchema>;
export type RecurringBooking = typeof recurringBookings.$inferSelect;

// ── Arrival Guides ────────────────────────────────────────────────
export const arrivalGuides = pgTable("arrival_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  wifiName: text("wifi_name"),
  wifiPassword: text("wifi_password"),
  doorCode: text("door_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArrivalGuideSchema = createInsertSchema(arrivalGuides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArrivalGuide = z.infer<typeof insertArrivalGuideSchema>;
export type ArrivalGuide = typeof arrivalGuides.$inferSelect;

export const arrivalGuideSteps = pgTable("arrival_guide_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArrivalGuideStepSchema = createInsertSchema(arrivalGuideSteps).omit({
  id: true,
  createdAt: true,
});

export type InsertArrivalGuideStep = z.infer<typeof insertArrivalGuideStepSchema>;
export type ArrivalGuideStep = typeof arrivalGuideSteps.$inferSelect;

// ── Team Members (Our Vision page) ───────────────────────────────
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  cropPosition: jsonb("crop_position").$type<{ x: number; y: number; zoom: number }>().default({ x: 50, y: 50, zoom: 1 }),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// ── Invoice Payments (synced from Stripe) ──────────────────────────
export const invoicePayments = pgTable("invoice_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  customerEmail: varchar("customer_email"),
  customerName: varchar("customer_name"),
  amount: integer("amount").notNull(), // cents
  description: text("description"),
  shootId: varchar("shoot_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InvoicePayment = typeof invoicePayments.$inferSelect;

// ── Host Calendar Connections ───────────────────────────────────────
export const hostCalendarConnections = pgTable("host_calendar_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull().default("google"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at"),
  calendarId: text("calendar_id").default("primary"),
  syncEnabled: integer("sync_enabled").default(1),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncError: text("last_sync_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type HostCalendarConnection = typeof hostCalendarConnections.$inferSelect;
export type InsertHostCalendarConnection = typeof hostCalendarConnections.$inferInsert;

// ── iCal Feeds ──────────────────────────────────────────────────────
export const icalFeeds = pgTable("ical_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  userId: text("user_id").notNull(),
  feedUrl: text("feed_url").notNull(),
  feedName: text("feed_name"),
  isActive: integer("is_active").default(1),
  lastFetchAt: timestamp("last_fetch_at"),
  lastFetchError: text("last_fetch_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type IcalFeed = typeof icalFeeds.$inferSelect;
export type InsertIcalFeed = typeof icalFeeds.$inferInsert;

// ── External Calendar Blocks ────────────────────────────────────────
export const externalCalendarBlocks = pgTable("external_calendar_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  source: text("source").notNull(),                    // 'google_calendar' | 'ical_feed'
  sourceId: text("source_id").notNull(),               // host_calendar_connections.id or ical_feeds.id
  externalEventId: text("external_event_id"),          // UID from iCal or Google event ID
  title: text("title"),
  blockDate: text("block_date").notNull(),             // 'YYYY-MM-DD'
  blockStartTime: text("block_start_time").notNull(),  // 'HH:MM'
  blockEndTime: text("block_end_time").notNull(),      // 'HH:MM'
  allDay: integer("all_day").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ExternalCalendarBlock = typeof externalCalendarBlocks.$inferSelect;
export type InsertExternalCalendarBlock = typeof externalCalendarBlocks.$inferInsert;

// ══════════════════════════════════════════════════════════════════════
// TRUST & SAFETY FRAMEWORK
// ══════════════════════════════════════════════════════════════════════

// ── Host Insurance Records ─────────────────────────────────────────
export const hostInsuranceRecords = pgTable("host_insurance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  carrierName: text("carrier_name").notNull(),
  policyNumber: text("policy_number").notNull(),
  coverageType: text("coverage_type").notNull(),             // 'general_liability' | 'professional_liability' | 'property' | 'bop' | 'other'
  coverageAmount: integer("coverage_amount").notNull(),      // in dollars, minimum 1000000
  policyExpirationDate: text("policy_expiration_date").notNull(), // 'YYYY-MM-DD'
  documentUrl: text("document_url").notNull(),               // R2 URL for declarations page
  documentFilename: text("document_filename"),
  status: text("status").notNull().default("active"),        // 'active' | 'expiring_soon' | 'expired' | 'suspended'
  verifiedAt: timestamp("verified_at"),
  suspendedAt: timestamp("suspended_at"),
  reminderSent30Day: integer("reminder_sent_30_day").default(0),
  reminderSent7Day: integer("reminder_sent_7_day").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type HostInsuranceRecord = typeof hostInsuranceRecords.$inferSelect;
export type InsertHostInsuranceRecord = typeof hostInsuranceRecords.$inferInsert;

export const insertHostInsuranceSchema = createInsertSchema(hostInsuranceRecords).omit({
  id: true, createdAt: true, updatedAt: true, status: true,
  verifiedAt: true, suspendedAt: true, reminderSent30Day: true, reminderSent7Day: true,
});

// ── Professional Use Certifications ────────────────────────────────
export const spaceCertifications = pgTable("space_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").notNull(),
  userId: text("user_id").notNull(),
  certificationTier: text("certification_tier").notNull(),   // 'clinical_ready' | 'consultation_ready' | 'wellness_ready' | 'service_ready' | 'general_professional'
  checklistItems: jsonb("checklist_items").notNull(),         // array of { key, label, checked: boolean }
  allItemsChecked: integer("all_items_checked").default(0),   // 1 if all checked, badge shows
  status: text("status").notNull().default("active"),        // 'active' | 'removed'
  removedAt: timestamp("removed_at"),
  removedReason: text("removed_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SpaceCertification = typeof spaceCertifications.$inferSelect;
export type InsertSpaceCertification = typeof spaceCertifications.$inferInsert;

// ── Booking Agreements ─────────────────────────────────────────────
export const bookingAgreements = pgTable("booking_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  userId: text("user_id").notNull(),
  userRole: text("user_role").notNull(),                     // 'guest' | 'host'
  agreementVersion: text("agreement_version").notNull(),     // e.g. '2026-03-29-v1'
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export type BookingAgreement = typeof bookingAgreements.$inferSelect;
export type InsertBookingAgreement = typeof bookingAgreements.$inferInsert;

// ── Damage Reports ─────────────────────────────────────────────────
export const damageReports = pgTable("damage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  spaceId: varchar("space_id").notNull(),
  reporterId: text("reporter_id").notNull(),                 // host userId
  guestId: text("guest_id").notNull(),
  issueType: text("issue_type").notNull(),                   // 'property_damage' | 'cleanliness' | 'policy_violation' | 'other'
  description: text("description").notNull(),
  estimatedCost: integer("estimated_cost"),                  // in cents
  photoUrls: jsonb("photo_urls").notNull(),                  // string array, min 2 max 10
  status: text("status").notNull().default("pending"),       // 'pending' | 'guest_notified' | 'guest_responded' | 'escalated' | 'resolved'
  guestResponse: text("guest_response"),
  guestRespondedAt: timestamp("guest_responded_at"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),                           // 'host' | 'guest' | 'admin'
  escalatedAt: timestamp("escalated_at"),
  guestNotifiedAt: timestamp("guest_notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DamageReport = typeof damageReports.$inferSelect;
export type InsertDamageReport = typeof damageReports.$inferInsert;

// ── Guest Professional Profiles ────────────────────────────────────
export const guestProfessionalProfiles = pgTable("guest_professional_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  professionalTitle: text("professional_title"),
  industry: text("industry"),
  licenseNumber: text("license_number"),
  licensingState: text("licensing_state"),
  insuranceCarrier: text("insurance_carrier"),
  insurancePolicyNumber: text("insurance_policy_number"),
  isComplete: integer("is_complete").default(0),             // 1 if enough fields filled for badge
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type GuestProfessionalProfile = typeof guestProfessionalProfiles.$inferSelect;
export type InsertGuestProfessionalProfile = typeof guestProfessionalProfiles.$inferInsert;

// ── Community Events ──────────────────────────────────────────────
export const communityEvents = pgTable("community_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  endTime: text("end_time"),
  location: text("location"),
  imageUrl: text("image_url"),
  hostName: text("host_name").notNull(),
  hostEmail: text("host_email"),
  approvalStatus: text("approval_status").default("pending"),
  rsvpCount: integer("rsvp_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityEventSchema = createInsertSchema(communityEvents).omit({
  id: true,
  approvalStatus: true,
  rsvpCount: true,
  createdAt: true,
});

export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type CommunityEvent = typeof communityEvents.$inferSelect;

export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  userEmail: text("user_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EventRsvp = typeof eventRsvps.$inferSelect;
