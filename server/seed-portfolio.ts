import { db } from "./db";
import { portfolioPhotos } from "@shared/schema";
import { sql } from "drizzle-orm";

const portfolioData = [
  {
    imageUrl: "/images/portfolio-office-assured-cozy.webp",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["cozy"],
    colorPalette: [
      { hex: "#8B3A2A", keyword: "Terracotta" },
      { hex: "#D4A574", keyword: "Honey Gold" },
      { hex: "#5C4033", keyword: "Dark Walnut" },
    ],
    subjectName: "Evelyn",
    subjectProfession: "Artist",
  },
  {
    imageUrl: "/images/portfolio-urban-assured-bright-2.webp",
    environments: ["urban"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#3D5A7E", keyword: "Steel Teal" },
      { hex: "#E8DFD5", keyword: "Soft Linen" },
      { hex: "#A67B5B", keyword: "Warm Taupe" },
    ],
    subjectName: "Amari",
    subjectProfession: "Real Estate Agent",
  },
  {
    imageUrl: "/images/portfolio-urban-confidence-bright.webp",
    environments: ["urban"],
    brandMessages: ["confidence"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#2B3A52", keyword: "Deep Navy" },
      { hex: "#C0C0C0", keyword: "Silver" },
      { hex: "#8C7A68", keyword: "Warm Earth" },
    ],
    subjectName: "Sergio",
    subjectProfession: "Writer",
  },
  {
    imageUrl: "/images/portfolio-1.webp",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#E8DDD0", keyword: "Warm Cream" },
      { hex: "#D4A5A0", keyword: "Blush Rose" },
      { hex: "#8B6F4E", keyword: "Caramel" },
    ],
    subjectName: "Sabrina",
    subjectProfession: "Therapist",
    cropPosition: { x: 66.25, y: 0, zoom: 1.2 },
  },
  {
    imageUrl: "/images/portfolio-2.webp",
    environments: ["office"],
    brandMessages: ["confidence"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#E84B2A", keyword: "Coral Red" },
      { hex: "#4A7C59", keyword: "Leaf Green" },
      { hex: "#2D2D2D", keyword: "Charcoal" },
    ],
    subjectName: "Myriam",
    subjectProfession: "Therapist",
  },
  {
    imageUrl: "/images/portfolio/IMG_2875.webp",
    environments: ["nature"],
    brandMessages: ["empathy"],
    emotionalImpacts: ["powerful"],
    colorPalette: [
      { hex: "#3D2B1F", keyword: "Espresso" },
      { hex: "#C4956A", keyword: "Amber Glow" },
      { hex: "#4A5A4A", keyword: "Moss Shadow" },
    ],
    subjectName: "Marialexia",
    subjectProfession: "Dancer",
  },
  {
    imageUrl: "/images/portfolio/IMG_6186.webp",
    environments: ["nature"],
    brandMessages: ["assured"],
    emotionalImpacts: ["powerful"],
    colorPalette: [
      { hex: "#5C4A3A", keyword: "Dark Walnut" },
      { hex: "#D4A574", keyword: "Golden Honey" },
      { hex: "#2E3B2E", keyword: "Forest Shadow" },
    ],
    subjectName: "Hailey",
    subjectProfession: "Customer Rep",
  },
  {
    imageUrl: "/images/portfolio-urban-assured-bright.webp",
    environments: ["urban"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#8C8C8C", keyword: "Warm Grey" },
      { hex: "#2B1D15", keyword: "Deep Espresso" },
      { hex: "#C4956A", keyword: "Warm Caramel" },
    ],
    subjectName: "Megg",
    subjectProfession: "Instructor",
  },
  {
    imageUrl: "/images/portfolio-office-assured-bright-2.webp",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#C49A6C", keyword: "Warm Tan" },
      { hex: "#3B2A1A", keyword: "Dark Mocha" },
      { hex: "#D9CBBA", keyword: "Soft Beige" },
    ],
    subjectName: "Cecilia",
    subjectProfession: "Counselor",
  },
  {
    imageUrl: "/images/portfolio-office-assured-bright-3.webp",
    environments: ["office"],
    brandMessages: ["assured"],
    emotionalImpacts: ["bright"],
    colorPalette: [
      { hex: "#3A2D4F", keyword: "Deep Plum" },
      { hex: "#2B2018", keyword: "Dark Cocoa" },
      { hex: "#A8B0A0", keyword: "Sage Grey" },
    ],
    subjectName: "Edith",
    subjectProfession: "Therapist",
    subjectBio: "A therapist whose clients need to feel at ease the moment they walk in.",
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
    } else {
      // Backfill subject names on existing photos that are missing them
      let updated = 0;
      for (const data of portfolioData) {
        if (!data.subjectName) continue;
        const result = await db
          .update(portfolioPhotos)
          .set({
            subjectName: data.subjectName,
            subjectProfession: data.subjectProfession || null,
            subjectBio: (data as any).subjectBio || null,
            ...(data.cropPosition ? { cropPosition: data.cropPosition } : {}),
          })
          .where(sql`${portfolioPhotos.imageUrl} = ${data.imageUrl} AND ${portfolioPhotos.subjectName} IS NULL`);
        if (result.rowCount && result.rowCount > 0) updated++;
      }
      if (updated > 0) console.log(`Backfilled subject data on ${updated} portfolio photos`);
    }
  } catch (error) {
    console.error("Failed to seed portfolio photos (non-fatal):", error);
  }
}
