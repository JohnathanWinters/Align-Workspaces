import { storage } from "./storage";

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
      narrativeHook: "I became a therapist because I know what it feels like to carry something heavy and not have anyone to share it with. When I finally found someone who listened — really listened — it changed everything. That's the experience I want to create for every person who walks through my door.",
      qaSections: [
        { question: "What drew you to this work?", answer: "I saw how transformative it was to have someone genuinely listen — not to fix, but to understand. That experience shaped my decision to dedicate my career to creating spaces where people feel safe enough to be honest about what they're carrying." },
        { question: "What's the most rewarding part?", answer: "The breakthroughs. When a client realizes they've been carrying something that was never theirs to hold — and they finally set it down — that moment changes everything. It never gets old." },
        { question: "What do people get wrong about therapy?", answer: "That it's only for people in crisis. Some of my best work happens with clients who are doing fine — they just want to do better. Therapy is for growth, not just survival." },
      ],
    },
    credentials: ["Licensed Therapist"],
    yearsInPractice: 8,
    ctaLabel: "Learn More",
    ctaUrl: null,
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
      narrativeHook: "Growing up in Miami, I watched people around me struggle silently because asking for help wasn't something you did. I wanted to change that. I became a therapist to create a space where vulnerability isn't weakness — it's where everything powerful begins.",
      qaSections: [
        { question: "What made you choose this path?", answer: "I believe everyone deserves someone in their corner. I saw how cultural expectations kept people from asking for help, and I wanted to be the person who made it okay to reach out." },
        { question: "What moment makes it all worth it?", answer: "There's a moment when someone stops apologizing for who they are and starts owning it. That shift is everything. I specialize in helping professionals find balance between the demands of their work and their inner life." },
        { question: "What's a common misconception?", answer: "That therapists have all the answers. I don't tell people what to do — I help them hear what they already know. The wisdom is always theirs. I just hold the mirror." },
      ],
    },
    credentials: ["Licensed Therapist"],
    yearsInPractice: 10,
    ctaLabel: "Learn More",
    ctaUrl: null,
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
      narrativeHook: "I found my calling after watching people I cared about go through some of life's hardest transitions — divorce, career changes, grief — without anyone to walk alongside them. I knew I wanted to be that person. The one who sits with you in the uncertainty and helps you find your way forward.",
      qaSections: [
        { question: "What led you to counseling?", answer: "I realized that having someone walk alongside you during life's biggest transitions can make the difference between feeling lost and finding your way forward. That's what I do — I walk alongside people." },
        { question: "What do you value most about your work?", answer: "The trust. When someone sits across from me and shares something they've never told anyone — that's sacred. I don't take it lightly. I create a warm, judgment-free environment where people feel safe to explore the full complexity of what they're going through." },
        { question: "What do people misunderstand about counseling?", answer: "That it's just talking. It's structured, intentional work. We're not just chatting — we're building new patterns, challenging old beliefs, and creating a roadmap for the life you actually want." },
      ],
    },
    credentials: ["Licensed Counselor"],
    yearsInPractice: 7,
    ctaLabel: "Learn More",
    ctaUrl: null,
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
      narrativeHook: "I've been creating since before I could name what I was doing. Drawing on napkins as a kid turned into murals, canvases, and eventually a full practice rooted in emotional storytelling. For me, art isn't decoration — it's communication.",
      qaSections: [
        { question: "What drives your creative process?", answer: "I love the moment when a piece starts talking back to me — when it stops being what I planned and becomes what it needs to be. I work across mediums, but my focus is always on capturing the emotional truth of a moment or a person." },
        { question: "What do people get wrong about being an artist?", answer: "That we don't work hard. People see the finished piece and think it came easy. They don't see the failed drafts, the 2 AM restarts, the doubt. Being an artist is a discipline — one that demands everything you have." },
      ],
    },
    credentials: ["Visual Artist"],
    yearsInPractice: 12,
    ctaLabel: "See Her Work",
    ctaUrl: null,
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
      narrativeHook: "Movement has always been my language. Before I had words for what I was feeling, I had dance — a way to process joy, grief, frustration, and everything in between. I turned that personal practice into a career because I believe everyone deserves to feel that kind of freedom in their body.",
      qaSections: [
        { question: "What does dance mean to you?", answer: "When you stop thinking and start moving, something honest comes through. That's where the real art lives. I bring an intensity and authenticity to my work that leaves audiences and students alike feeling something they can't quite name." },
        { question: "What's the biggest misconception about dance?", answer: "That it's just entertainment. Dance is storytelling, therapy, protest, celebration — it's one of the oldest forms of human expression. Reducing it to entertainment misses everything that makes it powerful." },
      ],
    },
    credentials: ["Professional Dancer", "Movement Teacher"],
    yearsInPractice: 15,
    ctaLabel: "Learn More",
    ctaUrl: null,
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
      narrativeHook: "My journey into therapy was deeply personal. I experienced the power of being truly seen by a skilled therapist during a difficult chapter in my own life, and I knew I wanted to offer that same gift to others. Every person deserves to feel safe, valued, and understood.",
      qaSections: [
        { question: "Why did you become a therapist?", answer: "Because I've been on the other side. I know what it feels like to sit in that chair and wonder if anyone really gets it. That experience gave me a perspective I carry into every session — I never forget what it takes to show up and ask for help." },
        { question: "What makes the therapeutic relationship special?", answer: "Therapy works because of the connection between two people. When a client trusts me enough to show me who they really are — not who they think they should be — that's when the real healing begins." },
        { question: "What do you wish more people knew?", answer: "That a therapist's job isn't to give advice. I'm here to help you figure out what you already know, to challenge the stories that aren't serving you, and to walk beside you while you build something better." },
      ],
    },
    credentials: ["LCSW", "MCAP", "CCTP"],
    yearsInPractice: 14,
    ctaLabel: "Learn More",
    ctaUrl: null,
    socialLinks: [],
    isFeaturedOfWeek: 0,
    isSample: 0,
    seoTitle: "Meet Edith — Therapist | Align",
    metaDescription: "Meet Edith, a therapist in Miami meeting people where they are with warmth and understanding. Read her story on Align.",
  },
];

export async function seedFeaturedProfessionals() {
  // Only seed if the table is completely empty — never overwrite admin edits
  const existing = await storage.getFeaturedProfessionals({ includeSamples: true });
  if (existing.length > 0) return { created: 0, total: professionals.length };

  let created = 0;
  for (const pro of professionals) {
    await storage.createFeaturedProfessional(pro);
    created++;
  }

  return { created, total: professionals.length };
}
