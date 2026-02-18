export type Environment = "restaurant" | "office" | "nature" | "workvan" | "urban" | "suburban" | "other";
export type BrandMessage = "assured" | "empathy" | "confidence" | "motivation" | "other";
export type EmotionalImpact = "cozy" | "bright" | "powerful" | "cinematic" | "other";
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
  environment: null,
  environmentCustom: "",
  brandMessage: null,
  brandMessageCustom: "",
  emotionalImpact: null,
  emotionalImpactCustom: "",
  shootIntent: null,
  shootIntentCustom: "",
};

export const environments: { value: Environment; label: string; icon: string }[] = [
  { value: "nature", label: "Nature", icon: "TreePine" },
  { value: "office", label: "Office", icon: "Building2" },
  { value: "restaurant", label: "Restaurant", icon: "UtensilsCrossed" },
  { value: "suburban", label: "Suburban", icon: "Home" },
  { value: "urban", label: "Urban", icon: "Building" },
  { value: "workvan", label: "Work Van", icon: "Truck" },
];

export const brandMessages: { value: BrandMessage; label: string; description: string }[] = [
  { value: "assured", label: "Assured", description: "Calm authority, grounded posture, steady gaze. Neutral lighting with balanced composition." },
  { value: "confidence", label: "Confidence", description: "Strong posture, direct eye contact, bold framing. Clean lighting with purposeful angles." },
  { value: "empathy", label: "Empathy", description: "Softer lighting, open posture, gentle expression. Warm tones that invite connection." },
  { value: "motivation", label: "Motivation", description: "Dynamic energy, forward-leaning pose, bright expression. Vibrant lighting with movement." },
];

export const emotionalImpacts: { value: EmotionalImpact; label: string; description: string }[] = [
  { value: "bright", label: "Bright", description: "Airy, clean, natural light, fresh and open feeling" },
  { value: "cinematic", label: "Cinematic", description: "Dramatic storytelling, film-like color grading, depth" },
  { value: "cozy", label: "Cozy", description: "Warm tones, golden hour lighting, intimate framing" },
  { value: "powerful", label: "Powerful", description: "Bold contrast, dramatic shadows, commanding presence" },
];

export const shootIntents: { value: ShootIntent; label: string }[] = [
  { value: "commercial", label: "Commercial" },
  { value: "social-media", label: "Social Media" },
  { value: "team", label: "Team or Company" },
];

export const environmentImages: Record<string, string> = {
  restaurant: "/images/env-restaurant.png",
  office: "/images/env-office.png",
  nature: "/images/env-nature.png",
  workvan: "/images/env-workvan.png",
  urban: "/images/env-urban.png",
  suburban: "/images/env-suburban.png",
};

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
    restaurant: "culinary",
    office: "corporate",
    nature: "natural",
    workvan: "field-based",
    urban: "urban",
    suburban: "community-centered",
    other: state.environmentCustom || "unique",
  };

  const messageLabels: Record<string, string> = {
    assured: "composed and authoritative",
    empathy: "warm and approachable",
    confidence: "confident and decisive",
    motivation: "energetic and inspiring",
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
  let min = 200;
  let max = 300;

  if (state.emotionalImpact && state.emotionalImpact !== "other") {
    min += 0;
    max += 0;
  }

  if (state.shootIntent === "commercial") {
    min += 200;
    max += 500;
  } else if (state.shootIntent === "team") {
    min += 150;
    max += 300;
  }

  return { min, max };
}
