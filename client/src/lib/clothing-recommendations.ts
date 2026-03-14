const environmentClothing: Record<string, { types: string[]; avoidFabrics: string[]; avoid: string }> = {
  kitchen: {
    types: ["Chef coat", "Apron over dress shirt", "Fitted culinary jacket"],
    avoidFabrics: ["Synthetic blends", "Loose-weave fabrics", "Polyester"],
    avoid: "Avoid loose sleeves or synthetic materials that wrinkle under heat",
  },
  restaurant: {
    types: ["Blazer with open collar", "Tailored vest", "Dark dress shirt"],
    avoidFabrics: ["Denim", "Athletic fabrics", "Heavy canvas"],
    avoid: "Avoid overly casual pieces, the setting calls for polished attire",
  },
  office: {
    types: ["Tailored suit", "Structured blazer", "Button-down with slacks"],
    avoidFabrics: ["Jersey knit", "Distressed denim", "Sheer fabrics"],
    avoid: "Avoid loud patterns, solids and subtle textures photograph best",
  },
  nature: {
    types: ["Linen shirt", "Light jacket", "Henley or relaxed button-down"],
    avoidFabrics: ["Heavy wool", "Stiff synthetics", "Formal silks"],
    avoid: "Avoid stiff formal wear, aim for relaxed but put-together",
  },
  workvan: {
    types: ["Work jacket", "Branded polo", "Utility vest over tee"],
    avoidFabrics: ["Silk", "Formal wool", "Delicate fabrics"],
    avoid: "Avoid anything too dressy, authentic workwear reads best",
  },
  urban: {
    types: ["Leather jacket", "Fitted overcoat", "Modern blazer with crew neck"],
    avoidFabrics: ["Baggy fleece", "Cargo fabrics", "Athletic mesh"],
    avoid: "Avoid overly relaxed fits, clean lines match the city backdrop",
  },
  suburban: {
    types: ["Casual blazer", "Light sweater", "Polo or relaxed button-down"],
    avoidFabrics: ["Heavy dark fabrics", "Stiff formal suiting", "Shiny synthetics"],
    avoid: "Avoid heavy dark suits, keep it approachable and warm",
  },
  gym: {
    types: ["Fitted athletic top", "Branded tank or compression shirt", "Clean performance jacket"],
    avoidFabrics: ["Formal wool", "Denim", "Loose cotton tees"],
    avoid: "Avoid oversized or worn-out gym clothes, go for clean, fitted performance wear",
  },
};

const brandMessageFit: Record<string, { fit: string[]; preference: string }> = {
  assured: {
    fit: ["Loose top, slim bottom", "Relaxed shoulders, tapered leg"],
    preference: "Open, relaxed silhouettes that feel welcoming and approachable",
  },
  empathy: {
    fit: ["Soft drape top, relaxed bottom", "Flowy top, fitted waist"],
    preference: "Softer cuts, open collars, and inviting silhouettes",
  },
  confidence: {
    fit: ["Fitted top, tapered bottom", "Structured top, slim leg"],
    preference: "Sharp tailoring, strong shoulders, and bold structure",
  },
  motivation: {
    fit: ["Tapered top, loose bottom", "Slim fit top, relaxed leg"],
    preference: "Modern, energetic fits that convey drive and ambition",
  },
};

const moodFabricNotes: Record<string, string> = {
  cozy: "Choose fabrics with visible texture, knits, linens, and soft weaves catch warm light beautifully.",
  bright: "Go with clean, smooth fabrics, crisp cottons and light colors reflect natural light well.",
  powerful: "Structured, matte fabrics like wool and gabardine absorb dramatic light and hold strong silhouettes.",
};

const genericClothing = {
  types: ["Tailored blazer", "Clean button-down", "Simple structured jacket"],
  avoidFabrics: ["Shiny synthetics", "Loud patterns", "Distressed denim"],
  avoid: "Avoid overly busy patterns or logos, solid colors and subtle textures photograph best",
};

const genericFit = {
  fit: ["Well-fitted top, clean bottom", "Structured yet comfortable"],
  preference: "Choose pieces that feel like you, comfort translates to confidence on camera",
};

export function getClothingRecommendations(
  environment: string | null,
  brandMessage: string | null,
  emotionalImpact: string | null
): {
  clothing: string[];
  avoidFabrics: string[];
  fit: string[];
  styleNote: string;
  fabricNote: string;
  avoidNote: string;
} | null {
  const envData = environment ? (environmentClothing[environment] || genericClothing) : genericClothing;
  const msgData = brandMessage ? (brandMessageFit[brandMessage] || genericFit) : genericFit;
  const moodNote = emotionalImpact ? moodFabricNotes[emotionalImpact] : null;

  return {
    clothing: envData.types,
    avoidFabrics: envData.avoidFabrics,
    fit: msgData.fit,
    styleNote: msgData.preference,
    fabricNote: moodNote || "",
    avoidNote: envData.avoid,
  };
}
