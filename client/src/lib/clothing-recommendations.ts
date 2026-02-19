interface ClothingRecommendation {
  type: string;
  fabric: string;
  note: string;
}

const environmentClothing: Record<string, { types: string[]; fabrics: string[]; avoid: string }> = {
  kitchen: {
    types: ["Chef coat", "Apron over dress shirt", "Fitted culinary jacket"],
    fabrics: ["Cotton twill", "Linen blend", "Canvas"],
    avoid: "Avoid loose sleeves or synthetic materials that wrinkle under heat",
  },
  restaurant: {
    types: ["Blazer with open collar", "Tailored vest", "Dark dress shirt"],
    fabrics: ["Wool blend", "Silk blend", "Fine cotton"],
    avoid: "Avoid overly casual pieces — the setting calls for polished attire",
  },
  office: {
    types: ["Tailored suit", "Structured blazer", "Button-down with slacks"],
    fabrics: ["Worsted wool", "Cotton poplin", "Gabardine"],
    avoid: "Avoid loud patterns — solids and subtle textures photograph best",
  },
  nature: {
    types: ["Linen shirt", "Light jacket", "Henley or relaxed button-down"],
    fabrics: ["Linen", "Chambray", "Soft cotton"],
    avoid: "Avoid stiff formal wear — aim for relaxed but put-together",
  },
  workvan: {
    types: ["Work jacket", "Branded polo", "Utility vest over tee"],
    fabrics: ["Canvas", "Denim", "Heavy cotton"],
    avoid: "Avoid anything too dressy — authentic workwear reads best",
  },
  urban: {
    types: ["Leather jacket", "Fitted overcoat", "Modern blazer with crew neck"],
    fabrics: ["Leather", "Wool", "Structured cotton"],
    avoid: "Avoid overly relaxed fits — clean lines match the city backdrop",
  },
  suburban: {
    types: ["Casual blazer", "Light sweater", "Polo or relaxed button-down"],
    fabrics: ["Cotton knit", "Light linen", "Jersey blend"],
    avoid: "Avoid heavy dark suits — keep it approachable and warm",
  },
};

const brandMessageModifiers: Record<string, { preference: string; colors: string[] }> = {
  assured: {
    preference: "Classic, timeless silhouettes with minimal detail",
    colors: ["Navy", "Charcoal", "Deep olive", "Burgundy"],
  },
  empathy: {
    preference: "Softer cuts, open collars, and approachable silhouettes",
    colors: ["Warm cream", "Soft blue", "Earth tones", "Muted sage"],
  },
  confidence: {
    preference: "Sharp tailoring, strong shoulders, and bold structure",
    colors: ["Black", "White", "Deep red", "Royal blue"],
  },
  motivation: {
    preference: "Modern fits with a touch of energy and movement",
    colors: ["Bright white", "Coral", "Electric blue", "Teal"],
  },
};

const moodFabricNotes: Record<string, string> = {
  cozy: "Choose fabrics with visible texture — knits, linens, and soft weaves catch warm light beautifully.",
  bright: "Go with clean, smooth fabrics — crisp cottons and light colors reflect natural light well.",
  powerful: "Structured, matte fabrics like wool and gabardine absorb dramatic light and hold strong silhouettes.",
};

export function getClothingRecommendations(
  environment: string | null,
  brandMessage: string | null,
  emotionalImpact: string | null
): {
  clothing: string[];
  fabrics: string[];
  colors: string[];
  styleNote: string;
  fabricNote: string;
  avoidNote: string;
} | null {
  if (!environment || !brandMessage) return null;

  const envData = environmentClothing[environment];
  const msgData = brandMessageModifiers[brandMessage];
  const moodNote = emotionalImpact ? moodFabricNotes[emotionalImpact] : null;

  if (!envData || !msgData) return null;

  return {
    clothing: envData.types,
    fabrics: envData.fabrics,
    colors: msgData.colors,
    styleNote: msgData.preference,
    fabricNote: moodNote || "",
    avoidNote: envData.avoid,
  };
}
