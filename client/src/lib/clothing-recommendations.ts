const environmentClothing: Record<string, { types: string[]; avoidFabrics: string[]; avoid: string }> = {
  kitchen: {
    types: ["Chef coat or apron over a nice shirt", "Fitted jacket with rolled sleeves"],
    avoidFabrics: ["Shiny synthetics", "Sheer fabrics", "Plaid"],
    avoid: "Avoid loose sleeves or fabrics that wrinkle easily under heat",
  },
  restaurant: {
    types: ["Blazer with no tie", "Dark button-down shirt", "Vest over a clean shirt"],
    avoidFabrics: ["Denim", "Distressed denim", "Plaid"],
    avoid: "Avoid overly casual pieces, the setting calls for a polished look",
  },
  office: {
    types: ["Suit or blazer", "Button-down with dress pants", "Professional but comfortable"],
    avoidFabrics: ["Distressed denim", "Loud patterns", "Pinstripes"],
    avoid: "Avoid busy patterns, solid colors and simple textures photograph best",
  },
  nature: {
    types: ["Light layers", "Relaxed button-down or soft sweater", "Something that moves naturally"],
    avoidFabrics: ["Shiny synthetics", "Silk", "Pinstripes"],
    avoid: "Avoid stiff formal wear, aim for relaxed but put-together",
  },
  workvan: {
    types: ["Work jacket or branded polo", "Clean t-shirt with a vest", "Authentic workwear"],
    avoidFabrics: ["Silk", "Sheer fabrics", "Pinstripes"],
    avoid: "Avoid anything too dressy, real workwear reads best on camera",
  },
  urban: {
    types: ["Leather or denim jacket", "Modern blazer with a simple top", "Clean streetwear"],
    avoidFabrics: ["Distressed denim", "Plaid", "Shiny synthetics"],
    avoid: "Avoid baggy fits, clean lines match the city backdrop",
  },
  suburban: {
    types: ["Casual blazer or light sweater", "Polo or relaxed button-down", "Smart casual"],
    avoidFabrics: ["Shiny synthetics", "Loud patterns", "Plaid"],
    avoid: "Avoid heavy dark suits, keep it warm and approachable",
  },
  gym: {
    types: ["Fitted athletic top", "Clean performance jacket", "Simple tank or compression shirt"],
    avoidFabrics: ["Denim", "Silk", "Plaid"],
    avoid: "Avoid worn-out gym clothes, go for clean, fitted activewear",
  },
};

const brandMessageFit: Record<string, { fit: string[]; preference: string }> = {
  assured: {
    fit: ["Loose top, slim bottom", "Relaxed shoulders, fitted pants"],
    preference: "Open, relaxed silhouettes that feel welcoming and approachable",
  },
  empathy: {
    fit: ["Soft loose top, relaxed bottom", "Flowy top, fitted at the waist"],
    preference: "Soft fabrics, open collars, and inviting shapes",
  },
  confidence: {
    fit: ["Fitted top, slim bottom", "Structured jacket, tailored pants"],
    preference: "Sharp tailoring, strong shoulders, and bold structure",
  },
  motivation: {
    fit: ["Slim top, relaxed bottom", "Fitted shirt, comfortable pants"],
    preference: "Modern, energetic fits that convey drive and ambition",
  },
};

const moodFabricNotes: Record<string, { note: string; avoid: string[] }> = {
  cozy: {
    note: "Choose fabrics with visible texture, knits, linens, and soft weaves catch warm light beautifully.",
    avoid: ["Shiny synthetics", "Pinstripes"],
  },
  bright: {
    note: "Go with clean, smooth fabrics, crisp cottons and light colors reflect natural light well.",
    avoid: ["Distressed denim", "Plaid"],
  },
  powerful: {
    note: "Structured, matte fabrics like wool absorb dramatic light and hold strong silhouettes.",
    avoid: ["Sheer fabrics", "Loud patterns"],
  },
};

const genericClothing = {
  types: ["Simple blazer or jacket", "Clean button-down", "Something structured but comfortable"],
  avoidFabrics: ["Shiny synthetics", "Loud patterns", "Distressed denim"],
  avoid: "Avoid busy patterns or visible logos, solid colors and simple textures photograph best",
};

const genericFit = {
  fit: ["Well-fitted top, clean bottom", "Structured yet comfortable"],
  preference: "Choose pieces that feel like you, comfort translates to confidence on camera",
};

// Map fabric display names → image filenames in /images/fabrics/
export const fabricImageMap: Record<string, string> = {
  "Denim": "denim.webp",
  "Distressed denim": "distressed-denim.webp",
  "Loud patterns": "loud-patterns.webp",
  "Plaid": "plaid.webp",
  "Pinstripes": "pinstripes.webp",
  "Sheer fabrics": "sheer-fabrics.webp",
  "Shiny synthetics": "shiny-synthetics.webp",
  "Silk": "silk.webp",
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
  const moodData = emotionalImpact ? moodFabricNotes[emotionalImpact] : null;

  // Merge environment + mood avoids, deduplicate
  const combinedAvoids = [...envData.avoidFabrics];
  if (moodData?.avoid) {
    for (const fabric of moodData.avoid) {
      if (!combinedAvoids.includes(fabric)) combinedAvoids.push(fabric);
    }
  }

  return {
    clothing: envData.types,
    avoidFabrics: combinedAvoids,
    fit: msgData.fit,
    styleNote: msgData.preference,
    fabricNote: moodData?.note || "",
    avoidNote: envData.avoid,
  };
}
