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
    name: "Daniel Reyes",
    profession: "Family Therapist",
    location: "Kendall, FL",
    category: "Therapists",
    slug: "daniel-reyes-therapist",
    headline: "Strengthening families one session at a time",
    quote: "The strongest families aren't the ones without problems — they're the ones who face them together.",
    storySections: {
      whyStarted: "Daniel grew up watching his own parents struggle to communicate, and it shaped his entire career path. After earning his master's in family therapy from the University of Miami, he opened a practice in Kendall focused on helping families navigate conflict, divorce transitions, and generational trauma. His bilingual approach serves the diverse community he grew up in.",
      whatTheyLove: "The moment a family that came in barely speaking to each other starts laughing together in session. 'That shift — when defensiveness turns into curiosity — that's when the real work begins,' Daniel says. He uses a blend of structural and narrative therapy techniques tailored to each family's culture.",
      misunderstanding: "That family therapy means someone is 'broken.' Daniel is quick to reframe: 'Seeking help is a sign of strength, not weakness. Every family hits rough patches. The brave ones show up and do the work.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Daniel Reyes Became a Family Therapist | Align",
    metaDescription: "Meet Daniel Reyes, a family therapist in Kendall strengthening families one session at a time. Read his story on Align.",
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
    name: "Isabella Santos",
    profession: "Pastry Chef",
    location: "South Beach, FL",
    category: "Chefs",
    slug: "isabella-santos-chef",
    headline: "Creating edible art that brings people together",
    quote: "A great dessert doesn't just end a meal — it creates a memory.",
    storySections: {
      whyStarted: "Isabella's love for baking started in her abuela's kitchen in Hialeah, where she learned to make flan before she could ride a bike. After training at Le Cordon Bleu and working in pastry kitchens across Paris and Buenos Aires, she returned to Miami and opened a boutique bakery on South Beach. Her fusion of Latin flavors with French technique has earned her a devoted following.",
      whatTheyLove: "The artistry. 'Pastry is where science meets creativity. Every temperature, every texture, every flavor pairing matters.' Isabella especially loves custom orders — wedding cakes that tell a couple's story, birthday desserts that capture a personality. 'When someone cries happy tears over a cake, that's my favorite moment.'",
      misunderstanding: "That pastry is less serious than savory cooking. 'Pastry requires precision that most line cooks would find maddening. One degree off, one gram too much — the whole thing falls apart. It's chemistry, physics, and art all at once.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", twitter: "https://twitter.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Isabella Santos Became a Pastry Chef | Align",
    metaDescription: "Meet Isabella Santos, a pastry chef in South Beach creating edible art that brings people together. Read her story on Align.",
  },
  {
    name: "Marcus Johnson",
    profession: "Personal Trainer",
    location: "South Beach, FL",
    category: "Personal Trainers",
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
  {
    name: "Adriana Vega",
    profession: "Fitness Coach",
    location: "Brickell, FL",
    category: "Personal Trainers",
    slug: "adriana-vega-trainer",
    headline: "Empowering women to feel strong in their own skin",
    quote: "Strength isn't about how much you can lift — it's about how you carry yourself through life.",
    storySections: {
      whyStarted: "After years in corporate finance in Brickell, Adriana hit burnout hard. She turned to fitness as a lifeline and discovered a passion for helping other women going through the same thing. She left her desk job, got certified in strength training and nutrition coaching, and built a practice focused on busy professional women who need sustainable wellness — not crash diets and punishment workouts.",
      whatTheyLove: "The confidence shift. 'I've had clients come to me apologizing for their bodies, and within months they're standing taller, speaking louder, taking up space. The physical changes are great, but watching someone reclaim their confidence? That's everything.' Adriana combines strength training with mindset coaching for lasting results.",
      misunderstanding: "That women who lift weights will get 'bulky.' 'I hear it every week. But once clients see how strong and lean they feel after a few months of consistent training, they never look back. Strength is feminine, period.'"
    },
    socialLinks: { linkedin: "https://linkedin.com/in/example", twitter: "https://twitter.com/example" },
    isFeaturedOfWeek: 0,
    isSample: 1,
    seoTitle: "Why Adriana Vega Became a Fitness Coach | Align",
    metaDescription: "Meet Adriana Vega, a fitness coach in Brickell empowering women to feel strong in their own skin. Read her story on Align.",
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
