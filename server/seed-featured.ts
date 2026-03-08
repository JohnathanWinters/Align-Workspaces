import { storage } from "./storage";

const sampleProfessionals = [
  {
    name: "Maria Gonzalez",
    profession: "Licensed Therapist",
    location: "Coral Gables, FL",
    category: "Therapists",
    slug: "maria-gonzalez-therapist",
    headline: "Helping people heal through conversation",
    quote: "Helping someone feel understood is the most meaningful part of my work.",
    storySections: {
      whyStarted: "Growing up in a Cuban-American household in Miami, Maria saw how cultural stigma around mental health kept people from getting help. After losing a close friend who struggled silently, she committed herself to making therapy accessible and approachable — especially for the Latino community. She earned her degree from FIU and opened her practice in Coral Gables five years ago.",
      whatTheyLove: "Maria lights up when talking about breakthrough moments with her clients. 'When someone walks in carrying the weight of years of unspoken pain, and then one day they laugh — really laugh — that's everything,' she says. She specializes in family dynamics and culturally sensitive therapy, often conducting sessions in both English and Spanish.",
      misunderstanding: "People think therapy is only for people in crisis. Maria wants everyone to know that therapy is for growth, self-awareness, and resilience — not just emergencies. 'You don't wait until your car breaks down to get an oil change,' she says with a smile."
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", twitter: "https://twitter.com/example" },
    isFeaturedOfWeek: 1,
    isSample: 1,
    seoTitle: "Why Maria Gonzalez Became a Therapist | Align",
    metaDescription: "Meet Maria Gonzalez, a licensed therapist in Coral Gables helping people heal through conversation. Read her story on Align.",
  },
  {
    name: "Carlos Medina",
    profession: "Executive Chef",
    location: "Wynwood, FL",
    category: "Chefs",
    slug: "carlos-medina-chef",
    headline: "Telling Miami's story through food",
    quote: "Every dish I create is a love letter to the neighborhood I grew up in.",
    storySections: {
      whyStarted: "Carlos grew up watching his grandmother cook for the entire block in Little Havana. What started as weekend family traditions became his calling. After culinary school and stints in New York and Mexico City, he returned to Miami and opened a restaurant in Wynwood that blends Cuban, Haitian, and Southern flavors.",
      whatTheyLove: "The energy of a packed dining room on a Saturday night — that's what drives Carlos. 'Cooking is connection. When someone takes a bite and closes their eyes, I know I've done my job.' He sources ingredients from local farms and changes his menu with the seasons.",
      misunderstanding: "People think being a chef is glamorous. Carlos is quick to correct that notion. 'It's 14-hour days, burns, and exhaustion. But when you're passionate about feeding people, you wouldn't trade it for anything.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", facebook: "https://facebook.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Carlos Medina Became a Chef | Align",
    metaDescription: "Meet Carlos Medina, an executive chef in Wynwood telling Miami's story through food. Read his story on Align.",
  },
  {
    name: "Vanessa Torres",
    profession: "Real Estate Agent",
    location: "Brickell, FL",
    category: "Real Estate Agents",
    slug: "vanessa-torres-realtor",
    headline: "Helping families find where they belong",
    quote: "A home isn't just four walls — it's where your story begins.",
    storySections: {
      whyStarted: "Vanessa's family moved four times before she was twelve. That instability made her realize how important the right home is for a family's well-being. After college, she got her real estate license and quickly became known in Brickell for her patience, honesty, and deep knowledge of the Miami market.",
      whatTheyLove: "The moment when she hands over the keys. 'I've had clients cry, laugh, and hug me all at once. That never gets old.' Vanessa specializes in helping first-time buyers navigate the overwhelming process, breaking it down step by step.",
      misunderstanding: "People assume real estate agents are just salespeople. 'I'm a counselor, a negotiator, a project manager, and sometimes a therapist,' Vanessa laughs. 'My job is to protect my clients, not just close a deal.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", twitter: "https://twitter.com/example", facebook: "https://facebook.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Vanessa Torres Became a Realtor | Align",
    metaDescription: "Meet Vanessa Torres, a real estate agent in Brickell helping families find where they belong. Read her story on Align.",
  },
  {
    name: "Derek Williams",
    profession: "Master Barber",
    location: "Little Haiti, FL",
    category: "Barbers",
    slug: "derek-williams-barber",
    headline: "More than a haircut — it's confidence",
    quote: "When you look good, you carry yourself differently. That's what I give people.",
    storySections: {
      whyStarted: "Derek started cutting hair in his mom's kitchen at 15, charging neighbors five dollars a cut. What began as pocket money became a craft he obsessed over. He trained under master barbers in Atlanta before returning to Miami and opening his own shop in Little Haiti, where he employs three young apprentices from the community.",
      whatTheyLove: "The conversations. 'My chair is a safe space. People tell me things they don't tell anyone else.' Derek sees his shop as more than a business — it's a community hub where men can be vulnerable and leave feeling like their best selves.",
      misunderstanding: "That barbering is simple. 'People see scissors and clippers and think it's easy. But understanding face shapes, hair textures, personal style — that takes years to master. It's an art form.'"
    },
    socialLinks: { facebook: "https://facebook.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Derek Williams Became a Barber | Align",
    metaDescription: "Meet Derek Williams, a master barber in Little Haiti providing confidence one haircut at a time. Read his story on Align.",
  },
  {
    name: "Sofia Reyes",
    profession: "Brand Designer",
    location: "Design District, FL",
    category: "Designers",
    slug: "sofia-reyes-designer",
    headline: "Turning visions into visual identities",
    quote: "Great design doesn't just look good — it makes people feel something.",
    storySections: {
      whyStarted: "Sofia always saw the world differently. As a child, she'd redesign cereal boxes and re-draw restaurant logos in her sketchbook. After studying graphic design at SCAD, she moved to Miami's Design District and launched a boutique branding studio that works with small businesses, restaurants, and startups across South Florida.",
      whatTheyLove: "The transformation. 'I love when a client comes to me with a napkin sketch and a dream, and we turn it into a brand that stops people in their tracks.' Sofia's approach is deeply collaborative — she spends days learning about each client's story before touching a single pixel.",
      misunderstanding: "That design is just making things pretty. 'Design is strategy. It's psychology. It's understanding who your customer is and what will make them trust you. The aesthetics are the final layer.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", twitter: "https://twitter.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Sofia Reyes Became a Designer | Align",
    metaDescription: "Meet Sofia Reyes, a brand designer in the Design District turning visions into visual identities. Read her story on Align.",
  },
  {
    name: "Marcus Johnson",
    profession: "Personal Trainer",
    location: "South Beach, FL",
    category: "Trainers",
    slug: "marcus-johnson-trainer",
    headline: "Building strength that goes beyond the gym",
    quote: "Fitness isn't about being perfect — it's about showing up for yourself every day.",
    storySections: {
      whyStarted: "Marcus was an overweight teenager who discovered fitness at 16 after a health scare. The discipline of training transformed not just his body but his mindset, confidence, and relationships. He became certified and started training clients on South Beach, eventually building a practice that focuses on sustainable health rather than quick fixes.",
      whatTheyLove: "Watching clients surprise themselves. 'When someone who said they could never do a pull-up does five in a row — the look on their face is priceless.' Marcus specializes in working with professionals over 35 who want to reclaim their health without burning out.",
      misunderstanding: "That personal trainers just count reps. 'I'm a coach, a motivator, and sometimes the only person in my client's life who holds them accountable. The workout is just the vehicle — the real work is mental.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", facebook: "https://facebook.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Marcus Johnson Became a Personal Trainer | Align",
    metaDescription: "Meet Marcus Johnson, a personal trainer in South Beach building strength that goes beyond the gym. Read his story on Align.",
  },
];

export async function seedFeaturedProfessionals() {
  let created = 0;
  for (const pro of sampleProfessionals) {
    const existing = await storage.getFeaturedProfessionalBySlug(pro.slug);
    if (!existing) {
      await storage.createFeaturedProfessional(pro as any);
      created++;
    }
  }
  return { created, total: sampleProfessionals.length };
}
