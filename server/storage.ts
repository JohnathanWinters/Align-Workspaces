import { type Lead, type InsertLead, leads, type PortfolioPhoto, type InsertPortfolioPhoto, portfolioPhotos, type Shoot, type InsertShoot, shoots, type GalleryImage, type InsertGalleryImage, galleryImages, type GalleryFolder, type InsertGalleryFolder, galleryFolders, type User, users, imageFavorites, type ImageFavorite, type EditToken, type InsertEditToken, editTokens, type TokenTransaction, type InsertTokenTransaction, tokenTransactions, type EditRequest, type InsertEditRequest, editRequests, type EditRequestPhoto, type InsertEditRequestPhoto, editRequestPhotos, type EditRequestMessage, type InsertEditRequestMessage, editRequestMessages, type PushSubscription, type InsertPushSubscription, pushSubscriptions, type Employee, type InsertEmployee, employees, type FeaturedProfessional, type InsertFeaturedProfessional, featuredProfessionals, type Nomination, type InsertNomination, nominations, type NewsletterSubscriber, type InsertNewsletterSubscriber, newsletterSubscribers, type Space, type InsertSpace, spaces, type SpaceBooking, type InsertSpaceBooking, spaceBookings, type SpaceMessage, type InsertSpaceMessage, spaceMessages } from "@shared/schema";
import { db } from "./db";
import { sql, eq, desc, and, isNull, ne, ilike } from "drizzle-orm";

export interface IStorage {
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  createPortfolioPhoto(photo: InsertPortfolioPhoto): Promise<PortfolioPhoto>;
  getPortfolioPhotos(): Promise<PortfolioPhoto[]>;
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
  getSpaceBookingsBySpace(spaceId: string): Promise<SpaceBooking[]>;
  getSpaceBookingById(id: string): Promise<SpaceBooking | undefined>;
  updateSpaceBookingStatus(id: string, status: string): Promise<SpaceBooking>;
  updateSpaceBooking(id: string, data: Partial<SpaceBooking>): Promise<SpaceBooking>;
  markBookingRead(bookingId: string, role: "guest" | "host"): Promise<void>;
  getSpaceMessages(spaceBookingId: string): Promise<SpaceMessage[]>;
  createSpaceMessage(msg: InsertSpaceMessage): Promise<SpaceMessage>;
  getLatestSpaceMessage(bookingId: string): Promise<SpaceMessage | undefined>;
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
    return db.select().from(portfolioPhotos);
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
    return db.select().from(galleryImages).where(eq(galleryImages.shootId, shootId)).orderBy(galleryImages.sortOrder);
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

  async getSpaceBookingsBySpace(spaceId: string): Promise<SpaceBooking[]> {
    return db.select().from(spaceBookings).where(eq(spaceBookings.spaceId, spaceId)).orderBy(desc(spaceBookings.createdAt));
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
}

export const storage = new DatabaseStorage();
