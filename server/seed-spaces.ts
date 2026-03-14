import { db } from "./db";
import { spaces } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultSpaces = [
  {
    id: "sample-space-maria-host",
    name: "Coral Gables Therapy Suite",
    slug: "coral-gables-therapy-suite",
    type: "therapy",
    description: "A warm, calming therapy office designed for counselors and therapists. Features soft lighting, comfortable seating, and complete sound insulation for private sessions. Located in the heart of Coral Gables with easy parking.",
    shortDescription: "Private therapy office with calming atmosphere in Coral Gables",
    address: "245 Miracle Mile, Coral Gables, FL 33134",
    neighborhood: "Coral Gables",
    latitude: "25.7496",
    longitude: "-80.2584",
    pricePerHour: 35,
    pricePerDay: 200,
    capacity: 4,
    amenities: ["Sound insulated", "Comfortable seating", "Soft lighting", "Wi-Fi", "Waiting area", "Private restroom", "Climate control", "Street parking"],
    imageUrls: ["/objects/uploads/space-8d155dd6-8bfc-4515-a32a-01dd72bcfbfa.webp", "/objects/uploads/space-c401b806-3712-4b45-8617-e3d30701873f.webp", "/objects/uploads/space-38729c2c-2978-452b-ac57-e8fede8559b1.webp"],
    colorPalette: JSON.stringify({ colors: [{ hex: "#D4C5B0", name: "Warm Sand" }, { hex: "#8B9E8B", name: "Sage Moss" }, { hex: "#F5EDE3", name: "Soft Linen" }], feel: "This palette wraps the room in quiet comfort — sandy neutrals ground and reassure, sage green whispers of natural healing, and soft linen opens space for honest conversation.", explanation: "Together, they create an environment where clients can exhale and feel held without saying a word. Warm Sand anchors the room with stability, Sage Moss connects to nature and growth, and Soft Linen keeps the space open and breathable." }),
    targetProfession: "Therapists & Counselors",
    availableHours: "Mon-Sat 8:00 AM - 8:00 PM",
    hostName: "Dr. Maria Santos",
    approvalStatus: "approved" as const,
    isSample: 0,
    isActive: 1,
  },
  {
    id: "sample-space-armando-host",
    name: "Align Creative Studio",
    slug: "align-creative-studio",
    type: "creative",
    description: "A fully equipped photography and creative studio in the heart of Miami. Features professional lighting, a variety of backdrops, and a comfortable client lounge. Perfect for portrait sessions, brand shoots, and creative projects. The space includes Profoto lighting, seamless paper backdrops, and a makeup station.",
    shortDescription: "Professional photo & creative studio in Miami",
    address: "2520 NW 2nd Ave, Miami, FL 33127",
    neighborhood: "Wynwood",
    latitude: "25.7985",
    longitude: "-80.1996",
    pricePerHour: 65,
    pricePerDay: 400,
    capacity: 8,
    amenities: ["Professional lighting", "Backdrops", "Makeup station", "Client lounge", "Wi-Fi", "Bluetooth speaker", "Climate control", "Street parking", "Wardrobe area"],
    imageUrls: ["/objects/uploads/space-1a6691c3-64dc-4fcc-ad25-ecf6c5acf9a4.webp", "/objects/uploads/space-72ca8bac-1570-422f-a1c5-ce37b7db06ed.webp", "/objects/uploads/space-afb991da-021f-4e61-b36a-a7fcef4afcc3.webp"],
    colorPalette: JSON.stringify({ colors: [{ hex: "#F8F8F8", name: "Studio White" }, { hex: "#1C1C1C", name: "Shadow Black" }, { hex: "#B8A08A", name: "Warm Neutral" }], feel: "Pure studio white and deep shadow black create the dramatic range every photographer needs, while warm neutral bridges the two with natural skin-tone harmony.", explanation: "This is a palette designed for capturing truth — light, shadow, and everything in between. Studio White provides the blank canvas, Shadow Black adds depth and contrast, and Warm Neutral ensures skin tones and natural subjects look their best." }),
    targetProfession: "Photographers & Creatives",
    availableHours: "Mon-Sat 7:00 AM - 10:00 PM, Sun 9:00 AM - 6:00 PM",
    hostName: "Align Studios",
    approvalStatus: "approved" as const,
    isSample: 0,
    isActive: 1,
  },
];

const peacemakerPalette = JSON.stringify({
  colors: [
    { hex: "#E8DDD0", name: "Warm Cream" },
    { hex: "#A8B0A0", name: "Sage Green" },
    { hex: "#3E3A3A", name: "Espresso" },
  ],
  feel: "Calming earth tones — ideal for wellness, yoga, and healing practices",
  explanation: "Warm Cream creates a welcoming, gentle foundation that puts clients at ease. Sage Green introduces a natural, grounding element that promotes calm and restoration. Espresso anchors the space with depth and sophistication, giving the environment a sense of structure without feeling heavy. Together, these three colors create a nurturing atmosphere where clients feel safe, relaxed, and held — perfect for wellness work, therapy, and mindful practices.",
});

export async function seedSpacesIfEmpty() {
  for (const space of defaultSpaces) {
    const [existing] = await db.select().from(spaces).where(eq(spaces.id, space.id));
    if (!existing) {
      console.log(`Seeding space: ${space.name}`);
      await db.insert(spaces).values(space);
    } else {
      const updates: Record<string, any> = {};
      const existingImages = existing.imageUrls || [];
      if (existingImages.some((url: string) => url.startsWith("/images/"))) {
        updates.imageUrls = space.imageUrls;
      }
      if (!existing.colorPalette && space.colorPalette) {
        updates.colorPalette = space.colorPalette;
      }
      if (Object.keys(updates).length > 0) {
        console.log(`Updating space: ${space.name} (${Object.keys(updates).join(", ")})`);
        await db.update(spaces).set(updates).where(eq(spaces.id, space.id));
      }
    }
  }

  const allSpaces = await db.select().from(spaces);
  for (const space of allSpaces) {
    if (!space.colorPalette && space.name === "The Peacemaker Studio") {
      console.log(`Adding color palette to: ${space.name}`);
      await db.update(spaces).set({ colorPalette: peacemakerPalette }).where(eq(spaces.id, space.id));
    }
  }
}
