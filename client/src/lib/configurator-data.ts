import { calculatePricing as calcPricing } from "@shared/pricing";

export type Environment = "restaurant" | "office" | "nature" | "workvan" | "urban" | "suburban" | "kitchen" | "gym" | "other";
export type BrandMessage = "assured" | "empathy" | "confidence" | "motivation" | "other";
export type EmotionalImpact = "cozy" | "bright" | "powerful" | "other";
export type ShootIntent = "commercial" | "social-media" | "team" | "other";

export interface ConfiguratorState {
  environment: Environment | null;
  environmentCustom: string;
  brandMessage: BrandMessage | null;
  brandMessageCustom: string;
  emotionalImpact: EmotionalImpact | null;
  emotionalImpactCustom: string;
  shootIntent: ShootIntent | null;
  shootIntentCustom: string;
}

export const initialState: ConfiguratorState = {
  environment: "office",
  environmentCustom: "",
  brandMessage: null,
  brandMessageCustom: "",
  emotionalImpact: null,
  emotionalImpactCustom: "",
  shootIntent: "social-media",
  shootIntentCustom: "",
};

export const environments: { value: Environment; label: string; icon: string }[] = [
  { value: "gym", label: "Gym", icon: "Dumbbell" },
  { value: "kitchen", label: "Kitchen", icon: "ChefHat" },
  { value: "nature", label: "Nature", icon: "TreePine" },
  { value: "office", label: "Office", icon: "Building2" },
  { value: "restaurant", label: "Restaurant", icon: "UtensilsCrossed" },
  { value: "suburban", label: "Suburban", icon: "Home" },
  { value: "urban", label: "Urban", icon: "Building" },
  { value: "workvan", label: "Work Van", icon: "Truck" },
];

export const brandMessages: { value: BrandMessage; label: string; description: string }[] = [
  { value: "assured", label: "Welcoming", description: "Calm authority, grounded posture, steady gaze. Neutral lighting with balanced composition." },
  { value: "confidence", label: "Confident", description: "Strong posture, direct eye contact, bold framing. Clean lighting with purposeful angles." },
  { value: "empathy", label: "Warm", description: "Softer lighting, open posture, gentle expression. Warm tones that invite connection." },
  { value: "motivation", label: "Motivated", description: "Dynamic energy, forward-leaning pose, bright expression. Vibrant lighting with movement." },
];

export const emotionalImpacts: { value: EmotionalImpact; label: string; description: string }[] = [
  { value: "bright", label: "Inspired", description: "Airy, clean, natural light, fresh and open feeling" },
  { value: "cozy", label: "Comfortable", description: "Warm tones, golden hour lighting, intimate framing" },
  { value: "powerful", label: "Reassured", description: "Bold contrast, dramatic shadows, commanding presence" },
];

export const shootIntents: { value: ShootIntent; label: string; description: string }[] = [
  { value: "social-media", label: "Social Media", description: "For your website(s) and social media platforms. Non ad campaign usage." },
  { value: "commercial", label: "Commercial", description: "For use in ad campaigns and marketing" },
  { value: "team", label: "Team or Company", description: "For team photoshoots" },
];

export const environmentImages: Record<string, string> = {
  gym: "/images/env-gym.webp",
  kitchen: "/images/env-kitchen.webp",
  restaurant: "/images/env-restaurant.webp",
  office: "/images/env-office.webp",
  nature: "/images/env-nature.webp",
  workvan: "/images/env-workvan.webp",
  urban: "/images/env-urban.webp",
  suburban: "/images/env-suburban.webp",
};

export const moodLitImages: Record<string, Record<string, string>> = {
  gym: {
    cozy: "/images/env-gym-cozy.webp",
    bright: "/images/env-gym-bright.webp",
    powerful: "/images/env-gym-powerful.webp",
  },
  kitchen: {
    cozy: "/images/env-kitchen-cozy.webp",
    bright: "/images/env-kitchen-bright.webp",
    powerful: "/images/env-kitchen-powerful.webp",
    cinematic: "/images/env-kitchen-cinematic.webp",
  },
  nature: {
    cozy: "/images/env-nature-cozy.webp",
    bright: "/images/env-nature-bright.webp",
    powerful: "/images/env-nature-powerful.webp",
    cinematic: "/images/env-nature-cinematic.webp",
  },
  office: {
    cozy: "/images/env-office-cozy.webp",
    bright: "/images/env-office-bright.webp",
    powerful: "/images/env-office-powerful.webp",
    cinematic: "/images/env-office-cinematic.webp",
  },
  restaurant: {
    cozy: "/images/env-restaurant-cozy.webp",
    bright: "/images/env-restaurant-bright.webp",
    powerful: "/images/env-restaurant-powerful.webp",
    cinematic: "/images/env-restaurant-cinematic.webp",
  },
  suburban: {
    cozy: "/images/env-suburban-cozy.webp",
    bright: "/images/env-suburban-bright.webp",
    powerful: "/images/env-suburban-powerful.webp",
    cinematic: "/images/env-suburban-cinematic.webp",
  },
  urban: {
    cozy: "/images/env-urban-cozy.webp",
    bright: "/images/env-urban-bright.webp",
    powerful: "/images/env-urban-powerful.webp",
    cinematic: "/images/env-urban-cinematic.webp",
  },
  workvan: {
    cozy: "/images/env-workvan-cozy.webp",
    bright: "/images/env-workvan-bright.webp",
    powerful: "/images/env-workvan-powerful.webp",
    cinematic: "/images/env-workvan-cinematic.webp",
  },
};

export function getMoodLitImage(environment: string | null, emotionalImpact: string | null): string | null {
  if (!environment || !emotionalImpact) return null;
  return moodLitImages[environment]?.[emotionalImpact] ?? null;
}

export function getDisplayLabel(
  step: "environment" | "brandMessage" | "emotionalImpact" | "shootIntent",
  state: ConfiguratorState
): string | null {
  const value = state[step];
  if (!value) return null;
  if (value === "other") {
    const customKey = `${step}Custom` as keyof ConfiguratorState;
    const custom = state[customKey] as string;
    return custom ? custom : "Other";
  }
  switch (step) {
    case "environment":
      return environments.find((e) => e.value === value)?.label ?? null;
    case "brandMessage":
      return brandMessages.find((m) => m.value === value)?.label ?? null;
    case "emotionalImpact":
      return emotionalImpacts.find((i) => i.value === value)?.label ?? null;
    case "shootIntent":
      return shootIntents.find((s) => s.value === value)?.label ?? null;
  }
}

export function generateBrandDescription(state: ConfiguratorState): string {
  if (!state.environment || !state.brandMessage || !state.emotionalImpact) return "";

  const envLabels: Record<string, string> = {
    kitchen: "culinary",
    restaurant: "culinary",
    office: "corporate",
    nature: "natural",
    workvan: "field-based",
    urban: "urban",
    suburban: "community-centered",
    other: state.environmentCustom || "unique",
  };

  const messageLabels: Record<string, string> = {
    assured: "welcoming and approachable",
    empathy: "warm and inviting",
    confidence: "confident and decisive",
    motivation: "motivated and inspiring",
    other: state.brandMessageCustom || "distinctive",
  };

  const impactLabels: Record<string, string> = {
    cozy: "warm and inviting",
    bright: "fresh and professional",
    powerful: "bold and commanding",
    cinematic: "cinematic and memorable",
    other: state.emotionalImpactCustom || "personalized",
  };

  const env = envLabels[state.environment] ?? "unique";
  const msg = messageLabels[state.brandMessage] ?? "distinctive";
  const imp = impactLabels[state.emotionalImpact] ?? "personalized";

  return `A ${imp} ${env} branding shoot designed to position you as a ${msg} professional.`;
}

export function calculatePricing(state: ConfiguratorState): { min: number; max: number } {
  return calcPricing(state.shootIntent);
}
