import { calculatePricing as calcPricing } from "@shared/pricing";

export type Environment = "restaurant" | "office" | "nature" | "workvan" | "urban" | "suburban" | "kitchen" | "other";
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
  shootIntent: null,
  shootIntentCustom: "",
};

export const environments: { value: Environment; label: string; icon: string }[] = [
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
  { value: "bright", label: "Bright", description: "Airy, clean, natural light, fresh and open feeling" },
  { value: "cozy", label: "Cozy", description: "Warm tones, golden hour lighting, intimate framing" },
  { value: "powerful", label: "Powerful", description: "Bold contrast, dramatic shadows, commanding presence" },
];

export const shootIntents: { value: ShootIntent; label: string; description: string }[] = [
  { value: "commercial", label: "Commercial", description: "For use in ad campaigns and marketing" },
  { value: "social-media", label: "Social Media", description: "For your website(s) and social media platforms. Non ad campaign usage." },
  { value: "team", label: "Team or Company", description: "For team photoshoots" },
];

export const environmentImages: Record<string, string> = {
  kitchen: "/images/env-kitchen.jpg",
  restaurant: "/images/env-restaurant.png",
  office: "/images/env-office.png",
  nature: "/images/env-nature.png",
  workvan: "/images/env-workvan.png",
  urban: "/images/env-urban.png",
  suburban: "/images/env-suburban.png",
};

export const moodLitImages: Record<string, Record<string, string>> = {
  kitchen: {
    cozy: "/images/env-kitchen-cozy.png",
    bright: "/images/env-kitchen-bright.png",
    powerful: "/images/env-kitchen-powerful.png",
    cinematic: "/images/env-kitchen-cinematic.png",
  },
  nature: {
    cozy: "/images/env-nature-cozy.png",
    bright: "/images/env-nature-bright.png",
    powerful: "/images/env-nature-powerful.png",
    cinematic: "/images/env-nature-cinematic.png",
  },
  office: {
    cozy: "/images/env-office-cozy.png",
    bright: "/images/env-office-bright.png",
    powerful: "/images/env-office-powerful.png",
    cinematic: "/images/env-office-cinematic.png",
  },
  restaurant: {
    cozy: "/images/env-restaurant-cozy.png",
    bright: "/images/env-restaurant-bright.png",
    powerful: "/images/env-restaurant-powerful.png",
    cinematic: "/images/env-restaurant-cinematic.png",
  },
  suburban: {
    cozy: "/images/env-suburban-cozy.png",
    bright: "/images/env-suburban-bright.png",
    powerful: "/images/env-suburban-powerful.png",
    cinematic: "/images/env-suburban-cinematic.png",
  },
  urban: {
    cozy: "/images/env-urban-cozy.png",
    bright: "/images/env-urban-bright.png",
    powerful: "/images/env-urban-powerful.png",
    cinematic: "/images/env-urban-cinematic.png",
  },
  workvan: {
    cozy: "/images/env-workvan-cozy.png",
    bright: "/images/env-workvan-bright.png",
    powerful: "/images/env-workvan-powerful.png",
    cinematic: "/images/env-workvan-cinematic.png",
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
