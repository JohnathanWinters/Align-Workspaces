import { type Lead, type InsertLead, leads, type PortfolioPhoto, type InsertPortfolioPhoto, portfolioPhotos, type Shoot, type InsertShoot, shoots, type GalleryImage, type InsertGalleryImage, galleryImages, type GalleryFolder, type InsertGalleryFolder, galleryFolders, type User, users } from "@shared/schema";
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
    await db.delete(galleryImages).where(eq(galleryImages.folderId, id));
    await db.delete(galleryFolders).where(eq(galleryFolders.id, id));
  }

  async deleteShoot(id: string): Promise<void> {
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
}

export const storage = new DatabaseStorage();
