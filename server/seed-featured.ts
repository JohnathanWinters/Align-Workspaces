import { storage } from "./storage";
import { db } from "./db";
import { featuredProfessionals } from "@shared/schema";
import { eq } from "drizzle-orm";

const professionals = [
  {
    name: "Sabrina",
    profession: "Therapist",
    location: "Miami, FL",
    category: "Therapists",
    slug: "sabrina-therapist",
    portraitImageUrl: "/images/portfolio-1.webp",
    headline: "Creating a safe space for healing and growth",
    quote: "The most powerful thing you can do is let someone feel truly heard.",
    storySections: {
      whyStarted: "Sabrina's path to therapy began with her own experience navigating life's challenges. She saw how transformative it was to have someone genuinely listen — not to fix, but to understand. That experience shaped her decision to become a therapist, dedicating her career to creating spaces where people feel safe enough to be honest about what they're carrying.",
      whatTheyLove: "The breakthroughs. 'When a client realizes they've been carrying something that was never theirs to hold — and they finally set it down — that moment changes everything.' Sabrina brings warmth and directness to her sessions, blending evidence-based approaches with deep empathy.",
      misunderstanding: "That therapy is only for people in crisis. 'Some of my best work happens with clients who are doing fine — they just want to do better. Therapy is for growth, not just survival.'"
    },
    socialLinks: [],
    isFeaturedOfWeek: 1,
    isSample: 0,
    seoTitle: "Meet Sabrina — Therapist | Align",
    metaDescription: "Meet Sabrina, a therapist in Miami creating safe spaces for healing and growth. Read her story on Align.",
  },
  {
    name: "Myriam",
    profession: "Therapist",
    location: "Miami, FL",
    category: "Therapists",
    slug: "myriam-therapist",
    portraitImageUrl: "/images/portfolio-2.webp",
    headline: "Helping people reconnect with their strength",
    quote: "You already have everything you need inside you — sometimes you just need someone to help you see it.",
    storySections: {
      whyStarted: "Myriam became a therapist because she believes everyone deserves someone in their corner. Growing up in Miami, she saw how cultural expectations often kept people from asking for help. She wanted to change that — to create a space where vulnerability isn't weakness, but the beginning of something powerful.",
      whatTheyLove: "Watching clients rediscover their confidence. 'There's a moment when someone stops apologizing for who they are and starts owning it. That shift is everything.' Myriam specializes in helping professionals find balance between the demands of their work and the needs of their inner life.",
      misunderstanding: "That therapists have all the answers. 'I don't tell people what to do. I help them hear what they already know. The wisdom is always theirs — I just hold the mirror.'"
    },
    socialLinks: [],
    isFeaturedOfWeek: 0,
    isSample: 0,
    seoTitle: "Meet Myriam — Therapist | Align",
    metaDescription: "Meet Myriam, a therapist in Miami helping people reconnect with their strength. Read her story on Align.",
  },
  {
    name: "Cecilia",
    profession: "Counselor",
    location: "Miami, FL",
    category: "Therapists",
    slug: "cecilia-counselor",
    portraitImageUrl: "/images/portfolio-office-assured-bright-2.webp",
    headline: "Guiding people through life's transitions with compassion",
    quote: "Every ending is also a beginning — and you don't have to navigate it alone.",
    storySections: {
      whyStarted: "Cecilia found her calling in counseling after watching people around her struggle silently through major life transitions — divorce, career changes, grief. She realized that having someone walk alongside you during those moments can make the difference between feeling lost and finding your way forward.",
      whatTheyLove: "The trust. 'When someone sits across from me and shares something they've never told anyone — that's sacred. I don't take that lightly.' Cecilia creates a warm, judgment-free environment where clients feel safe to explore the full complexity of what they're going through.",
      misunderstanding: "That counseling is just talking. 'It's structured, intentional work. We're not just chatting — we're building new patterns, challenging old beliefs, and creating a roadmap for the life you actually want.'"
    },
    socialLinks: [],
    isFeaturedOfWeek: 0,
    isSample: 0,
    seoTitle: "Meet Cecilia — Counselor | Align",
    metaDescription: "Meet Cecilia, a counselor in Miami guiding people through life's transitions with compassion. Read her story on Align.",
  },
  {
    name: "Evelyn",
    profession: "Artist",
    location: "Miami, FL",
    category: "Creatives",
    slug: "evelyn-artist",
    portraitImageUrl: "/images/portfolio-office-assured-cozy.webp",
    headline: "Turning emotion into visual stories",
    quote: "Art isn't about what you see — it's about what you feel when you see it.",
    storySections: {
      whyStarted: "Evelyn has been creating since before she could name what she was doing. Drawing on napkins as a kid turned into murals, canvases, and eventually a full practice rooted in emotional storytelling. For her, art isn't decoration — it's communication. Every piece she creates is designed to make people stop and feel something real.",
      whatTheyLove: "The process. 'I love the moment when a piece starts talking back to me — when it stops being what I planned and becomes what it needs to be.' Evelyn works across mediums, but her focus is always on capturing the emotional truth of a moment or a person.",
      misunderstanding: "That artists don't work hard. 'People see the finished piece and think it came easy. They don't see the failed drafts, the 2 AM restarts, the doubt. Being an artist is a discipline — one that demands everything you have.'"
    },
    socialLinks: [],
    isFeaturedOfWeek: 0,
    isSample: 0,
    seoTitle: "Meet Evelyn — Artist | Align",
    metaDescription: "Meet Evelyn, an artist in Miami turning emotion into visual stories. Read her story on Align.",
  },
  {
    name: "Marialexia",
    profession: "Dancer",
    location: "Miami, FL",
    category: "Creatives",
    slug: "marialexia-dancer",
    portraitImageUrl: "/images/portfolio/IMG_2875.webp",
    headline: "Moving through life with intention and grace",
    quote: "Dance taught me that your body tells the truth even when your words won't.",
    storySections: {
      whyStarted: "Marialexia discovered dance as a way to express what words couldn't capture. Movement became her language — a way to process joy, grief, frustration, and everything in between. She turned that personal practice into a career, sharing dance as both performance and healing with communities across Miami.",
      whatTheyLove: "The connection between body and emotion. 'When you stop thinking and start moving, something honest comes through. That's where the real art lives.' Marialexia brings an intensity and authenticity to her work that leaves audiences and students alike feeling something they can't quite name.",
      misunderstanding: "That dance is just entertainment. 'Dance is storytelling, therapy, protest, celebration — it's one of the oldest forms of human expression. Reducing it to entertainment misses everything that makes it powerful.'"
    },
    socialLinks: [],
    isFeaturedOfWeek: 0,
    isSample: 0,
    seoTitle: "Meet Marialexia — Dancer | Align",
    metaDescription: "Meet Marialexia, a dancer in Miami moving through life with intention and grace. Read her story on Align.",
  },
  {
    name: "Edith",
    profession: "Therapist",
    location: "Miami, FL",
    category: "Therapists",
    slug: "edith-therapist",
    portraitImageUrl: "/images/portfolio-office-assured-bright-3.webp",
    headline: "Meeting people where they are with warmth and understanding",
    quote: "Healing isn't linear — and that's okay. What matters is that you keep showing up.",
    storySections: {
      whyStarted: "Edith's journey into therapy was deeply personal. Having experienced the power of being truly seen by a skilled therapist during a difficult chapter in her own life, she knew she wanted to offer that same gift to others. Her practice is built on the belief that every person deserves to feel safe, valued, and understood.",
      whatTheyLove: "The relationship. 'Therapy works because of the connection between two people. When a client trusts me enough to show me who they really are — not who they think they should be — that's when the real healing begins.' Edith brings years of clinical experience and genuine warmth to every session.",
      misunderstanding: "That a therapist's job is to give advice. 'I'm not here to tell you what to do. I'm here to help you figure out what you already know, to challenge the stories that aren't serving you, and to walk beside you while you build something better.'"
    },
    socialLinks: [],
    isFeaturedOfWeek: 0,
    isSample: 0,
    seoTitle: "Meet Edith — Therapist | Align",
    metaDescription: "Meet Edith, a therapist in Miami meeting people where they are with warmth and understanding. Read her story on Align.",
  },
];

export async function seedFeaturedProfessionals() {
  // Remove old placeholder professionals that no longer belong
  const oldSlugs = [
    "maria-gonzalez-therapist", "daniel-reyes-therapist", "carlos-medina-chef",
    "isabella-santos-chef", "marcus-johnson-trainer", "adriana-vega-trainer",
  ];
  for (const slug of oldSlugs) {
    const old = await storage.getFeaturedProfessionalBySlug(slug);
    if (old) {
      await storage.deleteFeaturedProfessional(old.id);
    }
  }

  const existing = await storage.getFeaturedProfessionals({ includeSamples: true });
  const existingSlugs = new Set(existing.map((p) => p.slug));
  let created = 0;

  for (const pro of professionals) {
    if (existingSlugs.has(pro.slug)) continue;
    await storage.createFeaturedProfessional(pro);
    created++;
  }

  return { created, total: professionals.length };
}
