import { type Lead, type InsertLead, leads, type PortfolioPhoto, type InsertPortfolioPhoto, portfolioPhotos, type Shoot, type InsertShoot, shoots, type GalleryImage, type InsertGalleryImage, galleryImages } from "@shared/schema";
import { db } from "./db";
import { sql, eq, desc } from "drizzle-orm";

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
  getGalleryImages(shootId: string): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
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
}

export const storage = new DatabaseStorage();
