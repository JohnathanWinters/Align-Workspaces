import type { ColorSwatch } from "@shared/schema";

const palettes: Record<string, ColorSwatch[]> = {
  "office-assured-bright": [
    { hex: "#A8C4E0", keyword: "Powder Blue" },
    { hex: "#E8DFD5", keyword: "Soft Linen" },
    { hex: "#6B8F5E", keyword: "Sage Green" },
  ],
  "office-assured-cozy": [
    { hex: "#8B3A2A", keyword: "Terracotta" },
    { hex: "#C4742A", keyword: "Burnt Orange" },
    { hex: "#D4A574", keyword: "Honey Gold" },
  ],
  "office-confidence-bright": [
    { hex: "#2B3A52", keyword: "Deep Navy" },
    { hex: "#4A7C90", keyword: "Teal" },
    { hex: "#F5F0E8", keyword: "Warm White" },
  ],
  "office-confidence-cozy": [
    { hex: "#3B2F2F", keyword: "Espresso" },
    { hex: "#D4A574", keyword: "Honey Gold" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "office-empathy-bright": [
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#A8C4E0", keyword: "Powder Blue" },
    { hex: "#6B8F5E", keyword: "Sage Green" },
  ],
  "office-empathy-cozy": [
    { hex: "#C4742A", keyword: "Burnt Orange" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "office-motivation-bright": [
    { hex: "#E84B2A", keyword: "Coral Red" },
    { hex: "#D4A24E", keyword: "Marigold" },
    { hex: "#4A7C59", keyword: "Fresh Green" },
  ],
  "office-motivation-cozy": [
    { hex: "#C73B6B", keyword: "Berry Pink" },
    { hex: "#D4A24E", keyword: "Marigold" },
    { hex: "#8B3A2A", keyword: "Terracotta" },
  ],
  "urban-assured-bright": [
    { hex: "#B0C4D8", keyword: "City Sky" },
    { hex: "#D5C8B8", keyword: "Champagne" },
    { hex: "#8A9BAA", keyword: "Steel Blue" },
  ],
  "urban-assured-cozy": [
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#6B7B8D", keyword: "Slate" },
    { hex: "#8B4E3B", keyword: "Warm Bronze" },
  ],
  "urban-confidence-bright": [
    { hex: "#2B3A52", keyword: "Deep Navy" },
    { hex: "#4A90C4", keyword: "Clear Sky" },
    { hex: "#5A7D4A", keyword: "Forest Green" },
  ],
  "urban-confidence-cozy": [
    { hex: "#2D2D2D", keyword: "Charcoal" },
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#8A6B4E", keyword: "Bronze" },
  ],
  "urban-empathy-bright": [
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#B0C4D8", keyword: "City Sky" },
    { hex: "#8A9BAA", keyword: "Steel Blue" },
  ],
  "urban-empathy-cozy": [
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#6B5B4E", keyword: "Mocha" },
  ],
  "urban-motivation-bright": [
    { hex: "#E84B2A", keyword: "Coral Red" },
    { hex: "#4A90C4", keyword: "Clear Sky" },
    { hex: "#D4A24E", keyword: "Marigold" },
  ],
  "urban-motivation-cozy": [
    { hex: "#C73B6B", keyword: "Berry Pink" },
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#D4A24E", keyword: "Marigold" },
  ],
  "nature-assured-bright": [
    { hex: "#6B8F5E", keyword: "Sage Green" },
    { hex: "#A8C4E0", keyword: "Open Sky" },
    { hex: "#8FB573", keyword: "Moss" },
  ],
  "nature-assured-cozy": [
    { hex: "#5C7A3A", keyword: "Deep Moss" },
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "nature-confidence-bright": [
    { hex: "#2E5A3A", keyword: "Evergreen" },
    { hex: "#A8C4E0", keyword: "Open Sky" },
    { hex: "#D4B896", keyword: "Warm Sand" },
  ],
  "nature-confidence-cozy": [
    { hex: "#3D5A2E", keyword: "Forest" },
    { hex: "#8B6F4E", keyword: "Caramel" },
    { hex: "#C4742A", keyword: "Burnt Orange" },
  ],
  "nature-empathy-bright": [
    { hex: "#8FB573", keyword: "Moss" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#A8C4E0", keyword: "Open Sky" },
  ],
  "nature-empathy-cozy": [
    { hex: "#6B8F5E", keyword: "Sage Green" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#C4935A", keyword: "Amber" },
  ],
  "nature-motivation-bright": [
    { hex: "#4A7C59", keyword: "Fresh Green" },
    { hex: "#D4A24E", keyword: "Marigold" },
    { hex: "#E84B2A", keyword: "Coral Red" },
  ],
  "nature-motivation-cozy": [
    { hex: "#5C7A3A", keyword: "Deep Moss" },
    { hex: "#C4742A", keyword: "Burnt Orange" },
    { hex: "#D4A24E", keyword: "Marigold" },
  ],
  "restaurant-assured-bright": [
    { hex: "#E8DFD5", keyword: "Soft Linen" },
    { hex: "#A67B5B", keyword: "Warm Taupe" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "restaurant-assured-cozy": [
    { hex: "#8B3A2A", keyword: "Terracotta" },
    { hex: "#D4A574", keyword: "Honey Gold" },
    { hex: "#C4742A", keyword: "Burnt Orange" },
  ],
  "restaurant-confidence-bright": [
    { hex: "#2B3A52", keyword: "Deep Navy" },
    { hex: "#F5F0E8", keyword: "Warm White" },
    { hex: "#A67B5B", keyword: "Warm Taupe" },
  ],
  "restaurant-confidence-cozy": [
    { hex: "#3B2F2F", keyword: "Espresso" },
    { hex: "#8B3A2A", keyword: "Terracotta" },
    { hex: "#D4A574", keyword: "Honey Gold" },
  ],
  "restaurant-empathy-bright": [
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#E8DFD5", keyword: "Soft Linen" },
    { hex: "#A67B5B", keyword: "Warm Taupe" },
  ],
  "restaurant-empathy-cozy": [
    { hex: "#C4742A", keyword: "Burnt Orange" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "restaurant-motivation-bright": [
    { hex: "#E84B2A", keyword: "Coral Red" },
    { hex: "#D4A24E", keyword: "Marigold" },
    { hex: "#4A7C59", keyword: "Fresh Green" },
  ],
  "restaurant-motivation-cozy": [
    { hex: "#C73B6B", keyword: "Berry Pink" },
    { hex: "#C4742A", keyword: "Burnt Orange" },
    { hex: "#D4A24E", keyword: "Marigold" },
  ],
  "workvan-assured-bright": [
    { hex: "#D4B896", keyword: "Warm Sand" },
    { hex: "#8A9BAA", keyword: "Steel Blue" },
    { hex: "#E8DFD5", keyword: "Soft Linen" },
  ],
  "workvan-assured-cozy": [
    { hex: "#8B6F4E", keyword: "Caramel" },
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#5C4033", keyword: "Dark Walnut" },
  ],
  "workvan-confidence-bright": [
    { hex: "#2B3A52", keyword: "Deep Navy" },
    { hex: "#8A9BAA", keyword: "Steel Blue" },
    { hex: "#D4B896", keyword: "Warm Sand" },
  ],
  "workvan-confidence-cozy": [
    { hex: "#2D2D2D", keyword: "Charcoal" },
    { hex: "#8B6F4E", keyword: "Caramel" },
    { hex: "#C4935A", keyword: "Amber" },
  ],
  "workvan-empathy-bright": [
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#D4B896", keyword: "Warm Sand" },
    { hex: "#8A9BAA", keyword: "Steel Blue" },
  ],
  "workvan-empathy-cozy": [
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "workvan-motivation-bright": [
    { hex: "#E84B2A", keyword: "Coral Red" },
    { hex: "#D4A24E", keyword: "Marigold" },
    { hex: "#8A9BAA", keyword: "Steel Blue" },
  ],
  "workvan-motivation-cozy": [
    { hex: "#C73B6B", keyword: "Berry Pink" },
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#D4A24E", keyword: "Marigold" },
  ],
  "suburban-assured-bright": [
    { hex: "#E8DFD5", keyword: "Soft Linen" },
    { hex: "#8FB573", keyword: "Moss" },
    { hex: "#A8C4E0", keyword: "Powder Blue" },
  ],
  "suburban-assured-cozy": [
    { hex: "#8B6F4E", keyword: "Caramel" },
    { hex: "#6B8F5E", keyword: "Sage Green" },
    { hex: "#C4935A", keyword: "Amber" },
  ],
  "suburban-confidence-bright": [
    { hex: "#2B3A52", keyword: "Deep Navy" },
    { hex: "#8FB573", keyword: "Moss" },
    { hex: "#D4B896", keyword: "Warm Sand" },
  ],
  "suburban-confidence-cozy": [
    { hex: "#3B2F2F", keyword: "Espresso" },
    { hex: "#6B8F5E", keyword: "Sage Green" },
    { hex: "#8B6F4E", keyword: "Caramel" },
  ],
  "suburban-empathy-bright": [
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#8FB573", keyword: "Moss" },
    { hex: "#A8C4E0", keyword: "Powder Blue" },
  ],
  "suburban-empathy-cozy": [
    { hex: "#6B8F5E", keyword: "Sage Green" },
    { hex: "#D4A5A0", keyword: "Blush Rose" },
    { hex: "#C4935A", keyword: "Amber" },
  ],
  "suburban-motivation-bright": [
    { hex: "#4A7C59", keyword: "Fresh Green" },
    { hex: "#D4A24E", keyword: "Marigold" },
    { hex: "#E84B2A", keyword: "Coral Red" },
  ],
  "suburban-motivation-cozy": [
    { hex: "#5C7A3A", keyword: "Deep Moss" },
    { hex: "#C4742A", keyword: "Burnt Orange" },
    { hex: "#D4A24E", keyword: "Marigold" },
  ],
};

const emotionalFallback: Record<string, ColorSwatch[]> = {
  bright: [
    { hex: "#F5F0E8", keyword: "Warm White" },
    { hex: "#A8C4E0", keyword: "Powder Blue" },
    { hex: "#6B8F5E", keyword: "Sage Green" },
  ],
  cozy: [
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#8B6F4E", keyword: "Caramel" },
    { hex: "#5C4033", keyword: "Dark Walnut" },
  ],
  powerful: [
    { hex: "#2B3A52", keyword: "Deep Navy" },
    { hex: "#2D2D2D", keyword: "Charcoal" },
    { hex: "#C0C0C0", keyword: "Silver" },
  ],
  cinematic: [
    { hex: "#1A1A2E", keyword: "Midnight" },
    { hex: "#C4935A", keyword: "Amber" },
    { hex: "#2B3A52", keyword: "Deep Navy" },
  ],
};

const genericFallback: ColorSwatch[] = [
  { hex: "#E8DFD5", keyword: "Soft Linen" },
  { hex: "#8A9BAA", keyword: "Steel Blue" },
  { hex: "#6B8F5E", keyword: "Sage Green" },
];

export function getRecommendedPalette(
  environment: string | null,
  brandMessage: string | null,
  emotionalImpact: string | null
): ColorSwatch[] {
  if (environment && brandMessage && emotionalImpact) {
    const key = `${environment}-${brandMessage}-${emotionalImpact}`;
    if (palettes[key]) return palettes[key];
  }

  if (emotionalImpact && emotionalFallback[emotionalImpact]) {
    return emotionalFallback[emotionalImpact];
  }

  return genericFallback;
}
