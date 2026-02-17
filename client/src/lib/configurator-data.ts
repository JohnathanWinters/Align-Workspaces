export type Environment = "restaurant" | "office" | "nature" | "workvan" | "urban" | "suburban";
export type BrandMessage = "assured" | "empathy" | "confidence" | "motivation";
export type EmotionalImpact = "cozy" | "bright" | "powerful" | "cinematic";
export type ShootIntent = "website" | "social-media" | "marketing" | "personal-brand" | "team";

export interface ConfiguratorState {
  environment: Environment | null;
  brandMessage: BrandMessage | null;
  emotionalImpact: EmotionalImpact | null;
  shootIntent: ShootIntent | null;
}

export const environments: { value: Environment; label: string; icon: string }[] = [
  { value: "restaurant", label: "Restaurant", icon: "UtensilsCrossed" },
  { value: "office", label: "Office", icon: "Building2" },
  { value: "nature", label: "Nature", icon: "TreePine" },
  { value: "workvan", label: "Work Van", icon: "Truck" },
  { value: "urban", label: "Urban", icon: "Building" },
  { value: "suburban", label: "Suburban", icon: "Home" },
];

export const brandMessages: { value: BrandMessage; label: string; description: string }[] = [
  { value: "assured", label: "Assured", description: "Calm authority, grounded posture, steady gaze. Neutral lighting with balanced composition." },
  { value: "empathy", label: "Empathy", description: "Softer lighting, open posture, gentle expression. Warm tones that invite connection." },
  { value: "confidence", label: "Confidence", description: "Strong posture, direct eye contact, bold framing. Clean lighting with purposeful angles." },
  { value: "motivation", label: "Motivation", description: "Dynamic energy, forward-leaning pose, bright expression. Vibrant lighting with movement." },
];

export const emotionalImpacts: { value: EmotionalImpact; label: string; description: string }[] = [
  { value: "cozy", label: "Cozy", description: "Warm tones, golden hour lighting, intimate framing" },
  { value: "bright", label: "Bright", description: "Airy, clean, natural light, fresh and open feeling" },
  { value: "powerful", label: "Powerful", description: "Bold contrast, dramatic shadows, commanding presence" },
  { value: "cinematic", label: "Cinematic", description: "Dramatic storytelling, film-like color grading, depth" },
];

export const shootIntents: { value: ShootIntent; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "social-media", label: "Social Media" },
  { value: "marketing", label: "Marketing Campaign" },
  { value: "personal-brand", label: "Personal Brand" },
  { value: "team", label: "Team or Company" },
];

export const environmentImages: Record<Environment, string> = {
  restaurant: "/images/env-restaurant.jpg",
  office: "/images/env-office.jpg",
  nature: "/images/env-nature.jpg",
  workvan: "/images/env-workvan.jpg",
  urban: "/images/env-urban.jpg",
  suburban: "/images/env-suburban.jpg",
};

export function generateBrandDescription(state: ConfiguratorState): string {
  if (!state.environment || !state.brandMessage || !state.emotionalImpact) return "";

  const envLabels: Record<Environment, string> = {
    restaurant: "culinary",
    office: "corporate",
    nature: "natural",
    workvan: "field-based",
    urban: "urban",
    suburban: "community-centered",
  };

  const messageLabels: Record<BrandMessage, string> = {
    assured: "composed and authoritative",
    empathy: "warm and approachable",
    confidence: "confident and decisive",
    motivation: "energetic and inspiring",
  };

  const impactLabels: Record<EmotionalImpact, string> = {
    cozy: "warm and inviting",
    bright: "fresh and professional",
    powerful: "bold and commanding",
    cinematic: "cinematic and memorable",
  };

  return `A ${impactLabels[state.emotionalImpact]} ${envLabels[state.environment]} branding shoot designed to position you as a ${messageLabels[state.brandMessage]} professional.`;
}

export function calculatePricing(state: ConfiguratorState): { min: number; max: number } {
  let min = 150;
  let max = 250;

  if (state.environment === "nature" || state.environment === "urban") {
    min += 25;
    max += 50;
  }

  if (state.emotionalImpact === "cinematic" || state.emotionalImpact === "powerful") {
    min += 50;
    max += 75;
  }

  if (state.shootIntent === "marketing" || state.shootIntent === "team") {
    min += 75;
    max += 100;
  }

  return { min, max };
}
