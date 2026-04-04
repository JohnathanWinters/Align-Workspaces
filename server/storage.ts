import { type Lead, type InsertLead, leads, type PortfolioPhoto, type InsertPortfolioPhoto, portfolioPhotos, type Shoot, type InsertShoot, shoots, type GalleryImage, type InsertGalleryImage, galleryImages, type GalleryFolder, type InsertGalleryFolder, galleryFolders, type User, users, imageFavorites, type ImageFavorite, type EditToken, type InsertEditToken, editTokens, type TokenTransaction, type InsertTokenTransaction, tokenTransactions, type EditRequest, type InsertEditRequest, editRequests, type EditRequestPhoto, type InsertEditRequestPhoto, editRequestPhotos, type EditRequestMessage, type InsertEditRequestMessage, editRequestMessages, type PushSubscription, type InsertPushSubscription, pushSubscriptions, type Employee, type InsertEmployee, employees, type FeaturedProfessional, type InsertFeaturedProfessional, featuredProfessionals, type Nomination, type InsertNomination, nominations, type NewsletterSubscriber, type InsertNewsletterSubscriber, newsletterSubscribers, type Space, type InsertSpace, spaces, type SpaceBooking, type InsertSpaceBooking, spaceBookings, type SpaceMessage, type InsertSpaceMessage, spaceMessages, type PipelineContact, type InsertPipelineContact, pipelineContacts, type PipelineActivity, type InsertPipelineActivity, pipelineActivities, type SpaceFavorite, spaceFavorites, type DirectConversation, type InsertDirectConversation, directConversations, type DirectMessage, type InsertDirectMessage, directMessages, type AdminConversation, type InsertAdminConversation, adminConversations, type AdminMessage, type InsertAdminMessage, adminMessages, type ReferralLink, type InsertReferralLink, referralLinks, type FeeAuditLog, feeAuditLog, type SpaceReview, type InsertSpaceReview, spaceReviews, type WishlistCollection, type InsertWishlistCollection, wishlistCollections, type WishlistItem, type InsertWishlistItem, wishlistItems, type RecurringBooking, type InsertRecurringBooking, recurringBookings, type ShootMessage, type InsertShootMessage, shootMessages, type ShootReview, type InsertShootReview, shootReviews, type HostCalendarConnection, type InsertHostCalendarConnection, hostCalendarConnections, type IcalFeed, type InsertIcalFeed, icalFeeds, type ExternalCalendarBlock, type InsertExternalCalendarBlock, externalCalendarBlocks, type CommunityEvent, type InsertCommunityEvent, communityEvents, type EventRsvp, eventRsvps } from "@shared/schema";
import { db } from "./db";
import { sql, eq, desc, asc, and, or, isNull, ne, ilike } from "drizzle-orm";

export interface IStorage {
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  createPortfolioPhoto(photo: InsertPortfolioPhoto): Promise<PortfolioPhoto>;
  getPortfolioPhotos(): Promise<PortfolioPhoto[]>;
  getPortfolioPhoto(id: string): Promise<PortfolioPhoto | undefined>;
  getPortfolioPhotosByTags(environment: string, brandMessage: string, emotionalImpact: string): Promise<PortfolioPhoto[]>;
  updatePortfolioPhoto(id: string, data: Partial<InsertPortfolioPhoto>): Promise<PortfolioPhoto>;
  getPortfolioPhotosBySpace(spaceId: string): Promise<PortfolioPhoto[]>;
  deletePortfolioPhoto(id: string): Promise<void>;
  createShoot(shoot: InsertShoot): Promise<Shoot>;
  getShootsByUser(userId: string): Promise<Shoot[]>;
  getShootById(id: string): Promise<Shoot | undefined>;
  updateShoot(id: string, data: Partial<InsertShoot>): Promise<Shoot>;
  deleteShoot(id: string): Promise<void>;
  getAllShoots(): Promise<Shoot[]>;
  getGalleryImages(shootId: string): Promise<GalleryImage[]>;
  getGalleryImageById(id: string): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<void>;
  getFolders(shootId: string): Promise<GalleryFolder[]>;
  getFolderById(id: string): Promise<GalleryFolder | undefined>;
  createFolder(folder: InsertGalleryFolder): Promise<GalleryFolder>;
  updateFolder(id: string, data: Partial<InsertGalleryFolder>): Promise<GalleryFolder>;
  deleteFolder(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserStripeAccount(id: string, stripeAccountId: string, onboardingComplete: string): Promise<User>;
  getFavorites(userId: string, shootId: string): Promise<string[]>;
  toggleFavorite(userId: string, imageId: string): Promise<boolean>;
  updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string }): Promise<User>;
  transferShootsOwnership(fromUserId: string, toUserId: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getOrCreateEditTokens(userId: string): Promise<EditToken>;
  resetExpiredAnnualTokens(userId: string): Promise<EditToken>;
  deductTokens(userId: string, count: number): Promise<{ annualUsed: number; purchasedUsed: number }>;
  addPurchasedTokens(userId: string, count: number): Promise<EditToken>;
  adjustTokens(userId: string, annual: number, purchased: number): Promise<EditToken>;
  getTokenTransactions(userId: string): Promise<TokenTransaction[]>;
  createTokenTransaction(tx: InsertTokenTransaction): Promise<TokenTransaction>;
  createEditRequest(data: InsertEditRequest): Promise<EditRequest>;
  getEditRequests(userId?: string): Promise<EditRequest[]>;
  getEditRequestPhotos(editRequestId: string): Promise<EditRequestPhoto[]>;
  createEditRequestPhoto(photo: InsertEditRequestPhoto): Promise<EditRequestPhoto>;
  getAllEditTokens(): Promise<EditToken[]>;
  getEditRequestMessages(editRequestId: string): Promise<EditRequestMessage[]>;
  createEditRequestMessage(msg: InsertEditRequestMessage): Promise<EditRequestMessage>;
  getShootMessages(shootId: string): Promise<ShootMessage[]>;
  createShootMessage(msg: InsertShootMessage): Promise<ShootMessage>;
  getEditRequestById(id: string): Promise<EditRequest | undefined>;
  getEditRequestPhotoById(id: string): Promise<EditRequestPhoto | undefined>;
  updateEditRequestPhoto(id: string, data: { finishedImageUrl: string; finishedFilename: string }): Promise<EditRequestPhoto>;
  deleteEditRequestPhoto(id: string): Promise<void>;
  deleteEditRequest(id: string): Promise<void>;
  refundEditRequestTokens(userId: string, annualRefund: number, purchasedRefund: number): Promise<void>;
  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string): Promise<void>;
  getPushSubscriptionsByUser(userId: string): Promise<PushSubscription[]>;
  getPushSubscriptionsByRole(role: string): Promise<PushSubscription[]>;
  createEmployee(data: { username: string; passwordHash: string; displayName: string; role: string }): Promise<Employee>;
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  getEmployeeByUsername(username: string): Promise<Employee | undefined>;
  updateEmployee(id: string, data: Partial<{ username: string; passwordHash: string; displayName: string; role: string; active: number }>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  createFeaturedProfessional(data: InsertFeaturedProfessional): Promise<FeaturedProfessional>;
  getFeaturedProfessionals(opts?: { category?: string; includeSamples?: boolean }): Promise<FeaturedProfessional[]>;
  getFeaturedProfessionalBySlug(slug: string): Promise<FeaturedProfessional | undefined>;
  getFeaturedProfessionalById(id: string): Promise<FeaturedProfessional | undefined>;
  updateFeaturedProfessional(id: string, data: Partial<InsertFeaturedProfessional>): Promise<FeaturedProfessional>;
  deleteFeaturedProfessional(id: string): Promise<void>;
  getFeaturedOfWeek(opts?: { includeSamples?: boolean }): Promise<FeaturedProfessional | undefined>;
  getFeaturedCategories(opts?: { includeSamples?: boolean }): Promise<string[]>;
  createNomination(data: InsertNomination): Promise<Nomination>;
  getNominations(): Promise<Nomination[]>;
  updateNominationStatus(id: string, status: string): Promise<Nomination>;
  deleteNomination(id: string): Promise<void>;
  createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  updateNewsletterSubscriber(id: string, data: Partial<InsertNewsletterSubscriber>): Promise<NewsletterSubscriber>;
  deleteNewsletterSubscriber(id: string): Promise<void>;
  getSpaces(opts?: { type?: string; includeSamples?: boolean }): Promise<Space[]>;
  getSpaceBySlug(slug: string): Promise<Space | undefined>;
  getSpaceById(id: string): Promise<Space | undefined>;
  getSpacesByUser(userId: string): Promise<Space[]>;
  getPendingSpaces(): Promise<Space[]>;
  createSpace(data: InsertSpace): Promise<Space>;
  getAllSpaces(): Promise<Space[]>;
  updateSpace(id: string, data: Partial<InsertSpace>): Promise<Space>;
  deleteSpace(id: string): Promise<void>;
  createSpaceBooking(data: InsertSpaceBooking): Promise<SpaceBooking>;
  getSpaceBookingsByUser(userId: string): Promise<SpaceBooking[]>;
  getAllSpaceBookingUserIds(): Promise<string[]>;
  getSpaceBookingsBySpace(spaceId: string): Promise<SpaceBooking[]>;
  getSpaceBookingsBySpaceAndDate(spaceId: string, date: string): Promise<SpaceBooking[]>;
  getSpaceBookingById(id: string): Promise<SpaceBooking | undefined>;
  updateSpaceBookingStatus(id: string, status: string): Promise<SpaceBooking>;
  updateSpaceBooking(id: string, data: Partial<SpaceBooking>): Promise<SpaceBooking>;
  markBookingRead(bookingId: string, role: "guest" | "host"): Promise<void>;
  getSpaceMessages(spaceBookingId: string): Promise<SpaceMessage[]>;
  createSpaceMessage(msg: InsertSpaceMessage): Promise<SpaceMessage>;
  getLatestSpaceMessage(bookingId: string): Promise<SpaceMessage | undefined>;
  updateSpaceMessage(id: string, data: Partial<SpaceMessage>): Promise<void>;
  getPipelineContacts(): Promise<PipelineContact[]>;
  getPipelineContact(id: string): Promise<PipelineContact | undefined>;
  createPipelineContact(data: InsertPipelineContact): Promise<PipelineContact>;
  updatePipelineContact(id: string, data: Partial<InsertPipelineContact>): Promise<PipelineContact>;
  deletePipelineContact(id: string): Promise<void>;
  getPipelineActivities(contactId: string): Promise<PipelineActivity[]>;
  createPipelineActivity(data: InsertPipelineActivity): Promise<PipelineActivity>;
  getSpaceFavorites(userId: string): Promise<SpaceFavorite[]>;
  addSpaceFavorite(userId: string, spaceId: string): Promise<SpaceFavorite>;
  removeSpaceFavorite(userId: string, spaceId: string): Promise<void>;
  isSpaceFavorited(userId: string, spaceId: string): Promise<boolean>;
  getOrCreateDirectConversation(spaceId: string, guestId: string, hostId: string): Promise<DirectConversation>;
  getDirectConversationById(id: string): Promise<DirectConversation | undefined>;
  getDirectConversationsByUser(userId: string): Promise<DirectConversation[]>;
  getDirectMessages(conversationId: string): Promise<DirectMessage[]>;
  createDirectMessage(msg: InsertDirectMessage): Promise<DirectMessage>;
  getLatestDirectMessage(conversationId: string): Promise<DirectMessage | undefined>;
  markDirectConversationRead(conversationId: string, role: "guest" | "host"): Promise<void>;

  // Admin conversations
  getOrCreateAdminConversation(clientId: string): Promise<AdminConversation>;
  getAdminConversationById(id: string): Promise<AdminConversation | undefined>;
  getAdminConversationByClient(clientId: string): Promise<AdminConversation | undefined>;
  getAllAdminConversations(): Promise<AdminConversation[]>;
  getAdminMessages(conversationId: string): Promise<AdminMessage[]>;
  createAdminMessage(msg: InsertAdminMessage): Promise<AdminMessage>;
  getLatestAdminMessage(conversationId: string): Promise<AdminMessage | undefined>;
  markAdminConversationRead(conversationId: string, role: "admin" | "client"): Promise<void>;

  // Fee system
  getCompletedBookingCount(userId: string): Promise<number>;
  getReferralLinkByCode(code: string): Promise<ReferralLink | undefined>;
  getReferralLinksByHost(hostId: string): Promise<ReferralLink[]>;
  createReferralLink(data: InsertReferralLink): Promise<ReferralLink>;
  incrementReferralClicks(id: string): Promise<void>;
  incrementReferralBookings(id: string, revenueCents: number): Promise<void>;
  createFeeAuditLog(data: Omit<FeeAuditLog, "id" | "createdAt">): Promise<void>;

  // Payouts
  getBookingsReadyForCompletion(): Promise<SpaceBooking[]>;
  getBookingsPendingPayout(): Promise<SpaceBooking[]>;
  getPayoutsByHost(hostId: string): Promise<SpaceBooking[]>;

  // Check-in/check-out notifications
  getBookingsForCheckInNotifications(dateStr: string): Promise<SpaceBooking[]>;
  getBookingsNeedingNoShowAlert(dateStr: string): Promise<SpaceBooking[]>;
  getBookingsNeedingEndReminder(dateStr: string): Promise<SpaceBooking[]>;
  getBookingsNeedingAutoCheckout(): Promise<SpaceBooking[]>;

  // Referral link management
  deleteReferralLink(id: string): Promise<void>;

  // Reviews
  getSpaceReviews(spaceId: string): Promise<SpaceReview[]>;
  getReviewByBooking(bookingId: string): Promise<SpaceReview | undefined>;
  createSpaceReview(data: InsertSpaceReview): Promise<SpaceReview>;
  updateSpaceReview(id: string, data: Partial<SpaceReview>): Promise<SpaceReview>;
  deleteSpaceReview(id: string): Promise<void>;
  getAllReviews(): Promise<SpaceReview[]>;
  getPublishedSpaceReviews(): Promise<SpaceReview[]>;
  getSpaceAverageRating(spaceId: string): Promise<{ avg: number; count: number }>;
  getReviewByShoot(shootId: string): Promise<ShootReview | undefined>;
  createShootReview(data: InsertShootReview): Promise<ShootReview>;
  updateShootReview(id: string, data: Partial<ShootReview>): Promise<ShootReview>;
  deleteShootReview(id: string): Promise<void>;
  getAllShootReviews(): Promise<ShootReview[]>;
  getPublishedShootReviews(): Promise<ShootReview[]>;
  getAverageRatingsForSpaces(spaceIds: string[]): Promise<Map<string, { avg: number; count: number }>>;

  // Wishlists
  getWishlistCollections(userId: string): Promise<WishlistCollection[]>;
  createWishlistCollection(data: InsertWishlistCollection): Promise<WishlistCollection>;
  updateWishlistCollection(id: string, name: string): Promise<WishlistCollection>;
  deleteWishlistCollection(id: string): Promise<void>;
  getWishlistItems(collectionId: string): Promise<WishlistItem[]>;
  addWishlistItem(collectionId: string, spaceId: string): Promise<WishlistItem>;
  removeWishlistItem(collectionId: string, spaceId: string): Promise<void>;

  // Recurring bookings
  createRecurringBooking(data: InsertRecurringBooking): Promise<RecurringBooking>;
  getRecurringBookingsByUser(userId: string): Promise<RecurringBooking[]>;
  getRecurringBookingsBySpace(spaceId: string): Promise<RecurringBooking[]>;
  updateRecurringBooking(id: string, data: Partial<RecurringBooking>): Promise<RecurringBooking>;
  deleteRecurringBooking(id: string): Promise<void>;
  getRecurringBookingById(id: string): Promise<RecurringBooking | undefined>;
  getActiveRecurringBookings(): Promise<RecurringBooking[]>;
  getSpaceBookingsByRecurringId(recurringBookingId: string): Promise<SpaceBooking[]>;

  // Host response metrics
  getHostResponseMetrics(hostId: string): Promise<{ avgMinutes: number; responseRate: number }>;

  // Calendar sync
  createHostCalendarConnection(data: InsertHostCalendarConnection): Promise<HostCalendarConnection>;
  getHostCalendarConnectionByUserId(userId: string): Promise<HostCalendarConnection | undefined>;
  updateHostCalendarConnection(id: string, data: Partial<HostCalendarConnection>): Promise<HostCalendarConnection>;
  deleteHostCalendarConnection(id: string): Promise<void>;
  getActiveHostCalendarConnections(): Promise<HostCalendarConnection[]>;
  createIcalFeed(data: InsertIcalFeed): Promise<IcalFeed>;
  getIcalFeedsBySpace(spaceId: string): Promise<IcalFeed[]>;
  getIcalFeedById(id: string): Promise<IcalFeed | undefined>;
  updateIcalFeed(id: string, data: Partial<IcalFeed>): Promise<IcalFeed>;
  deleteIcalFeed(id: string): Promise<void>;
  getActiveIcalFeeds(): Promise<IcalFeed[]>;
  upsertExternalCalendarBlocks(sourceId: string, blocks: InsertExternalCalendarBlock[]): Promise<void>;
  getExternalBlocksBySpaceAndDate(spaceId: string, date: string): Promise<ExternalCalendarBlock[]>;
  deleteExternalBlocksBySource(sourceId: string): Promise<void>;
  cleanupExpiredExternalBlocks(): Promise<number>;

  // Community Events
  getApprovedUpcomingEvents(opts?: { category?: string; limit?: number }): Promise<CommunityEvent[]>;
  getAllCommunityEvents(): Promise<CommunityEvent[]>;
  getCommunityEventById(id: string): Promise<CommunityEvent | undefined>;
  getCommunityEventsByUser(userId: string): Promise<CommunityEvent[]>;
  createCommunityEvent(data: InsertCommunityEvent): Promise<CommunityEvent>;
  updateCommunityEvent(id: string, data: Partial<InsertCommunityEvent>): Promise<CommunityEvent>;
  deleteCommunityEvent(id: string): Promise<void>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  getRsvpByUserAndEvent(userId: string, eventId: string): Promise<EventRsvp | undefined>;
  createEventRsvp(eventId: string, userId: string, userName: string, userEmail: string): Promise<EventRsvp>;
  deleteEventRsvp(eventId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createLead(lead: InsertLead): Promise<Lead> {
    const [result] = await db.insert(leads).values(lead).returning();
    return result;
  }

  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads);
  }

  async createPortfolioPhoto(photo: InsertPortfolioPhoto): Promise<PortfolioPhoto> {
    const [result] = await db.insert(portfolioPhotos).values(photo).returning();
    return result;
  }

  async getPortfolioPhotos(): Promise<PortfolioPhoto[]> {
    return db.select().from(portfolioPhotos).orderBy(desc(portfolioPhotos.createdAt));
  }

  async getPortfolioPhoto(id: string): Promise<PortfolioPhoto | undefined> {
    const [result] = await db.select().from(portfolioPhotos).where(eq(portfolioPhotos.id, id));
    return result;
  }

  async getPortfolioPhotosByTags(environment: string, brandMessage: string, emotionalImpact: string): Promise<PortfolioPhoto[]> {
    return db.select().from(portfolioPhotos).where(
      sql`${environment} = ANY(${portfolioPhotos.environments}) AND ${brandMessage} = ANY(${portfolioPhotos.brandMessages}) AND ${emotionalImpact} = ANY(${portfolioPhotos.emotionalImpacts})`
    );
  }

  async updatePortfolioPhoto(id: string, data: Partial<InsertPortfolioPhoto>): Promise<PortfolioPhoto> {
    const [result] = await db.update(portfolioPhotos).set(data).where(eq(portfolioPhotos.id, id)).returning();
    return result;
  }

  async getPortfolioPhotosBySpace(spaceId: string): Promise<PortfolioPhoto[]> {
    return db.select().from(portfolioPhotos).where(eq(portfolioPhotos.locationSpaceId, spaceId)).orderBy(desc(portfolioPhotos.createdAt));
  }

  async deletePortfolioPhoto(id: string): Promise<void> {
    await db.delete(portfolioPhotos).where(eq(portfolioPhotos.id, id));
  }

  async createShoot(shoot: InsertShoot): Promise<Shoot> {
    const [result] = await db.insert(shoots).values(shoot).returning();
    return result;
  }

  async getShootsByUser(userId: string): Promise<Shoot[]> {
    return db.select().from(shoots).where(eq(shoots.userId, userId)).orderBy(desc(shoots.createdAt));
  }

  async getShootById(id: string): Promise<Shoot | undefined> {
    const [result] = await db.select().from(shoots).where(eq(shoots.id, id));
    return result;
  }

  async updateShoot(id: string, data: Partial<InsertShoot>): Promise<Shoot> {
    const [result] = await db.update(shoots).set(data).where(eq(shoots.id, id)).returning();
    return result;
  }

  async getGalleryImages(shootId: string): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).where(eq(galleryImages.shootId, shootId)).orderBy(galleryImages.originalFilename, galleryImages.sortOrder);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const [result] = await db.insert(galleryImages).values(image).returning();
    return result;
  }

  async getGalleryImageById(id: string): Promise<GalleryImage | undefined> {
    const [result] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return result;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await db.delete(imageFavorites).where(eq(imageFavorites.imageId, id));
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
  }

  async getFolders(shootId: string): Promise<GalleryFolder[]> {
    return db.select().from(galleryFolders).where(eq(galleryFolders.shootId, shootId)).orderBy(galleryFolders.sortOrder);
  }

  async getFolderById(id: string): Promise<GalleryFolder | undefined> {
    const [result] = await db.select().from(galleryFolders).where(eq(galleryFolders.id, id));
    return result;
  }

  async createFolder(folder: InsertGalleryFolder): Promise<GalleryFolder> {
    const [result] = await db.insert(galleryFolders).values(folder).returning();
    return result;
  }

  async updateFolder(id: string, data: Partial<InsertGalleryFolder>): Promise<GalleryFolder> {
    const [result] = await db.update(galleryFolders).set(data).where(eq(galleryFolders.id, id)).returning();
    return result;
  }

  async deleteFolder(id: string): Promise<void> {
    const imgs = await db.select({ id: galleryImages.id }).from(galleryImages).where(eq(galleryImages.folderId, id));
    if (imgs.length > 0) {
      const imgIds = imgs.map((i) => i.id);
      await db.delete(imageFavorites).where(sql`${imageFavorites.imageId} = ANY(${imgIds})`);
    }
    await db.delete(galleryImages).where(eq(galleryImages.folderId, id));
    await db.delete(galleryFolders).where(eq(galleryFolders.id, id));
  }

  async deleteShoot(id: string): Promise<void> {
    const imgs = await db.select({ id: galleryImages.id }).from(galleryImages).where(eq(galleryImages.shootId, id));
    if (imgs.length > 0) {
      const imgIds = imgs.map((i) => i.id);
      await db.delete(imageFavorites).where(sql`${imageFavorites.imageId} = ANY(${imgIds})`);
    }
    await db.delete(galleryImages).where(eq(galleryImages.shootId, id));
    await db.delete(galleryFolders).where(eq(galleryFolders.shootId, id));
    await db.delete(shoots).where(eq(shoots.id, id));
  }

  async getAllShoots(): Promise<Shoot[]> {
    return db.select().from(shoots).orderBy(desc(shoots.createdAt));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserStripeAccount(id: string, stripeAccountId: string, onboardingComplete: string): Promise<User> {
    const [result] = await db.update(users).set({
      stripeAccountId,
      stripeOnboardingComplete: onboardingComplete,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return result;
  }

  async getFavorites(userId: string, shootId: string): Promise<string[]> {
    const favs = await db
      .select({ imageId: imageFavorites.imageId })
      .from(imageFavorites)
      .innerJoin(galleryImages, eq(imageFavorites.imageId, galleryImages.id))
      .where(and(eq(imageFavorites.userId, userId), eq(galleryImages.shootId, shootId)));
    return favs.map((f) => f.imageId);
  }

  async updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string }): Promise<User> {
    const updateData: any = { updatedAt: new Date() };
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    const [result] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result;
  }

  async transferShootsOwnership(fromUserId: string, toUserId: string): Promise<void> {
    await db.update(shoots).set({ userId: toUserId }).where(eq(shoots.userId, fromUserId));
  }

  async toggleFavorite(userId: string, imageId: string): Promise<boolean> {
    const [existing] = await db.select().from(imageFavorites).where(
      and(eq(imageFavorites.userId, userId), eq(imageFavorites.imageId, imageId))
    );
    if (existing) {
      await db.delete(imageFavorites).where(eq(imageFavorites.id, existing.id));
      return false;
    } else {
      await db.insert(imageFavorites).values({ userId, imageId });
      return true;
    }
  }
  async deleteUser(id: string): Promise<void> {
    const userShoots = await db.select().from(shoots).where(eq(shoots.userId, id));
    for (const shoot of userShoots) {
      await db.delete(imageFavorites).where(
        sql`${imageFavorites.imageId} IN (SELECT id FROM gallery_images WHERE shoot_id = ${shoot.id})`
      );
      await db.delete(galleryImages).where(eq(galleryImages.shootId, shoot.id));
      await db.delete(galleryFolders).where(eq(galleryFolders.shootId, shoot.id));
    }
    await db.delete(editRequestPhotos).where(
      sql`${editRequestPhotos.editRequestId} IN (SELECT id FROM edit_requests WHERE user_id = ${id})`
    );
    await db.delete(editRequests).where(eq(editRequests.userId, id));
    await db.delete(tokenTransactions).where(eq(tokenTransactions.userId, id));
    await db.delete(editTokens).where(eq(editTokens.userId, id));
    await db.delete(shoots).where(eq(shoots.userId, id));
    await db.delete(imageFavorites).where(eq(imageFavorites.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getOrCreateEditTokens(userId: string): Promise<EditToken> {
    const [existing] = await db.select().from(editTokens).where(eq(editTokens.userId, userId));
    if (existing) return existing;
    const resetDate = new Date();
    resetDate.setFullYear(resetDate.getFullYear() + 1);
    const [created] = await db.insert(editTokens).values({
      userId,
      annualTokens: 2,
      purchasedTokens: 0,
      annualTokenResetDate: resetDate,
      lastPhotoshootDate: new Date(),
    }).returning();
    await db.insert(tokenTransactions).values({
      userId,
      type: "earned_annual",
      amount: 2,
      description: "Annual edit tokens granted",
    });
    return created;
  }

  async resetExpiredAnnualTokens(userId: string): Promise<EditToken> {
    const tokens = await this.getOrCreateEditTokens(userId);
    const now = new Date();
    if (now >= tokens.annualTokenResetDate) {
      const newResetDate = new Date(tokens.annualTokenResetDate);
      while (newResetDate <= now) {
        newResetDate.setFullYear(newResetDate.getFullYear() + 1);
      }
      const [updated] = await db.update(editTokens)
        .set({ annualTokens: 2, annualTokenResetDate: newResetDate })
        .where(eq(editTokens.id, tokens.id))
        .returning();
      await db.insert(tokenTransactions).values({
        userId,
        type: "earned_annual",
        amount: 2,
        description: "Annual edit tokens reset",
      });
      return updated;
    }
    return tokens;
  }

  async deductTokens(userId: string, count: number): Promise<{ annualUsed: number; purchasedUsed: number }> {
    const tokens = await this.resetExpiredAnnualTokens(userId);
    const totalAvailable = tokens.annualTokens + tokens.purchasedTokens;
    if (totalAvailable < count) {
      throw new Error("Insufficient edit tokens");
    }
    const annualUsed = Math.min(tokens.annualTokens, count);
    const purchasedUsed = count - annualUsed;
    await db.update(editTokens)
      .set({
        annualTokens: tokens.annualTokens - annualUsed,
        purchasedTokens: tokens.purchasedTokens - purchasedUsed,
      })
      .where(eq(editTokens.id, tokens.id));
    if (annualUsed > 0) {
      await db.insert(tokenTransactions).values({
        userId,
        type: "used_annual",
        amount: -annualUsed,
        description: `Used ${annualUsed} annual token(s) for photo editing`,
      });
    }
    if (purchasedUsed > 0) {
      await db.insert(tokenTransactions).values({
        userId,
        type: "used_purchased",
        amount: -purchasedUsed,
        description: `Used ${purchasedUsed} purchased token(s) for photo editing`,
      });
    }
    return { annualUsed, purchasedUsed };
  }

  async addPurchasedTokens(userId: string, count: number): Promise<EditToken> {
    const tokens = await this.getOrCreateEditTokens(userId);
    const [updated] = await db.update(editTokens)
      .set({ purchasedTokens: tokens.purchasedTokens + count })
      .where(eq(editTokens.id, tokens.id))
      .returning();
    await db.insert(tokenTransactions).values({
      userId,
      type: "purchased",
      amount: count,
      description: `Purchased ${count} edit token(s)`,
    });
    return updated;
  }

  async adjustTokens(userId: string, annual: number, purchased: number): Promise<EditToken> {
    const tokens = await this.getOrCreateEditTokens(userId);
    const [updated] = await db.update(editTokens)
      .set({ annualTokens: annual, purchasedTokens: purchased })
      .where(eq(editTokens.id, tokens.id))
      .returning();
    const annualDiff = annual - tokens.annualTokens;
    const purchasedDiff = purchased - tokens.purchasedTokens;
    if (annualDiff !== 0) {
      await db.insert(tokenTransactions).values({
        userId,
        type: "admin_adjustment",
        amount: annualDiff,
        description: `Admin adjusted annual tokens by ${annualDiff > 0 ? "+" : ""}${annualDiff}`,
      });
    }
    if (purchasedDiff !== 0) {
      await db.insert(tokenTransactions).values({
        userId,
        type: "admin_adjustment",
        amount: purchasedDiff,
        description: `Admin adjusted purchased tokens by ${purchasedDiff > 0 ? "+" : ""}${purchasedDiff}`,
      });
    }
    return updated;
  }

  async getTokenTransactions(userId: string): Promise<TokenTransaction[]> {
    return db.select().from(tokenTransactions).where(eq(tokenTransactions.userId, userId)).orderBy(desc(tokenTransactions.createdAt));
  }

  async createTokenTransaction(tx: InsertTokenTransaction): Promise<TokenTransaction> {
    const [result] = await db.insert(tokenTransactions).values(tx).returning();
    return result;
  }

  async createEditRequest(data: InsertEditRequest): Promise<EditRequest> {
    const [result] = await db.insert(editRequests).values(data).returning();
    return result;
  }

  async getEditRequests(userId?: string): Promise<EditRequest[]> {
    if (userId) {
      return db.select().from(editRequests).where(eq(editRequests.userId, userId)).orderBy(desc(editRequests.createdAt));
    }
    return db.select().from(editRequests).orderBy(desc(editRequests.createdAt));
  }

  async getEditRequestPhotos(editRequestId: string): Promise<EditRequestPhoto[]> {
    return db.select().from(editRequestPhotos).where(eq(editRequestPhotos.editRequestId, editRequestId));
  }

  async createEditRequestPhoto(photo: InsertEditRequestPhoto): Promise<EditRequestPhoto> {
    const [result] = await db.insert(editRequestPhotos).values(photo).returning();
    return result;
  }

  async getAllEditTokens(): Promise<EditToken[]> {
    return db.select().from(editTokens);
  }

  async getEditRequestMessages(editRequestId: string): Promise<EditRequestMessage[]> {
    return db.select().from(editRequestMessages).where(eq(editRequestMessages.editRequestId, editRequestId)).orderBy(editRequestMessages.createdAt);
  }

  async createEditRequestMessage(msg: InsertEditRequestMessage): Promise<EditRequestMessage> {
    const [result] = await db.insert(editRequestMessages).values(msg).returning();
    return result;
  }

  async getShootMessages(shootId: string): Promise<ShootMessage[]> {
    return db.select().from(shootMessages).where(eq(shootMessages.shootId, shootId)).orderBy(shootMessages.createdAt);
  }

  async createShootMessage(msg: InsertShootMessage): Promise<ShootMessage> {
    const [result] = await db.insert(shootMessages).values(msg).returning();
    return result;
  }

  async getEditRequestById(id: string): Promise<EditRequest | undefined> {
    const [result] = await db.select().from(editRequests).where(eq(editRequests.id, id));
    return result;
  }

  async getEditRequestPhotoById(id: string): Promise<EditRequestPhoto | undefined> {
    const [result] = await db.select().from(editRequestPhotos).where(eq(editRequestPhotos.id, id));
    return result;
  }

  async updateEditRequestPhoto(id: string, data: { finishedImageUrl: string; finishedFilename: string }): Promise<EditRequestPhoto> {
    const [result] = await db.update(editRequestPhotos).set(data).where(eq(editRequestPhotos.id, id)).returning();
    return result;
  }

  async deleteEditRequestPhoto(id: string): Promise<void> {
    await db.delete(editRequestPhotos).where(eq(editRequestPhotos.id, id));
  }

  async deleteEditRequest(id: string): Promise<void> {
    await db.delete(editRequestMessages).where(eq(editRequestMessages.editRequestId, id));
    await db.delete(editRequestPhotos).where(eq(editRequestPhotos.editRequestId, id));
    await db.delete(editRequests).where(eq(editRequests.id, id));
  }

  async refundEditRequestTokens(userId: string, annualRefund: number, purchasedRefund: number): Promise<void> {
    const tokens = await this.getOrCreateEditTokens(userId);
    await db.update(editTokens)
      .set({
        annualTokens: tokens.annualTokens + annualRefund,
        purchasedTokens: tokens.purchasedTokens + purchasedRefund,
      })
      .where(eq(editTokens.id, tokens.id));
    if (annualRefund > 0) {
      await db.insert(tokenTransactions).values({
        userId,
        type: "refund",
        amount: annualRefund,
        description: `Refunded ${annualRefund} annual token(s) — edit request deleted`,
      });
    }
    if (purchasedRefund > 0) {
      await db.insert(tokenTransactions).values({
        userId,
        type: "refund",
        amount: purchasedRefund,
        description: `Refunded ${purchasedRefund} purchased token(s) — edit request deleted`,
      });
    }
  }

  async savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    const [result] = await db.insert(pushSubscriptions).values(sub).returning();
    return result;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getPushSubscriptionsByUser(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getPushSubscriptionsByRole(role: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.role, role));
  }

  async createEmployee(data: { username: string; passwordHash: string; displayName: string; role: string }): Promise<Employee> {
    const [result] = await db.insert(employees).values(data).returning();
    return result;
  }

  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.id, id));
    return result;
  }

  async getEmployeeByUsername(username: string): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.username, username));
    return result;
  }

  async updateEmployee(id: string, data: Partial<{ username: string; passwordHash: string; displayName: string; role: string; active: number }>): Promise<Employee> {
    const [result] = await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
    return result;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async createFeaturedProfessional(data: InsertFeaturedProfessional): Promise<FeaturedProfessional> {
    const [result] = await db.insert(featuredProfessionals).values(data).returning();
    return result;
  }

  async getFeaturedProfessionals(opts?: { category?: string; includeSamples?: boolean }): Promise<FeaturedProfessional[]> {
    const conditions = [];
    if (!opts?.includeSamples) {
      conditions.push(eq(featuredProfessionals.isSample, 0));
    }
    if (opts?.category) {
      conditions.push(eq(featuredProfessionals.category, opts.category));
    }
    if (conditions.length > 0) {
      return db.select().from(featuredProfessionals).where(and(...conditions)).orderBy(desc(featuredProfessionals.createdAt));
    }
    return db.select().from(featuredProfessionals).orderBy(desc(featuredProfessionals.createdAt));
  }

  async getFeaturedProfessionalBySlug(slug: string): Promise<FeaturedProfessional | undefined> {
    const [result] = await db.select().from(featuredProfessionals).where(eq(featuredProfessionals.slug, slug));
    return result;
  }

  async getFeaturedProfessionalById(id: string): Promise<FeaturedProfessional | undefined> {
    const [result] = await db.select().from(featuredProfessionals).where(eq(featuredProfessionals.id, id));
    return result;
  }

  async updateFeaturedProfessional(id: string, data: Partial<InsertFeaturedProfessional>): Promise<FeaturedProfessional> {
    const [result] = await db.update(featuredProfessionals).set(data).where(eq(featuredProfessionals.id, id)).returning();
    return result;
  }

  async deleteFeaturedProfessional(id: string): Promise<void> {
    await db.delete(featuredProfessionals).where(eq(featuredProfessionals.id, id));
  }

  async getFeaturedOfWeek(opts?: { includeSamples?: boolean }): Promise<FeaturedProfessional | undefined> {
    const conditions = [eq(featuredProfessionals.isFeaturedOfWeek, 1)];
    if (!opts?.includeSamples) conditions.push(eq(featuredProfessionals.isSample, 0));
    const [result] = await db.select().from(featuredProfessionals).where(and(...conditions));
    return result;
  }

  async getFeaturedCategories(opts?: { includeSamples?: boolean }): Promise<string[]> {
    const conditions = [];
    if (!opts?.includeSamples) conditions.push(eq(featuredProfessionals.isSample, 0));
    const query = db.selectDistinct({ category: featuredProfessionals.category })
      .from(featuredProfessionals)
      .orderBy(featuredProfessionals.category);
    const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    return rows.map(r => r.category);
  }

  async createNomination(data: InsertNomination): Promise<Nomination> {
    const [result] = await db.insert(nominations).values(data).returning();
    return result;
  }

  async getNominations(): Promise<Nomination[]> {
    return db.select().from(nominations).orderBy(desc(nominations.createdAt));
  }

  async updateNominationStatus(id: string, status: string): Promise<Nomination> {
    const [result] = await db.update(nominations).set({ status }).where(eq(nominations.id, id)).returning();
    return result;
  }

  async deleteNomination(id: string): Promise<void> {
    await db.delete(nominations).where(eq(nominations.id, id));
  }

  async createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [result] = await db.insert(newsletterSubscribers).values(data).returning();
    return result;
  }

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  }

  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const [result] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
    return result;
  }

  async updateNewsletterSubscriber(id: string, data: Partial<InsertNewsletterSubscriber>): Promise<NewsletterSubscriber> {
    const [result] = await db.update(newsletterSubscribers).set(data).where(eq(newsletterSubscribers.id, id)).returning();
    return result;
  }

  async deleteNewsletterSubscriber(id: string): Promise<void> {
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
  }

  async getSpaces(opts?: { type?: string; includeSamples?: boolean }): Promise<Space[]> {
    const conditions = [eq(spaces.isActive, 1), eq(spaces.approvalStatus, "approved")];
    if (opts?.includeSamples === false) {
      conditions.push(eq(spaces.isSample, 0));
    }
    if (opts?.type) {
      conditions.push(eq(spaces.type, opts.type));
    }
    return db.select().from(spaces).where(and(...conditions)).orderBy(desc(spaces.createdAt));
  }

  async getSpaceBySlug(slug: string): Promise<Space | undefined> {
    const [result] = await db.select().from(spaces).where(eq(spaces.slug, slug));
    return result;
  }

  async getSpaceById(id: string): Promise<Space | undefined> {
    const [result] = await db.select().from(spaces).where(eq(spaces.id, id));
    return result;
  }

  async getSpacesByUser(userId: string): Promise<Space[]> {
    return db.select().from(spaces).where(eq(spaces.userId, userId)).orderBy(desc(spaces.createdAt));
  }

  async getPendingSpaces(): Promise<Space[]> {
    return db.select().from(spaces).where(eq(spaces.approvalStatus, "pending")).orderBy(desc(spaces.createdAt));
  }

  async createSpace(data: InsertSpace): Promise<Space> {
    const [result] = await db.insert(spaces).values(data).returning();
    return result;
  }

  async getAllSpaces(): Promise<Space[]> {
    return db.select().from(spaces).orderBy(desc(spaces.createdAt));
  }

  async updateSpace(id: string, data: Partial<InsertSpace>): Promise<Space> {
    const [result] = await db.update(spaces).set(data).where(eq(spaces.id, id)).returning();
    return result;
  }

  async deleteSpace(id: string): Promise<void> {
    await db.delete(spaces).where(eq(spaces.id, id));
  }

  async createSpaceBooking(data: InsertSpaceBooking): Promise<SpaceBooking> {
    const [result] = await db.insert(spaceBookings).values(data).returning();
    return result;
  }

  async getSpaceBookingsByUser(userId: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings).where(eq(spaceBookings.userId, userId)).orderBy(desc(spaceBookings.createdAt));
  }

  async getAllSpaceBookingUserIds(): Promise<string[]> {
    const rows = await db.selectDistinct({ userId: spaceBookings.userId }).from(spaceBookings);
    return rows.map(r => r.userId);
  }

  async getSpaceBookingsBySpace(spaceId: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings).where(eq(spaceBookings.spaceId, spaceId)).orderBy(desc(spaceBookings.createdAt));
  }

  async getSpaceBookingsBySpaceAndDate(spaceId: string, date: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings)
      .where(and(eq(spaceBookings.spaceId, spaceId), eq(spaceBookings.bookingDate, date)))
      .orderBy(desc(spaceBookings.createdAt));
  }

  async getSpaceBookingById(id: string): Promise<SpaceBooking | undefined> {
    const [result] = await db.select().from(spaceBookings).where(eq(spaceBookings.id, id));
    return result;
  }

  async updateSpaceBookingStatus(id: string, status: string): Promise<SpaceBooking> {
    const [result] = await db.update(spaceBookings).set({ status }).where(eq(spaceBookings.id, id)).returning();
    return result;
  }

  async getSpaceMessages(spaceBookingId: string): Promise<SpaceMessage[]> {
    return db.select().from(spaceMessages).where(eq(spaceMessages.spaceBookingId, spaceBookingId)).orderBy(spaceMessages.createdAt);
  }

  async createSpaceMessage(msg: InsertSpaceMessage): Promise<SpaceMessage> {
    const [result] = await db.insert(spaceMessages).values(msg).returning();
    return result;
  }

  async updateSpaceBooking(id: string, data: Partial<SpaceBooking>): Promise<SpaceBooking> {
    const [result] = await db.update(spaceBookings).set(data).where(eq(spaceBookings.id, id)).returning();
    return result;
  }

  async markBookingRead(bookingId: string, role: "guest" | "host"): Promise<void> {
    const now = new Date();
    if (role === "guest") {
      await db.update(spaceBookings).set({ lastReadGuest: now }).where(eq(spaceBookings.id, bookingId));
    } else {
      await db.update(spaceBookings).set({ lastReadHost: now }).where(eq(spaceBookings.id, bookingId));
    }
  }

  async getLatestSpaceMessage(bookingId: string): Promise<SpaceMessage | undefined> {
    const [result] = await db.select().from(spaceMessages).where(eq(spaceMessages.spaceBookingId, bookingId)).orderBy(desc(spaceMessages.createdAt)).limit(1);
    return result;
  }

  async updateSpaceMessage(id: string, data: Partial<SpaceMessage>): Promise<void> {
    await db.update(spaceMessages).set(data).where(eq(spaceMessages.id, id));
  }

  async getPipelineContacts(): Promise<PipelineContact[]> {
    return db.select().from(pipelineContacts).orderBy(desc(pipelineContacts.updatedAt));
  }

  async getPipelineContact(id: string): Promise<PipelineContact | undefined> {
    const [result] = await db.select().from(pipelineContacts).where(eq(pipelineContacts.id, id));
    return result;
  }

  async createPipelineContact(data: InsertPipelineContact): Promise<PipelineContact> {
    const [result] = await db.insert(pipelineContacts).values(data).returning();
    return result;
  }

  async updatePipelineContact(id: string, data: Partial<InsertPipelineContact>): Promise<PipelineContact> {
    const [result] = await db.update(pipelineContacts).set({ ...data, updatedAt: new Date() }).where(eq(pipelineContacts.id, id)).returning();
    return result;
  }

  async deletePipelineContact(id: string): Promise<void> {
    await db.delete(pipelineActivities).where(eq(pipelineActivities.contactId, id));
    await db.delete(pipelineContacts).where(eq(pipelineContacts.id, id));
  }

  async getPipelineActivities(contactId: string): Promise<PipelineActivity[]> {
    return db.select().from(pipelineActivities).where(eq(pipelineActivities.contactId, contactId)).orderBy(desc(pipelineActivities.createdAt));
  }

  async createPipelineActivity(data: InsertPipelineActivity): Promise<PipelineActivity> {
    const [result] = await db.insert(pipelineActivities).values(data).returning();
    return result;
  }

  async getSpaceFavorites(userId: string): Promise<SpaceFavorite[]> {
    return db.select().from(spaceFavorites).where(eq(spaceFavorites.userId, userId)).orderBy(desc(spaceFavorites.createdAt));
  }

  async addSpaceFavorite(userId: string, spaceId: string): Promise<SpaceFavorite> {
    const existing = await db.select().from(spaceFavorites).where(and(eq(spaceFavorites.userId, userId), eq(spaceFavorites.spaceId, spaceId)));
    if (existing.length > 0) return existing[0];
    const [result] = await db.insert(spaceFavorites).values({ userId, spaceId }).returning();
    return result;
  }

  async removeSpaceFavorite(userId: string, spaceId: string): Promise<void> {
    await db.delete(spaceFavorites).where(and(eq(spaceFavorites.userId, userId), eq(spaceFavorites.spaceId, spaceId)));
  }

  async isSpaceFavorited(userId: string, spaceId: string): Promise<boolean> {
    const result = await db.select().from(spaceFavorites).where(and(eq(spaceFavorites.userId, userId), eq(spaceFavorites.spaceId, spaceId)));
    return result.length > 0;
  }

  async getOrCreateDirectConversation(spaceId: string, guestId: string, hostId: string): Promise<DirectConversation> {
    const [existing] = await db.select().from(directConversations).where(
      and(eq(directConversations.spaceId, spaceId), eq(directConversations.guestId, guestId))
    );
    if (existing) return existing;
    const [created] = await db.insert(directConversations).values({ spaceId, guestId, hostId }).returning();
    return created;
  }

  async getDirectConversationById(id: string): Promise<DirectConversation | undefined> {
    const [result] = await db.select().from(directConversations).where(eq(directConversations.id, id));
    return result;
  }

  async getDirectConversationsByUser(userId: string): Promise<DirectConversation[]> {
    return db.select().from(directConversations).where(
      or(eq(directConversations.guestId, userId), eq(directConversations.hostId, userId))
    ).orderBy(desc(directConversations.createdAt));
  }

  async getDirectMessages(conversationId: string): Promise<DirectMessage[]> {
    return db.select().from(directMessages).where(eq(directMessages.conversationId, conversationId)).orderBy(directMessages.createdAt);
  }

  async createDirectMessage(msg: InsertDirectMessage): Promise<DirectMessage> {
    const [result] = await db.insert(directMessages).values(msg).returning();
    return result;
  }

  async getLatestDirectMessage(conversationId: string): Promise<DirectMessage | undefined> {
    const [result] = await db.select().from(directMessages).where(eq(directMessages.conversationId, conversationId)).orderBy(desc(directMessages.createdAt)).limit(1);
    return result;
  }

  async markDirectConversationRead(conversationId: string, role: "guest" | "host"): Promise<void> {
    const now = new Date();
    if (role === "guest") {
      await db.update(directConversations).set({ lastReadGuest: now }).where(eq(directConversations.id, conversationId));
    } else {
      await db.update(directConversations).set({ lastReadHost: now }).where(eq(directConversations.id, conversationId));
    }
  }

  // --- Admin conversations ---

  async getOrCreateAdminConversation(clientId: string): Promise<AdminConversation> {
    const [existing] = await db.select().from(adminConversations).where(eq(adminConversations.clientId, clientId));
    if (existing) return existing;
    const [created] = await db.insert(adminConversations).values({ clientId }).returning();
    return created;
  }

  async getAdminConversationById(id: string): Promise<AdminConversation | undefined> {
    const [result] = await db.select().from(adminConversations).where(eq(adminConversations.id, id));
    return result;
  }

  async getAdminConversationByClient(clientId: string): Promise<AdminConversation | undefined> {
    const [result] = await db.select().from(adminConversations).where(eq(adminConversations.clientId, clientId));
    return result;
  }

  async getAllAdminConversations(): Promise<AdminConversation[]> {
    return db.select().from(adminConversations).orderBy(desc(adminConversations.createdAt));
  }

  async getAdminMessages(conversationId: string): Promise<AdminMessage[]> {
    return db.select().from(adminMessages).where(eq(adminMessages.conversationId, conversationId)).orderBy(adminMessages.createdAt);
  }

  async createAdminMessage(msg: InsertAdminMessage): Promise<AdminMessage> {
    const [result] = await db.insert(adminMessages).values(msg).returning();
    return result;
  }

  async getLatestAdminMessage(conversationId: string): Promise<AdminMessage | undefined> {
    const [result] = await db.select().from(adminMessages).where(eq(adminMessages.conversationId, conversationId)).orderBy(desc(adminMessages.createdAt)).limit(1);
    return result;
  }

  async markAdminConversationRead(conversationId: string, role: "admin" | "client"): Promise<void> {
    const now = new Date();
    if (role === "admin") {
      await db.update(adminConversations).set({ lastReadAdmin: now }).where(eq(adminConversations.id, conversationId));
    } else {
      await db.update(adminConversations).set({ lastReadClient: now }).where(eq(adminConversations.id, conversationId));
    }
  }

  // --- Fee system ---

  async getCompletedBookingCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(spaceBookings)
      .where(and(
        eq(spaceBookings.userId, userId),
        eq(spaceBookings.paymentStatus, "paid"),
        // Count bookings that are completed, or approved with a past date
        sql`(${spaceBookings.status} = 'completed' OR (${spaceBookings.status} = 'approved' AND ${spaceBookings.bookingDate}::date < CURRENT_DATE))`,
      ));
    return result[0]?.count ?? 0;
  }

  async getReferralLinkByCode(code: string): Promise<ReferralLink | undefined> {
    const [result] = await db.select().from(referralLinks).where(eq(referralLinks.uniqueCode, code));
    return result;
  }

  async getReferralLinksByHost(hostId: string): Promise<ReferralLink[]> {
    return db.select().from(referralLinks).where(eq(referralLinks.hostId, hostId)).orderBy(desc(referralLinks.createdAt));
  }

  async createReferralLink(data: InsertReferralLink): Promise<ReferralLink> {
    const [result] = await db.insert(referralLinks).values(data).returning();
    return result;
  }

  async incrementReferralClicks(id: string): Promise<void> {
    await db.update(referralLinks)
      .set({ clickCount: sql`${referralLinks.clickCount} + 1` })
      .where(eq(referralLinks.id, id));
  }

  async incrementReferralBookings(id: string, revenueCents: number): Promise<void> {
    await db.update(referralLinks)
      .set({
        bookingCount: sql`${referralLinks.bookingCount} + 1`,
        totalRevenueGenerated: sql`${referralLinks.totalRevenueGenerated} + ${revenueCents}`,
      })
      .where(eq(referralLinks.id, id));
  }

  async createFeeAuditLog(data: Omit<FeeAuditLog, "id" | "createdAt">): Promise<void> {
    await db.insert(feeAuditLog).values(data);
  }

  async deleteReferralLink(id: string): Promise<void> {
    await db.delete(referralLinks).where(eq(referralLinks.id, id));
  }

  // --- Check-in/check-out notifications ---

  async getBookingsForCheckInNotifications(dateStr: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings).where(
      and(
        eq(spaceBookings.status, "approved"),
        eq(spaceBookings.paymentStatus, "paid"),
        eq(spaceBookings.bookingDate, dateStr),
      )
    );
  }

  async getBookingsNeedingNoShowAlert(dateStr: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings).where(
      and(
        eq(spaceBookings.status, "approved"),
        eq(spaceBookings.paymentStatus, "paid"),
        eq(spaceBookings.bookingDate, dateStr),
        isNull(spaceBookings.checkedInAt),
      )
    );
  }

  async getBookingsNeedingEndReminder(dateStr: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings).where(
      and(
        eq(spaceBookings.status, "checked_in"),
        eq(spaceBookings.bookingDate, dateStr),
      )
    );
  }

  async getBookingsNeedingAutoCheckout(): Promise<SpaceBooking[]> {
    // Checked-in bookings where the booking date has passed (auto-checkout safety net)
    const today = new Date().toISOString().split("T")[0];
    return db.select().from(spaceBookings).where(
      and(
        eq(spaceBookings.status, "checked_in"),
        sql`${spaceBookings.bookingDate} <= ${today}`,
      )
    );
  }

  // --- Payouts ---

  async getBookingsReadyForCompletion(): Promise<SpaceBooking[]> {
    // Bookings that are "approved" or "checked_in", paid, and whose booking date has passed
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return db.select().from(spaceBookings).where(
      and(
        sql`(${spaceBookings.status} = 'approved' OR ${spaceBookings.status} = 'checked_in')`,
        eq(spaceBookings.paymentStatus, "paid"),
        sql`${spaceBookings.bookingDate} < ${today}`,
      )
    );
  }

  async getBookingsPendingPayout(): Promise<SpaceBooking[]> {
    // Completed bookings with payout_status "pending" (ready for transfer)
    return db.select().from(spaceBookings).where(
      and(
        eq(spaceBookings.status, "completed"),
        eq(spaceBookings.paymentStatus, "paid"),
        sql`(${spaceBookings.payoutStatus} = 'pending' OR (${spaceBookings.payoutStatus} IS NULL AND ${spaceBookings.status} = 'completed'))`,
      )
    );
  }

  async getPayoutsByHost(hostId: string): Promise<SpaceBooking[]> {
    // Get all bookings for spaces owned by this host that have been paid out
    const hostSpaces = await this.getSpacesByUser(hostId);
    if (hostSpaces.length === 0) return [];
    const spaceIds = hostSpaces.map(s => s.id);
    return db.select().from(spaceBookings).where(
      and(
        sql`${spaceBookings.spaceId} IN (${sql.join(spaceIds.map(id => sql`${id}`), sql`, `)})`,
        sql`${spaceBookings.payoutStatus} IN ('paid', 'processing', 'pending', 'held')`,
      )
    ).orderBy(desc(spaceBookings.createdAt));
  }
  // ── Reviews ──────────────────────────────────────────────────────
  async getSpaceReviews(spaceId: string): Promise<SpaceReview[]> {
    return db.select().from(spaceReviews)
      .where(and(eq(spaceReviews.spaceId, spaceId), eq(spaceReviews.status, "published")))
      .orderBy(desc(spaceReviews.createdAt));
  }

  async getReviewByBooking(bookingId: string): Promise<SpaceReview | undefined> {
    const [result] = await db.select().from(spaceReviews).where(eq(spaceReviews.bookingId, bookingId));
    return result;
  }

  async createSpaceReview(data: InsertSpaceReview): Promise<SpaceReview> {
    const [result] = await db.insert(spaceReviews).values(data).returning();
    return result;
  }

  async updateSpaceReview(id: string, data: Partial<SpaceReview>): Promise<SpaceReview> {
    const [result] = await db.update(spaceReviews).set(data).where(eq(spaceReviews.id, id)).returning();
    return result;
  }

  async deleteSpaceReview(id: string): Promise<void> {
    await db.delete(spaceReviews).where(eq(spaceReviews.id, id));
  }

  async getAllReviews(): Promise<SpaceReview[]> {
    return db.select().from(spaceReviews).orderBy(desc(spaceReviews.createdAt));
  }

  async getPublishedSpaceReviews(): Promise<SpaceReview[]> {
    return db.select().from(spaceReviews).where(eq(spaceReviews.status, "published")).orderBy(desc(spaceReviews.createdAt));
  }

  async getReviewByShoot(shootId: string): Promise<ShootReview | undefined> {
    const [result] = await db.select().from(shootReviews).where(eq(shootReviews.shootId, shootId));
    return result;
  }

  async createShootReview(data: InsertShootReview): Promise<ShootReview> {
    const [result] = await db.insert(shootReviews).values(data).returning();
    return result;
  }

  async updateShootReview(id: string, data: Partial<ShootReview>): Promise<ShootReview> {
    const [result] = await db.update(shootReviews).set(data).where(eq(shootReviews.id, id)).returning();
    return result;
  }

  async deleteShootReview(id: string): Promise<void> {
    await db.delete(shootReviews).where(eq(shootReviews.id, id));
  }

  async getAllShootReviews(): Promise<ShootReview[]> {
    return db.select().from(shootReviews).orderBy(desc(shootReviews.createdAt));
  }

  async getPublishedShootReviews(): Promise<ShootReview[]> {
    return db.select().from(shootReviews).where(eq(shootReviews.status, "published")).orderBy(desc(shootReviews.createdAt));
  }

  async getSpaceAverageRating(spaceId: string): Promise<{ avg: number; count: number }> {
    const reviews = await db.select().from(spaceReviews)
      .where(and(eq(spaceReviews.spaceId, spaceId), eq(spaceReviews.status, "published")));
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  }

  async getAverageRatingsForSpaces(spaceIds: string[]): Promise<Map<string, { avg: number; count: number }>> {
    const result = new Map<string, { avg: number; count: number }>();
    if (spaceIds.length === 0) return result;

    const rows = await db.execute(sql`
      SELECT space_id,
        ROUND(AVG(rating)::numeric, 1) as avg_rating,
        COUNT(*)::integer as review_count
      FROM space_reviews
      WHERE space_id IN ${sql`(${sql.join(spaceIds.map(id => sql`${id}`), sql`, `)})`}
      AND status = 'published'
      GROUP BY space_id
    `);

    for (const row of (rows as any).rows || []) {
      result.set(row.space_id, {
        avg: Number(row.avg_rating) || 0,
        count: Number(row.review_count) || 0,
      });
    }
    return result;
  }

  // ── Wishlists ───────────────────────────────────────────────────
  async getWishlistCollections(userId: string): Promise<WishlistCollection[]> {
    return db.select().from(wishlistCollections)
      .where(eq(wishlistCollections.userId, userId))
      .orderBy(desc(wishlistCollections.createdAt));
  }

  async createWishlistCollection(data: InsertWishlistCollection): Promise<WishlistCollection> {
    const [result] = await db.insert(wishlistCollections).values(data).returning();
    return result;
  }

  async updateWishlistCollection(id: string, name: string): Promise<WishlistCollection> {
    const [result] = await db.update(wishlistCollections).set({ name }).where(eq(wishlistCollections.id, id)).returning();
    return result;
  }

  async deleteWishlistCollection(id: string): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.collectionId, id));
    await db.delete(wishlistCollections).where(eq(wishlistCollections.id, id));
  }

  async getWishlistItems(collectionId: string): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems)
      .where(eq(wishlistItems.collectionId, collectionId))
      .orderBy(desc(wishlistItems.createdAt));
  }

  async addWishlistItem(collectionId: string, spaceId: string): Promise<WishlistItem> {
    const existing = await db.select().from(wishlistItems)
      .where(and(eq(wishlistItems.collectionId, collectionId), eq(wishlistItems.spaceId, spaceId)));
    if (existing.length > 0) return existing[0];
    const [result] = await db.insert(wishlistItems).values({ collectionId, spaceId }).returning();
    return result;
  }

  async removeWishlistItem(collectionId: string, spaceId: string): Promise<void> {
    await db.delete(wishlistItems)
      .where(and(eq(wishlistItems.collectionId, collectionId), eq(wishlistItems.spaceId, spaceId)));
  }

  // ── Recurring Bookings ──────────────────────────────────────────
  async createRecurringBooking(data: InsertRecurringBooking): Promise<RecurringBooking> {
    const [result] = await db.insert(recurringBookings).values(data).returning();
    return result;
  }

  async getRecurringBookingsByUser(userId: string): Promise<RecurringBooking[]> {
    return db.select().from(recurringBookings)
      .where(eq(recurringBookings.userId, userId))
      .orderBy(desc(recurringBookings.createdAt));
  }

  async getRecurringBookingsBySpace(spaceId: string): Promise<RecurringBooking[]> {
    return db.select().from(recurringBookings)
      .where(eq(recurringBookings.spaceId, spaceId))
      .orderBy(desc(recurringBookings.createdAt));
  }

  async updateRecurringBooking(id: string, data: Partial<RecurringBooking>): Promise<RecurringBooking> {
    const [result] = await db.update(recurringBookings).set(data).where(eq(recurringBookings.id, id)).returning();
    return result;
  }

  async deleteRecurringBooking(id: string): Promise<void> {
    await db.delete(recurringBookings).where(eq(recurringBookings.id, id));
  }

  async getRecurringBookingById(id: string): Promise<RecurringBooking | undefined> {
    const [result] = await db.select().from(recurringBookings).where(eq(recurringBookings.id, id));
    return result;
  }

  async getActiveRecurringBookings(): Promise<RecurringBooking[]> {
    return db.select().from(recurringBookings)
      .where(or(
        eq(recurringBookings.status, "confirmed"),
        eq(recurringBookings.status, "active"),
      ))
      .orderBy(desc(recurringBookings.createdAt));
  }

  async getSpaceBookingsByRecurringId(recurringBookingId: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings)
      .where(eq(spaceBookings.recurringBookingId, recurringBookingId))
      .orderBy(desc(spaceBookings.bookingDate));
  }

  // ── Host Response Metrics ───────────────────────────────────────
  async getHostResponseMetrics(hostId: string): Promise<{ avgMinutes: number; responseRate: number }> {
    // Single query: join spaces -> bookings -> messages, filter by host
    const result = await db.execute(sql`
      WITH host_spaces AS (
        SELECT id FROM spaces WHERE user_id = ${hostId}
      ),
      guest_messages AS (
        SELECT sm.id, sm.space_booking_id, sm.created_at as guest_sent_at,
          (SELECT MIN(sm2.created_at) FROM space_messages sm2
           WHERE sm2.space_booking_id = sm.space_booking_id
           AND sm2.sender_role = 'host'
           AND sm2.created_at > sm.created_at) as host_replied_at
        FROM space_messages sm
        JOIN space_bookings sb ON sb.id = sm.space_booking_id
        WHERE sb.space_id IN (SELECT id FROM host_spaces)
        AND sm.sender_role = 'guest'
      )
      SELECT
        COUNT(*) as total_guest_messages,
        COUNT(host_replied_at) as responded_count,
        AVG(EXTRACT(EPOCH FROM (host_replied_at - guest_sent_at)) / 60)::integer as avg_minutes
      FROM guest_messages
    `);

    const row = (result as any).rows?.[0] || {};
    const totalMessages = Number(row.total_guest_messages) || 0;
    const respondedCount = Number(row.responded_count) || 0;
    const avgMinutes = Number(row.avg_minutes) || 0;

    return {
      avgMinutes,
      responseRate: totalMessages > 0 ? Math.round((respondedCount / totalMessages) * 100) : 0,
    };
  }

  // ── Calendar Sync ─────────────────────────────────────────────────

  async createHostCalendarConnection(data: InsertHostCalendarConnection): Promise<HostCalendarConnection> {
    const [result] = await db.insert(hostCalendarConnections).values(data).returning();
    return result;
  }

  async getHostCalendarConnectionByUserId(userId: string): Promise<HostCalendarConnection | undefined> {
    const [result] = await db.select().from(hostCalendarConnections).where(eq(hostCalendarConnections.userId, userId));
    return result;
  }

  async updateHostCalendarConnection(id: string, data: Partial<HostCalendarConnection>): Promise<HostCalendarConnection> {
    const [result] = await db.update(hostCalendarConnections).set({ ...data, updatedAt: new Date() }).where(eq(hostCalendarConnections.id, id)).returning();
    return result;
  }

  async deleteHostCalendarConnection(id: string): Promise<void> {
    await db.delete(hostCalendarConnections).where(eq(hostCalendarConnections.id, id));
  }

  async getActiveHostCalendarConnections(): Promise<HostCalendarConnection[]> {
    return db.select().from(hostCalendarConnections).where(eq(hostCalendarConnections.syncEnabled, 1));
  }

  async createIcalFeed(data: InsertIcalFeed): Promise<IcalFeed> {
    const [result] = await db.insert(icalFeeds).values(data).returning();
    return result;
  }

  async getIcalFeedsBySpace(spaceId: string): Promise<IcalFeed[]> {
    return db.select().from(icalFeeds).where(eq(icalFeeds.spaceId, spaceId)).orderBy(desc(icalFeeds.createdAt));
  }

  async getIcalFeedById(id: string): Promise<IcalFeed | undefined> {
    const [result] = await db.select().from(icalFeeds).where(eq(icalFeeds.id, id));
    return result;
  }

  async updateIcalFeed(id: string, data: Partial<IcalFeed>): Promise<IcalFeed> {
    const [result] = await db.update(icalFeeds).set(data).where(eq(icalFeeds.id, id)).returning();
    return result;
  }

  async deleteIcalFeed(id: string): Promise<void> {
    await db.delete(icalFeeds).where(eq(icalFeeds.id, id));
  }

  async getActiveIcalFeeds(): Promise<IcalFeed[]> {
    return db.select().from(icalFeeds).where(eq(icalFeeds.isActive, 1));
  }

  async upsertExternalCalendarBlocks(sourceId: string, blocks: InsertExternalCalendarBlock[]): Promise<void> {
    await db.delete(externalCalendarBlocks).where(eq(externalCalendarBlocks.sourceId, sourceId));
    if (blocks.length > 0) {
      await db.insert(externalCalendarBlocks).values(blocks);
    }
  }

  async getExternalBlocksBySpaceAndDate(spaceId: string, date: string): Promise<ExternalCalendarBlock[]> {
    return db.select().from(externalCalendarBlocks)
      .where(and(eq(externalCalendarBlocks.spaceId, spaceId), eq(externalCalendarBlocks.blockDate, date)));
  }

  async deleteExternalBlocksBySource(sourceId: string): Promise<void> {
    await db.delete(externalCalendarBlocks).where(eq(externalCalendarBlocks.sourceId, sourceId));
  }

  async cleanupExpiredExternalBlocks(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const result = await db.delete(externalCalendarBlocks)
      .where(sql`${externalCalendarBlocks.blockDate} < ${yesterdayStr}`)
      .returning();
    return result.length;
  }

  // ── Community Events ──────────────────────────────────────────
  async getApprovedUpcomingEvents(opts?: { category?: string; limit?: number }): Promise<CommunityEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    const conditions = [eq(communityEvents.approvalStatus, "approved"), sql`${communityEvents.eventDate} >= ${today}`];
    if (opts?.category) conditions.push(eq(communityEvents.category, opts.category));
    let query = db.select().from(communityEvents).where(and(...conditions)).orderBy(asc(communityEvents.eventDate), asc(communityEvents.eventTime));
    if (opts?.limit) query = query.limit(opts.limit) as any;
    return query;
  }

  async getAllCommunityEvents(): Promise<CommunityEvent[]> {
    return db.select().from(communityEvents).orderBy(desc(communityEvents.createdAt));
  }

  async getCommunityEventById(id: string): Promise<CommunityEvent | undefined> {
    const [result] = await db.select().from(communityEvents).where(eq(communityEvents.id, id));
    return result;
  }

  async getCommunityEventsByUser(userId: string): Promise<CommunityEvent[]> {
    return db.select().from(communityEvents).where(eq(communityEvents.userId, userId)).orderBy(desc(communityEvents.createdAt));
  }

  async createCommunityEvent(data: InsertCommunityEvent): Promise<CommunityEvent> {
    const [result] = await db.insert(communityEvents).values(data).returning();
    return result;
  }

  async updateCommunityEvent(id: string, data: Partial<InsertCommunityEvent>): Promise<CommunityEvent> {
    const [result] = await db.update(communityEvents).set(data).where(eq(communityEvents.id, id)).returning();
    return result;
  }

  async deleteCommunityEvent(id: string): Promise<void> {
    await db.delete(eventRsvps).where(eq(eventRsvps.eventId, id));
    await db.delete(communityEvents).where(eq(communityEvents.id, id));
  }

  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    return db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId)).orderBy(desc(eventRsvps.createdAt));
  }

  async getRsvpByUserAndEvent(userId: string, eventId: string): Promise<EventRsvp | undefined> {
    const [result] = await db.select().from(eventRsvps).where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.eventId, eventId)));
    return result;
  }

  async createEventRsvp(eventId: string, userId: string, userName: string, userEmail: string): Promise<EventRsvp> {
    const [result] = await db.insert(eventRsvps).values({ eventId, userId, userName, userEmail }).returning();
    await db.update(communityEvents).set({ rsvpCount: sql`COALESCE(${communityEvents.rsvpCount}, 0) + 1` }).where(eq(communityEvents.id, eventId));
    return result;
  }

  async deleteEventRsvp(eventId: string, userId: string): Promise<void> {
    await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    await db.update(communityEvents).set({ rsvpCount: sql`GREATEST(COALESCE(${communityEvents.rsvpCount}, 0) - 1, 0)` }).where(eq(communityEvents.id, eventId));
  }
}

export const storage = new DatabaseStorage();
