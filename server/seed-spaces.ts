import { db } from "./db";
import { spaces } from "@shared/schema";
import { sql } from "drizzle-orm";

const sampleSpaces = [
  {
    name: "Serenity Therapy Suite",
    slug: "serenity-therapy-suite",
    type: "office",
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
    imageUrls: ["/images/space-therapy-1.png", "/images/space-therapy-1b.png"],
    colorPalette: JSON.stringify([
      { hex: "#D4C5B0", name: "Warm Sand", feel: "Evokes grounding and safety — a neutral warmth that helps clients feel settled and present in the moment" },
      { hex: "#8B9E8B", name: "Sage Moss", feel: "Brings a sense of natural calm and renewal, connecting the space to organic healing and quiet growth" },
      { hex: "#F5EDE3", name: "Soft Linen", feel: "Creates an atmosphere of openness and gentleness, like a blank page ready for honest conversation" }
    ]),
    targetProfession: "Therapists & Counselors",
    availableHours: "Mon-Sat 8:00 AM - 8:00 PM",
    hostName: "Dr. Maria Santos",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
  {
    name: "Mindful Space Therapy Room",
    slug: "mindful-space-therapy-room",
    type: "office",
    description: "A modern, minimalist therapy room in Brickell perfect for licensed therapists and counselors. The space features natural light, plants, and a neutral palette designed to put clients at ease. Includes a small waiting area and private entrance.",
    shortDescription: "Modern minimalist therapy room in Brickell with natural light",
    address: "1200 Brickell Ave, Suite 310, Miami, FL 33131",
    neighborhood: "Brickell",
    latitude: "25.7585",
    longitude: "-80.1918",
    pricePerHour: 45,
    pricePerDay: 250,
    capacity: 3,
    amenities: ["Natural light", "Private entrance", "Waiting room", "Wi-Fi", "Sound machine", "Climate control", "Elevator access", "Valet parking available"],
    imageUrls: ["/images/space-therapy-2.png", "/images/space-therapy-2b.png"],
    colorPalette: JSON.stringify([
      { hex: "#C4A882", name: "Honey Oak", feel: "Radiates professional warmth without intensity — trustworthy and approachable, like a steady hand" },
      { hex: "#E8DDD0", name: "Cream Stone", feel: "Softens the room's edges, creating a cocoon-like feeling where vulnerability feels safe" },
      { hex: "#6B7B6B", name: "Forest Calm", feel: "Anchors the space with quiet stability, suggesting depth and resilience without heaviness" }
    ]),
    targetProfession: "Therapists & Counselors",
    availableHours: "Mon-Fri 7:00 AM - 9:00 PM, Sat 9:00 AM - 5:00 PM",
    hostName: "Wellness Center Brickell",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
  {
    name: "Iron District Training Studio",
    slug: "iron-district-training-studio",
    type: "gym",
    description: "A fully equipped private training studio in Wynwood for personal trainers and fitness coaches. Includes free weights, resistance bands, TRX system, battle ropes, and a turf area. Perfect for 1-on-1 or small group sessions up to 6 people. Industrial aesthetic with natural light.",
    shortDescription: "Private training studio in Wynwood with full equipment",
    address: "2520 NW 2nd Ave, Miami, FL 33127",
    neighborhood: "Wynwood",
    latitude: "25.7985",
    longitude: "-80.1996",
    pricePerHour: 40,
    pricePerDay: 220,
    capacity: 6,
    amenities: ["Free weights", "TRX system", "Battle ropes", "Turf area", "Mirrors", "Bluetooth speaker", "Shower", "Wi-Fi", "Parking lot", "Water station"],
    imageUrls: ["/images/space-gym.png", "/images/space-gym-b.png"],
    colorPalette: JSON.stringify([
      { hex: "#2C2C2C", name: "Iron Black", feel: "Commands focus and intensity — a bold foundation that signals discipline, strength, and serious training" },
      { hex: "#C4956A", name: "Burnished Gold", feel: "Injects aspirational energy and achievement, motivating movement toward personal records and goals" },
      { hex: "#E8E0D8", name: "Raw Concrete", feel: "Brings industrial honesty and grit, reminding you that real transformation happens through work" }
    ]),
    targetProfession: "Personal Trainers & Fitness Coaches",
    availableHours: "Mon-Sun 6:00 AM - 10:00 PM",
    hostName: "Carlos Mendez",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
  {
    name: "Elevate Meeting Room",
    slug: "elevate-meeting-room",
    type: "meeting",
    description: "A professional meeting room in Downtown Miami ideal for client consultations, team meetings, and presentations. Features a large conference table seating 8, whiteboard, projector, and floor-to-ceiling windows with skyline views. Perfect for lawyers, realtors, and consultants.",
    shortDescription: "Professional meeting room in Downtown Miami with skyline views",
    address: "100 SE 2nd St, Suite 2400, Miami, FL 33131",
    neighborhood: "Downtown Miami",
    latitude: "25.7738",
    longitude: "-80.1899",
    pricePerHour: 55,
    pricePerDay: 300,
    capacity: 8,
    amenities: ["Conference table", "Projector", "Whiteboard", "Wi-Fi", "Coffee station", "Floor-to-ceiling windows", "Skyline views", "Elevator access", "Reception desk"],
    imageUrls: ["/images/space-meeting-1.png", "/images/space-meeting-1b.png"],
    colorPalette: JSON.stringify([
      { hex: "#F7F3EE", name: "Ivory White", feel: "Opens the mind and clears mental clutter — creates space for clean thinking and creative problem-solving" },
      { hex: "#4A6741", name: "Tropical Green", feel: "Connects the boardroom to the Grove's lush canopy outside, bringing organic vitality to business decisions" },
      { hex: "#8B7355", name: "Walnut Wood", feel: "Grounds conversations with traditional craftsmanship and permanence, lending weight to agreements made here" }
    ]),
    targetProfession: "Lawyers, Realtors & Consultants",
    availableHours: "Mon-Fri 7:00 AM - 8:00 PM",
    hostName: "Miami Business Hub",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
  {
    name: "The Coconut Grove Boardroom",
    slug: "coconut-grove-boardroom",
    type: "meeting",
    description: "An intimate, design-forward meeting space in Coconut Grove. Seats up to 6 people around a handcrafted wood table. Features a calming garden courtyard view, espresso machine, and dedicated Wi-Fi. Ideal for small team meetings, strategy sessions, and professional consultations.",
    shortDescription: "Intimate design-forward boardroom in Coconut Grove",
    address: "3390 Mary St, Suite 200, Coconut Grove, FL 33133",
    neighborhood: "Coconut Grove",
    latitude: "25.7270",
    longitude: "-80.2417",
    pricePerHour: 40,
    pricePerDay: 220,
    capacity: 6,
    amenities: ["Garden view", "Espresso machine", "Dedicated Wi-Fi", "Whiteboard", "Monitor for presentations", "Natural light", "Street parking", "Bike rack"],
    imageUrls: ["/images/space-meeting-2.png", "/images/space-meeting-2b.png"],
    colorPalette: JSON.stringify([
      { hex: "#1A1A2E", name: "Midnight Navy", feel: "Projects executive authority and strategic depth — a power color that elevates the importance of every meeting" },
      { hex: "#C0C0C0", name: "Steel Silver", feel: "Adds modern sophistication and technological edge, reflecting the city skyline visible through the windows" },
      { hex: "#FFFFFF", name: "Pure White", feel: "Represents clarity of purpose and transparency, cutting through complexity to reveal sharp, decisive thinking" }
    ]),
    targetProfession: "Entrepreneurs & Small Business Owners",
    availableHours: "Mon-Sat 8:00 AM - 7:00 PM",
    hostName: "Grove Collective",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
  {
    name: "Canvas & Clay Art Studio",
    slug: "canvas-clay-art-studio",
    type: "art_studio",
    description: "A bright, open-concept art studio in Wynwood with 14-foot ceilings, north-facing skylights, and industrial charm. Features easels, a pottery wheel, kiln access, a wash station, and ample natural light. Perfect for painters, sculptors, ceramicists, and art instructors hosting workshops or working on commissions. The space includes a curated supply wall and a small gallery nook for displaying finished pieces.",
    shortDescription: "Open-concept art studio in Wynwood with skylights and kiln access",
    address: "318 NW 25th St, Miami, FL 33127",
    neighborhood: "Wynwood",
    latitude: "25.8010",
    longitude: "-80.1985",
    pricePerHour: 30,
    pricePerDay: 180,
    capacity: 8,
    amenities: ["North-facing skylights", "Easels", "Pottery wheel", "Kiln access", "Wash station", "Wi-Fi", "Bluetooth speaker", "Supply wall", "Gallery nook", "Climate control", "Street parking"],
    imageUrls: ["/images/space-art-studio.png", "/images/space-art-studio-b.png"],
    colorPalette: JSON.stringify([
      { hex: "#E8C8A0", name: "Raw Clay", feel: "Speaks to the hands-on creative process — earthy, tactile, and full of potential waiting to be shaped" },
      { hex: "#F5F0E8", name: "Gallery White", feel: "Provides the blank canvas every artist needs, allowing color and form to take center stage without competition" },
      { hex: "#7B4B3A", name: "Kiln Brick", feel: "Carries the warmth of transformation through fire — the alchemical magic of turning raw materials into art" }
    ]),
    targetProfession: "Visual Artists & Art Instructors",
    availableHours: "Mon-Sun 7:00 AM - 10:00 PM",
    hostName: "Wynwood Arts Collective",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
  {
    name: "Lumina Photo & Video Studio",
    slug: "lumina-photo-video-studio",
    type: "photo_studio",
    description: "A fully equipped photography and videography studio in the Design District featuring a 1,200 sq ft shooting space with 12-foot seamless white cyc wall, professional lighting rigs, and blackout capability. Includes a client lounge, makeup station, and wardrobe area. Ideal for portrait photographers, content creators, brand shoots, and indie filmmakers. Comes with Profoto strobes, V-flats, and a variety of backdrops.",
    shortDescription: "Professional photo & video studio in Design District with cyc wall",
    address: "4141 NE 2nd Ave, Suite 108, Miami, FL 33137",
    neighborhood: "Design District",
    latitude: "25.8135",
    longitude: "-80.1920",
    pricePerHour: 75,
    pricePerDay: 450,
    capacity: 10,
    amenities: ["White cyc wall", "Profoto strobes", "V-flats", "Backdrops", "Makeup station", "Wardrobe area", "Client lounge", "Wi-Fi", "Bluetooth speaker", "Blackout capability", "Elevator access", "Dedicated parking"],
    imageUrls: ["/images/space-photo-studio.png", "/images/space-photo-studio-b.png"],
    colorPalette: JSON.stringify([
      { hex: "#F8F8F8", name: "Studio White", feel: "The photographer's essential tool — pure, diffused light that reveals true colors and shapes without distortion" },
      { hex: "#1C1C1C", name: "Shadow Black", feel: "Creates dramatic contrast and depth, the counterpoint that gives light its meaning and subjects their dimension" },
      { hex: "#B8A08A", name: "Warm Neutral", feel: "Bridges light and shadow with natural warmth, adding skin-tone harmony that flatters every subject in frame" }
    ]),
    targetProfession: "Photographers, Videographers & Content Creators",
    availableHours: "Mon-Sat 6:00 AM - 11:00 PM, Sun 8:00 AM - 8:00 PM",
    hostName: "Lumina Creative Studios",
    approvalStatus: "approved",
    isSample: 1,
    isActive: 1,
  },
];

export async function seedSpacesIfEmpty() {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(spaces);
    const count = Number(result[0]?.count ?? 0);

    if (count > 0) {
      console.log(`Spaces table already has ${count} rows, skipping seed`);
      return;
    }

    console.log("Seeding spaces table with sample data...");
    for (const s of sampleSpaces) {
      await db.insert(spaces).values(s);
    }
    console.log(`Seeded ${sampleSpaces.length} sample spaces`);
  } catch (err) {
    console.error("Failed to seed spaces:", err);
  }
}
