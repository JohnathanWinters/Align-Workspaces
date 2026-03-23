import { db } from "./db";
import { teamMembers } from "@shared/schema";

export async function seedTeamMembersIfEmpty() {
  const existing = await db.select().from(teamMembers);
  if (existing.length > 0) return;

  console.log("Seeding team members...");

  await db.insert(teamMembers).values([
    {
      id: "team-armando",
      name: "Armando Ramirez Romero",
      role: "Co-Founder, Align",
      location: "Miami, FL",
      bio: "Armando brings a rare blend of visual storytelling and real-world understanding to every session. With a background in media design, photography, and years spent in law enforcement, he developed a sharp eye for reading people — not just how they look, but how they carry themselves, what they project, and what they hold back.\n\nThat perspective is what makes his work different. Every shoot is built around the person in front of the camera — their profession, their energy, their goals. Armando doesn't follow templates. He listens, observes, and designs each session to make sure your portraits turn out exactly as you envision them — confident, approachable, and unmistakably you.",
      photoUrl: "/images/cofounder-armando.webp",
      cropPosition: { x: 50, y: 20, zoom: 1 },
      sortOrder: 0,
      isActive: 1,
    },
    {
      id: "team-edith",
      name: "Edith Caballero",
      role: "Co-Founder, Align",
      location: "Miami, FL",
      bio: "Edith is a Licensed Clinical Social Worker (LCSW), Master Certified Addictions Professional (MCAP), Certified Clinical Trauma Professional (CCTP), and Registered Yoga Teacher (RYT). She brings over a decade of experience working at the intersection of mental health, healing, and human connection.\n\nHer clinical work has always centered on creating spaces where people feel seen and supported — and that philosophy carries into everything Align builds. From the way spaces are designed to how professionals are welcomed, Edith's influence ensures that every experience feels intentional, grounded, and human.",
      photoUrl: "/images/cofounder-edith.webp",
      cropPosition: { x: 50, y: 20, zoom: 1 },
      sortOrder: 1,
      isActive: 1,
    },
  ]);

  console.log("Team members seeded");
}
