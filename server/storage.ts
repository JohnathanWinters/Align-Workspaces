import { type Lead, type InsertLead, leads, type PortfolioPhoto, type InsertPortfolioPhoto, portfolioPhotos, type Shoot, type InsertShoot, shoots, type GalleryImage, type InsertGalleryImage, galleryImages, type GalleryFolder, type InsertGalleryFolder, galleryFolders, type User, users, imageFavorites, type ImageFavorite, type EditToken, type InsertEditToken, editTokens, type TokenTransaction, type InsertTokenTransaction, tokenTransactions, type EditRequest, type InsertEditRequest, editRequests, type EditRequestPhoto, type InsertEditRequestPhoto, editRequestPhotos, type EditRequestMessage, type InsertEditRequestMessage, editRequestMessages, type PushSubscription, type InsertPushSubscription, pushSubscriptions } from "@shared/schema";
import { db } from "./db";
import { sql, eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  createPortfolioPhoto(photo: InsertPortfolioPhoto): Promise<PortfolioPhoto>;
  getPortfolioPhotos(): Promise<PortfolioPhoto[]>;
  getPortfolioPhotosByTags(environment: string, brandMessage: string, emotionalImpact: string): Promise<PortfolioPhoto[]>;
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
  getUserByEmail(email: string): Promise<User | undefined>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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
}

export const storage = new DatabaseStorage();
