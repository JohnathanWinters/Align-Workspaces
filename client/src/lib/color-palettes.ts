import type { ColorSwatch } from "@shared/schema";

export interface PaletteOption {
  name: string;
  colors: ColorSwatch[];
}

const palettes: Record<string, PaletteOption[]> = {
  "office-assured-bright": [
    { name: "Clean Professional", colors: [{ hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#6B8F5E", keyword: "Sage Green" }] },
    { name: "Modern Neutral", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#7A8B99", keyword: "Cool Gray" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Soft Authority", colors: [{ hex: "#4A7C90", keyword: "Teal" }, { hex: "#E8DDD0", keyword: "Warm Cream" }, { hex: "#C0C0C0", keyword: "Silver" }] },
  ],
  "office-assured-cozy": [
    { name: "Warm Earth", colors: [{ hex: "#8B3A2A", keyword: "Terracotta" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#D4A574", keyword: "Honey Gold" }] },
    { name: "Rich Heritage", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#C4742A", keyword: "Burnt Orange" }] },
    { name: "Golden Hour", colors: [{ hex: "#D4A574", keyword: "Honey Gold" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#F0E6D8", keyword: "Ivory" }] },
  ],
  "office-confidence-bright": [
    { name: "Bold Executive", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#4A7C90", keyword: "Teal" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Cool Precision", colors: [{ hex: "#C0C0C0", keyword: "Silver" }, { hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#E8DDD0", keyword: "Warm Cream" }] },
    { name: "Sharp Contrast", colors: [{ hex: "#4A7C90", keyword: "Teal" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#2D2D2D", keyword: "Charcoal" }] },
  ],
  "office-confidence-cozy": [
    { name: "Dark Luxe", colors: [{ hex: "#3B2F2F", keyword: "Espresso" }, { hex: "#D4A574", keyword: "Honey Gold" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Warm Power", colors: [{ hex: "#5A4A3A", keyword: "Dark Bronze" }, { hex: "#E8DDD0", keyword: "Warm Cream" }, { hex: "#D4A574", keyword: "Honey Gold" }] },
    { name: "Classic Study", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#3B2F2F", keyword: "Espresso" }, { hex: "#C4935A", keyword: "Amber" }] },
  ],
  "office-empathy-bright": [
    { name: "Gentle Touch", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#6B8F5E", keyword: "Sage Green" }] },
    { name: "Soft Morning", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#E8D5C4", keyword: "Soft Peach" }, { hex: "#A8C4E0", keyword: "Powder Blue" }] },
    { name: "Open Heart", colors: [{ hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
  ],
  "office-empathy-cozy": [
    { name: "Warm Embrace", colors: [{ hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Sunset Glow", colors: [{ hex: "#A67B5B", keyword: "Warm Taupe" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
    { name: "Cozy Bloom", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  ],
  "office-motivation-bright": [
    { name: "Bold Energy", colors: [{ hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#4A7C59", keyword: "Fresh Green" }] },
    { name: "Power Play", colors: [{ hex: "#3B5998", keyword: "Royal Blue" }, { hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Vibrant Start", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#4A7C59", keyword: "Fresh Green" }, { hex: "#3B5998", keyword: "Royal Blue" }] },
  ],
  "office-motivation-cozy": [
    { name: "Rich Drive", colors: [{ hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#8B3A2A", keyword: "Terracotta" }] },
    { name: "Deep Ambition", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "Warm Spark", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#E8DDD0", keyword: "Warm Cream" }, { hex: "#C73B6B", keyword: "Berry Pink" }] },
  ],
  "urban-assured-bright": [
    { name: "City Light", colors: [{ hex: "#B0C4D8", keyword: "City Sky" }, { hex: "#D5C8B8", keyword: "Champagne" }, { hex: "#8A9BAA", keyword: "Steel Blue" }] },
    { name: "Metro Clean", colors: [{ hex: "#E8D5C4", keyword: "Soft Peach" }, { hex: "#C0C0C0", keyword: "Silver Mesh" }, { hex: "#B0C4D8", keyword: "City Sky" }] },
    { name: "Urban Calm", colors: [{ hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#D5C8B8", keyword: "Champagne" }] },
  ],
  "urban-assured-cozy": [
    { name: "Street Warmth", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#6B7B8D", keyword: "Slate" }, { hex: "#8B4E3B", keyword: "Warm Bronze" }] },
    { name: "Downtown Edge", colors: [{ hex: "#3D3D3D", keyword: "Charcoal" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Evening Walk", colors: [{ hex: "#8B4E3B", keyword: "Warm Bronze" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }] },
  ],
  "urban-confidence-bright": [
    { name: "Power District", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#4A90C4", keyword: "Clear Sky" }, { hex: "#5A7D4A", keyword: "Forest Green" }] },
    { name: "Steel Edge", colors: [{ hex: "#C4B5A0", keyword: "Concrete Tan" }, { hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#8C7A68", keyword: "Warm Earth" }] },
    { name: "High Rise", colors: [{ hex: "#4A90C4", keyword: "Clear Sky" }, { hex: "#C0C0C0", keyword: "Silver" }, { hex: "#2B3A52", keyword: "Deep Navy" }] },
  ],
  "urban-confidence-cozy": [
    { name: "Midnight City", colors: [{ hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#8A6B4E", keyword: "Bronze" }] },
    { name: "Dark Alley", colors: [{ hex: "#4A4A4A", keyword: "Dark Gray" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Urban Night", colors: [{ hex: "#8A6B4E", keyword: "Bronze" }, { hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }] },
  ],
  "urban-empathy-bright": [
    { name: "Soft City", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#B0C4D8", keyword: "City Sky" }, { hex: "#8A9BAA", keyword: "Steel Blue" }] },
    { name: "Kind Streets", colors: [{ hex: "#E8D5C4", keyword: "Soft Peach" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Gentle Urban", colors: [{ hex: "#B0C4D8", keyword: "City Sky" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
  ],
  "urban-empathy-cozy": [
    { name: "Warm Corner", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#6B5B4E", keyword: "Mocha" }] },
    { name: "Café Light", colors: [{ hex: "#D8CFC0", keyword: "Warm Taupe" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
    { name: "Dusk Tones", colors: [{ hex: "#6B5B4E", keyword: "Mocha" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
  ],
  "urban-motivation-bright": [
    { name: "Street Bold", colors: [{ hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#4A90C4", keyword: "Clear Sky" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "City Pulse", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#C4B5A0", keyword: "Concrete Tan" }] },
    { name: "Electric Avenue", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#4A90C4", keyword: "Clear Sky" }, { hex: "#E84B2A", keyword: "Coral Red" }] },
  ],
  "urban-motivation-cozy": [
    { name: "Night Hustle", colors: [{ hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "After Dark", colors: [{ hex: "#3D3D3D", keyword: "Charcoal" }, { hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }] },
    { name: "Warm Neon", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#C4935A", keyword: "Amber" }] },
  ],
  "nature-assured-bright": [
    { name: "Forest Clearing", colors: [{ hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#A8C4E0", keyword: "Open Sky" }, { hex: "#8FB573", keyword: "Moss" }] },
    { name: "Meadow Calm", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
    { name: "Sky & Earth", colors: [{ hex: "#A8C4E0", keyword: "Open Sky" }, { hex: "#8FB573", keyword: "Moss" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
  ],
  "nature-assured-cozy": [
    { name: "Deep Woods", colors: [{ hex: "#5C7A3A", keyword: "Deep Moss" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Autumn Trail", colors: [{ hex: "#3D5A2E", keyword: "Forest" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Fireside", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#5C7A3A", keyword: "Deep Moss" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
  ],
  "nature-confidence-bright": [
    { name: "Mountain Peak", colors: [{ hex: "#2E5A3A", keyword: "Evergreen" }, { hex: "#A8C4E0", keyword: "Open Sky" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Strong Roots", colors: [{ hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#2E5A3A", keyword: "Evergreen" }] },
    { name: "Clear Vista", colors: [{ hex: "#A8C4E0", keyword: "Open Sky" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#6B8F5E", keyword: "Sage Green" }] },
  ],
  "nature-confidence-cozy": [
    { name: "Timber Lodge", colors: [{ hex: "#3D5A2E", keyword: "Forest" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#C4742A", keyword: "Burnt Orange" }] },
    { name: "Deep Trail", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#3D5A2E", keyword: "Forest" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Campfire", colors: [{ hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#3D5A2E", keyword: "Forest" }] },
  ],
  "nature-empathy-bright": [
    { name: "Garden Bloom", colors: [{ hex: "#8FB573", keyword: "Moss" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#A8C4E0", keyword: "Open Sky" }] },
    { name: "Spring Light", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#8FB573", keyword: "Moss" }, { hex: "#E8D5C4", keyword: "Soft Peach" }] },
    { name: "Wildflower", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#A8C4E0", keyword: "Open Sky" }, { hex: "#8FB573", keyword: "Moss" }] },
  ],
  "nature-empathy-cozy": [
    { name: "Woodland Soft", colors: [{ hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Autumn Rose", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
    { name: "Harvest Glow", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
  ],
  "nature-motivation-bright": [
    { name: "Wild Energy", colors: [{ hex: "#4A7C59", keyword: "Fresh Green" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#E84B2A", keyword: "Coral Red" }] },
    { name: "Sunrise Trail", colors: [{ hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#4A90C4", keyword: "Clear Sky" }, { hex: "#4A7C59", keyword: "Fresh Green" }] },
    { name: "Peak Day", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#4A7C59", keyword: "Fresh Green" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
  ],
  "nature-motivation-cozy": [
    { name: "Trailblazer", colors: [{ hex: "#5C7A3A", keyword: "Deep Moss" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "Fire & Forest", colors: [{ hex: "#3D5A2E", keyword: "Forest" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Dusk Hike", colors: [{ hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#5C7A3A", keyword: "Deep Moss" }, { hex: "#D4A24E", keyword: "Marigold" }] },
  ],
  "restaurant-assured-bright": [
    { name: "Fine Dining", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#A67B5B", keyword: "Warm Taupe" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Brunch Elegance", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#A67B5B", keyword: "Warm Taupe" }] },
    { name: "Light Table", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#8A9BAA", keyword: "Steel Blue" }] },
  ],
  "restaurant-assured-cozy": [
    { name: "Wine Bar", colors: [{ hex: "#8B3A2A", keyword: "Terracotta" }, { hex: "#D4A574", keyword: "Honey Gold" }, { hex: "#C4742A", keyword: "Burnt Orange" }] },
    { name: "Candlelit", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#D4A574", keyword: "Honey Gold" }] },
    { name: "Rustic Kitchen", colors: [{ hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#8B3A2A", keyword: "Terracotta" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  ],
  "restaurant-confidence-bright": [
    { name: "Chef's Table", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#A67B5B", keyword: "Warm Taupe" }] },
    { name: "Modern Plate", colors: [{ hex: "#C0C0C0", keyword: "Silver" }, { hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Clean Kitchen", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#A67B5B", keyword: "Warm Taupe" }, { hex: "#C0C0C0", keyword: "Silver" }] },
  ],
  "restaurant-confidence-cozy": [
    { name: "Dark Bistro", colors: [{ hex: "#3B2F2F", keyword: "Espresso" }, { hex: "#8B3A2A", keyword: "Terracotta" }, { hex: "#D4A574", keyword: "Honey Gold" }] },
    { name: "Speakeasy", colors: [{ hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#3B2F2F", keyword: "Espresso" }] },
    { name: "Old World", colors: [{ hex: "#D4A574", keyword: "Honey Gold" }, { hex: "#3B2F2F", keyword: "Espresso" }, { hex: "#8B3A2A", keyword: "Terracotta" }] },
  ],
  "restaurant-empathy-bright": [
    { name: "Garden Table", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#A67B5B", keyword: "Warm Taupe" }] },
    { name: "Tea Room", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8D5C4", keyword: "Soft Peach" }] },
    { name: "Patio Lunch", colors: [{ hex: "#E8D5C4", keyword: "Soft Peach" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
  ],
  "restaurant-empathy-cozy": [
    { name: "Hearth Side", colors: [{ hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Comfort Food", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#5C4033", keyword: "Dark Walnut" }] },
    { name: "Warm Kitchen", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  ],
  "restaurant-motivation-bright": [
    { name: "Chef's Fire", colors: [{ hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#4A7C59", keyword: "Fresh Green" }] },
    { name: "Market Fresh", colors: [{ hex: "#4A7C59", keyword: "Fresh Green" }, { hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Spice Rack", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#A67B5B", keyword: "Warm Taupe" }, { hex: "#E84B2A", keyword: "Coral Red" }] },
  ],
  "restaurant-motivation-cozy": [
    { name: "Night Kitchen", colors: [{ hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "Late Supper", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
    { name: "Ember Glow", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#C73B6B", keyword: "Berry Pink" }] },
  ],
  "workvan-assured-bright": [
    { name: "Open Road", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
    { name: "Clear Day", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#6B7B8D", keyword: "Slate" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Clean Build", colors: [{ hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#C0C0C0", keyword: "Silver" }] },
  ],
  "workvan-assured-cozy": [
    { name: "Workshop", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#5C4033", keyword: "Dark Walnut" }] },
    { name: "Tool Belt", colors: [{ hex: "#3D3D3D", keyword: "Charcoal" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Garage Light", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }] },
  ],
  "workvan-confidence-bright": [
    { name: "Steel Frame", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Blueprint", colors: [{ hex: "#C0C0C0", keyword: "Silver" }, { hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Precision", colors: [{ hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#2B3A52", keyword: "Deep Navy" }] },
  ],
  "workvan-confidence-cozy": [
    { name: "Iron Work", colors: [{ hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Forge", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#D8CFC0", keyword: "Warm Taupe" }, { hex: "#2D2D2D", keyword: "Charcoal" }] },
    { name: "Welded", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
  ],
  "workvan-empathy-bright": [
    { name: "Helping Hand", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#8A9BAA", keyword: "Steel Blue" }] },
    { name: "Community", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8D5C4", keyword: "Soft Peach" }] },
    { name: "Kind Work", colors: [{ hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
  ],
  "workvan-empathy-cozy": [
    { name: "Warm Hands", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Home Built", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#5C4033", keyword: "Dark Walnut" }] },
    { name: "Craft Love", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  ],
  "workvan-motivation-bright": [
    { name: "Job Ready", colors: [{ hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#8A9BAA", keyword: "Steel Blue" }] },
    { name: "Hustle Hard", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Go Time", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#E84B2A", keyword: "Coral Red" }] },
  ],
  "workvan-motivation-cozy": [
    { name: "Night Shift", colors: [{ hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "Late Build", colors: [{ hex: "#3D3D3D", keyword: "Charcoal" }, { hex: "#C73B6B", keyword: "Berry Pink" }, { hex: "#5C4033", keyword: "Dark Walnut" }] },
    { name: "Warm Drive", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#C73B6B", keyword: "Berry Pink" }] },
  ],
  "suburban-assured-bright": [
    { name: "Front Porch", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#8FB573", keyword: "Moss" }, { hex: "#A8C4E0", keyword: "Powder Blue" }] },
    { name: "Garden Path", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#8FB573", keyword: "Moss" }] },
    { name: "Sunny Lawn", colors: [{ hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#8FB573", keyword: "Moss" }] },
  ],
  "suburban-assured-cozy": [
    { name: "Home Hearth", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Back Deck", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#6B8F5E", keyword: "Sage Green" }] },
    { name: "Warm Study", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  ],
  "suburban-confidence-bright": [
    { name: "Corner Office", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#8FB573", keyword: "Moss" }, { hex: "#D4B896", keyword: "Warm Sand" }] },
    { name: "Home Pro", colors: [{ hex: "#C0C0C0", keyword: "Silver" }, { hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Clean Lines", colors: [{ hex: "#8FB573", keyword: "Moss" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#2B3A52", keyword: "Deep Navy" }] },
  ],
  "suburban-confidence-cozy": [
    { name: "Den Study", colors: [{ hex: "#3B2F2F", keyword: "Espresso" }, { hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Library Nook", colors: [{ hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#3B2F2F", keyword: "Espresso" }] },
    { name: "Fireplace", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#5C4033", keyword: "Dark Walnut" }] },
  ],
  "suburban-empathy-bright": [
    { name: "Window Seat", colors: [{ hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#8FB573", keyword: "Moss" }, { hex: "#A8C4E0", keyword: "Powder Blue" }] },
    { name: "Morning Room", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8D5C4", keyword: "Soft Peach" }] },
    { name: "Soft Garden", colors: [{ hex: "#8FB573", keyword: "Moss" }, { hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#D4A5A0", keyword: "Blush Rose" }] },
  ],
  "suburban-empathy-cozy": [
    { name: "Knit Blanket", colors: [{ hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Home Bloom", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#6B8F5E", keyword: "Sage Green" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
    { name: "Cozy Corner", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#D4A5A0", keyword: "Blush Rose" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  ],
  "suburban-motivation-bright": [
    { name: "Launch Pad", colors: [{ hex: "#4A7C59", keyword: "Fresh Green" }, { hex: "#D4A24E", keyword: "Marigold" }, { hex: "#E84B2A", keyword: "Coral Red" }] },
    { name: "Bright Future", colors: [{ hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#E84B2A", keyword: "Coral Red" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Go Getter", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#4A7C59", keyword: "Fresh Green" }, { hex: "#A8C4E0", keyword: "Powder Blue" }] },
  ],
  "suburban-motivation-cozy": [
    { name: "Side Hustle", colors: [{ hex: "#5C7A3A", keyword: "Deep Moss" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#D4A24E", keyword: "Marigold" }] },
    { name: "Night Grind", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#5C7A3A", keyword: "Deep Moss" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
    { name: "Warm Focus", colors: [{ hex: "#D4A24E", keyword: "Marigold" }, { hex: "#C4742A", keyword: "Burnt Orange" }, { hex: "#8B6F4E", keyword: "Caramel" }] },
  ],
};

const emotionalFallback: Record<string, PaletteOption[]> = {
  bright: [
    { name: "Fresh Start", colors: [{ hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#6B8F5E", keyword: "Sage Green" }] },
    { name: "Clean Air", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#8A9BAA", keyword: "Steel Blue" }] },
    { name: "Day Break", colors: [{ hex: "#A8C4E0", keyword: "Powder Blue" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#8FB573", keyword: "Moss" }] },
  ],
  cozy: [
    { name: "Warm Glow", colors: [{ hex: "#C4935A", keyword: "Amber" }, { hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#5C4033", keyword: "Dark Walnut" }] },
    { name: "Fireside", colors: [{ hex: "#D4A574", keyword: "Honey Gold" }, { hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#C4935A", keyword: "Amber" }] },
    { name: "Cabin Warmth", colors: [{ hex: "#8B6F4E", keyword: "Caramel" }, { hex: "#5C4033", keyword: "Dark Walnut" }, { hex: "#D4A574", keyword: "Honey Gold" }] },
  ],
  powerful: [
    { name: "Authority", colors: [{ hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#C0C0C0", keyword: "Silver" }] },
    { name: "Titan", colors: [{ hex: "#8C7A68", keyword: "Warm Earth" }, { hex: "#2B3A52", keyword: "Deep Navy" }, { hex: "#F5F0E8", keyword: "Warm White" }] },
    { name: "Iron", colors: [{ hex: "#2D2D2D", keyword: "Charcoal" }, { hex: "#C0C0C0", keyword: "Silver" }, { hex: "#8C7A68", keyword: "Warm Earth" }] },
  ],
  cinematic: [
    { name: "Film Noir", colors: [{ hex: "#1A1A2E", keyword: "Midnight" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#2B3A52", keyword: "Deep Navy" }] },
    { name: "Golden Hour", colors: [{ hex: "#D4A574", keyword: "Honey Gold" }, { hex: "#1A1A2E", keyword: "Midnight" }, { hex: "#4A4A4A", keyword: "Dark Gray" }] },
    { name: "Silver Screen", colors: [{ hex: "#4A4A4A", keyword: "Dark Gray" }, { hex: "#C4935A", keyword: "Amber" }, { hex: "#1A1A2E", keyword: "Midnight" }] },
  ],
};

const genericFallback: PaletteOption[] = [
  { name: "Classic", colors: [{ hex: "#E8DFD5", keyword: "Soft Linen" }, { hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#6B8F5E", keyword: "Sage Green" }] },
  { name: "Warm Natural", colors: [{ hex: "#D4B896", keyword: "Warm Sand" }, { hex: "#A67B5B", keyword: "Warm Taupe" }, { hex: "#E8DFD5", keyword: "Soft Linen" }] },
  { name: "Cool Tone", colors: [{ hex: "#8A9BAA", keyword: "Steel Blue" }, { hex: "#F5F0E8", keyword: "Warm White" }, { hex: "#A8C4E0", keyword: "Powder Blue" }] },
];

export function getRecommendedPalettes(
  environment: string | null,
  brandMessage: string | null,
  emotionalImpact: string | null
): PaletteOption[] {
  if (environment && brandMessage && emotionalImpact) {
    const key = `${environment}-${brandMessage}-${emotionalImpact}`;
    if (palettes[key]) return palettes[key];
  }

  if (emotionalImpact && emotionalFallback[emotionalImpact]) {
    return emotionalFallback[emotionalImpact];
  }

  return genericFallback;
}
