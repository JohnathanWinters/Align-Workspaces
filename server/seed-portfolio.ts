import { db } from "./db";
import { portfolioPhotos } from "@shared/schema";
import { sql } from "drizzle-orm";

const portfolioData = [
  {
    imageUrl: "/images/portfolio-office-assured-cozy.jpg",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["cozy"],
    colorPalette: [
      { hex: "#8B3A2A", keyword: "Terracotta" },
      { hex: "#D4A574", keyword: "Honey Gold" },
      { hex: "#5C4033", keyword: "Dark Walnut" },
    ],
  },
  {
    imageUrl: "/images/portfolio-urban-assured-bright-2.jpg",
    environments: ["urban"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#3D5A7E", keyword: "Steel Teal" },
      { hex: "#E8DFD5", keyword: "Soft Linen" },
      { hex: "#A67B5B", keyword: "Warm Taupe" },
    ],
  },
  {
    imageUrl: "/images/portfolio-urban-confidence-bright.jpg",
    environments: ["urban"],
    brandMessages: ["confidence"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#2B3A52", keyword: "Deep Navy" },
      { hex: "#C0C0C0", keyword: "Silver" },
      { hex: "#8C7A68", keyword: "Warm Earth" },
    ],
  },
  {
    imageUrl: "/images/portfolio-1.jpg",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#E8DDD0", keyword: "Warm Cream" },
      { hex: "#D4A5A0", keyword: "Blush Rose" },
      { hex: "#8B6F4E", keyword: "Caramel" },
    ],
  },
  {
    imageUrl: "/images/portfolio-2.jpg",
    environments: ["office"],
    brandMessages: ["confidence"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#E84B2A", keyword: "Coral Red" },
      { hex: "#4A7C59", keyword: "Leaf Green" },
      { hex: "#2D2D2D", keyword: "Charcoal" },
    ],
  },
  {
    imageUrl: "/images/portfolio/IMG_2875.jpg",
    environments: ["nature"],
    brandMessages: ["empathy"],
    emotionalImpacts: ["powerful"],
    colorPalette: [
      { hex: "#3D2B1F", keyword: "Espresso" },
      { hex: "#C4956A", keyword: "Amber Glow" },
      { hex: "#4A5A4A", keyword: "Moss Shadow" },
    ],
  },
  {
    imageUrl: "/images/portfolio/IMG_6186.jpg",
    environments: ["nature"],
    brandMessages: ["assured"],
    emotionalImpacts: ["powerful"],
    colorPalette: [
      { hex: "#5C4A3A", keyword: "Dark Walnut" },
      { hex: "#D4A574", keyword: "Golden Honey" },
      { hex: "#2E3B2E", keyword: "Forest Shadow" },
    ],
  },
  {
    imageUrl: "/images/portfolio-urban-assured-bright.jpg",
    environments: ["urban"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#8C8C8C", keyword: "Warm Grey" },
      { hex: "#2B1D15", keyword: "Deep Espresso" },
      { hex: "#C4956A", keyword: "Warm Caramel" },
    ],
  },
  {
    imageUrl: "/images/portfolio-office-assured-bright-2.jpg",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#C49A6C", keyword: "Warm Tan" },
      { hex: "#3B2A1A", keyword: "Dark Mocha" },
      { hex: "#D9CBBA", keyword: "Soft Beige" },
    ],
  },
  {
    imageUrl: "/images/portfolio-office-assured-bright-3.jpg",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#3A2D4F", keyword: "Deep Plum" },
      { hex: "#2B2018", keyword: "Dark Cocoa" },
      { hex: "#A8B0A0", keyword: "Sage Grey" },
    ],
  },
];

export async function seedPortfolioIfEmpty() {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(portfolioPhotos);

    if (count === 0) {
      console.log("Seeding portfolio photos...");
      await db.insert(portfolioPhotos).values(portfolioData);
      console.log(`Seeded ${portfolioData.length} portfolio photos`);
    }
  } catch (error) {
    console.error("Failed to seed portfolio photos (non-fatal):", error);
  }
}
