import type { ColorSwatch } from "@shared/schema";

export interface PaletteOption {
  name: string;
  colors: ColorSwatch[];
}

const palettes: Record<string, PaletteOption[]> = {
  "office-assured-bright": [
    { name: "Frost & Pearl", colors: [{ hex: "#C8D8E8", keyword: "Icy Periwinkle" }, { hex: "#F0EDE6", keyword: "Pearl Cream" }, { hex: "#9BAAAD", keyword: "Dove Gray" }] },
    { name: "Oat & Sage", colors: [{ hex: "#B5BFA1", keyword: "Smoked Sage" }, { hex: "#E6DDD0", keyword: "Warm Oat" }, { hex: "#D4C490", keyword: "Soft Gold" }] },
    { name: "Blush Minimal", colors: [{ hex: "#F7F3EE", keyword: "Alabaster" }, { hex: "#D9B8B0", keyword: "Clay Rose" }, { hex: "#5A5E62", keyword: "Graphite" }] },
  ],
  "office-assured-cozy": [
    { name: "Cognac Study", colors: [{ hex: "#7A3B2E", keyword: "Burnt Sienna" }, { hex: "#C89F6D", keyword: "Aged Brass" }, { hex: "#3C2415", keyword: "Dark Mahogany" }] },
    { name: "Olive Library", colors: [{ hex: "#6B6B3A", keyword: "Olive Drab" }, { hex: "#D4BFA0", keyword: "Parchment" }, { hex: "#8E7055", keyword: "Toffee" }] },
    { name: "Ember & Plum", colors: [{ hex: "#9C4A5B", keyword: "Crushed Raspberry" }, { hex: "#E8D5C0", keyword: "Toasted Cream" }, { hex: "#6E4B3A", keyword: "Roasted Chestnut" }] },
  ],
  "office-confidence-bright": [
    { name: "Arctic Edge", colors: [{ hex: "#1E3456", keyword: "Midnight Cobalt" }, { hex: "#E8EDF2", keyword: "Ice Blue" }, { hex: "#A8B8C8", keyword: "Cool Slate" }] },
    { name: "Steel & Mint", colors: [{ hex: "#4A6B5A", keyword: "Eucalyptus" }, { hex: "#F5F2ED", keyword: "White Linen" }, { hex: "#7D8E94", keyword: "Brushed Steel" }] },
    { name: "Onyx Crisp", colors: [{ hex: "#2A2A2E", keyword: "Jet Black" }, { hex: "#FAFAF7", keyword: "Bright White" }, { hex: "#B0A899", keyword: "Stone Tan" }] },
  ],
  "office-confidence-cozy": [
    { name: "Boardroom Noir", colors: [{ hex: "#2C1F1A", keyword: "Rich Espresso" }, { hex: "#B88B4A", keyword: "Polished Brass" }, { hex: "#5C4836", keyword: "Walnut Shell" }] },
    { name: "Oxblood Prestige", colors: [{ hex: "#5A1E28", keyword: "Oxblood" }, { hex: "#D8C8B4", keyword: "Sandstone" }, { hex: "#3D3530", keyword: "Smoky Umber" }] },
    { name: "Charcoal & Copper", colors: [{ hex: "#3A3A3C", keyword: "Anthracite" }, { hex: "#C87941", keyword: "Hammered Copper" }, { hex: "#E8DFCE", keyword: "Antique Ivory" }] },
  ],
  "office-empathy-bright": [
    { name: "Morning Dew", colors: [{ hex: "#C2D5C6", keyword: "Soft Celadon" }, { hex: "#F2E8E0", keyword: "Peach Whisper" }, { hex: "#A8B4C8", keyword: "Dusty Periwinkle" }] },
    { name: "Petal Breeze", colors: [{ hex: "#E0B8C4", keyword: "Vintage Rose" }, { hex: "#F5F0E0", keyword: "Buttermilk" }, { hex: "#94B8A0", keyword: "Seafoam" }] },
    { name: "Cloud Lavender", colors: [{ hex: "#C4B8D8", keyword: "Pale Wisteria" }, { hex: "#F0EDE8", keyword: "Soft Cloud" }, { hex: "#B8C4B0", keyword: "Misted Fern" }] },
  ],
  "office-empathy-cozy": [
    { name: "Velvet Warmth", colors: [{ hex: "#A85A4A", keyword: "Baked Clay" }, { hex: "#DBBFA8", keyword: "Chamois" }, { hex: "#7D5F4E", keyword: "Milk Chocolate" }] },
    { name: "Rose & Cinnamon", colors: [{ hex: "#B07878", keyword: "Dusty Mauve" }, { hex: "#E5D4C0", keyword: "Vanilla Bean" }, { hex: "#8A5C3C", keyword: "Warm Cinnamon" }] },
    { name: "Heather Dusk", colors: [{ hex: "#8E6E7A", keyword: "Plum Shadow" }, { hex: "#F0E0D2", keyword: "Bisque" }, { hex: "#6B7A60", keyword: "Dried Herb" }] },
  ],
  "office-motivation-bright": [
    { name: "Citrus Spark", colors: [{ hex: "#E8943A", keyword: "Tangerine" }, { hex: "#4AA882", keyword: "Kelly Green" }, { hex: "#F5EDE0", keyword: "Cream Silk" }] },
    { name: "Electric Clarity", colors: [{ hex: "#3468B2", keyword: "Vivid Cobalt" }, { hex: "#E8C840", keyword: "Sunflower" }, { hex: "#F0F0EC", keyword: "Bright Pearl" }] },
    { name: "Coral Charge", colors: [{ hex: "#D65A4A", keyword: "Poppy Red" }, { hex: "#45A0B8", keyword: "Ocean Aqua" }, { hex: "#F8F0E2", keyword: "Warm Cloud" }] },
  ],
  "office-motivation-cozy": [
    { name: "Burgundy Drive", colors: [{ hex: "#7A2840", keyword: "Deep Garnet" }, { hex: "#D4A040", keyword: "Honeyed Amber" }, { hex: "#4A3028", keyword: "Dark Cocoa" }] },
    { name: "Saffron & Plum", colors: [{ hex: "#C88C28", keyword: "Rich Saffron" }, { hex: "#6A3464", keyword: "Blackberry" }, { hex: "#E0CEB8", keyword: "Wheat" }] },
    { name: "Fire & Earth", colors: [{ hex: "#BE4830", keyword: "Brick Red" }, { hex: "#5A6848", keyword: "Moss Olive" }, { hex: "#D8B88C", keyword: "Golden Straw" }] },
  ],
  "urban-assured-bright": [
    { name: "Concrete Mist", colors: [{ hex: "#B4BCC4", keyword: "Silver Fog" }, { hex: "#E8E2D8", keyword: "Limestone" }, { hex: "#7A8A92", keyword: "Weathered Zinc" }] },
    { name: "Metro Frost", colors: [{ hex: "#C4D4E0", keyword: "Winter Sky" }, { hex: "#F0EBE2", keyword: "Raw Canvas" }, { hex: "#A0A89C", keyword: "Patina Green" }] },
    { name: "Glass & Stone", colors: [{ hex: "#8A9498", keyword: "Wet Concrete" }, { hex: "#F4F0EA", keyword: "Paper White" }, { hex: "#B8AEA0", keyword: "Sidewalk Taupe" }] },
  ],
  "urban-assured-cozy": [
    { name: "Brick Lane", colors: [{ hex: "#8E4A38", keyword: "Fired Brick" }, { hex: "#C4A878", keyword: "Aged Gold" }, { hex: "#504038", keyword: "Dark Leather" }] },
    { name: "Midnight Café", colors: [{ hex: "#3A3430", keyword: "Smoked Oak" }, { hex: "#D4C0A8", keyword: "Café Latte" }, { hex: "#7A6854", keyword: "Worn Suede" }] },
    { name: "Copper Alley", colors: [{ hex: "#B87040", keyword: "Oxidized Copper" }, { hex: "#E0D4C4", keyword: "City Cream" }, { hex: "#5E5048", keyword: "Asphalt Brown" }] },
  ],
  "urban-confidence-bright": [
    { name: "Skyline Blue", colors: [{ hex: "#1A3050", keyword: "Harbor Navy" }, { hex: "#6AAAC4", keyword: "Urban Teal" }, { hex: "#E8E4DE", keyword: "Cement Wash" }] },
    { name: "Chrome District", colors: [{ hex: "#A8A8A8", keyword: "Polished Chrome" }, { hex: "#2E3844", keyword: "Storm Navy" }, { hex: "#D0C8BC", keyword: "Travertine" }] },
    { name: "Apex Tower", colors: [{ hex: "#3C5A48", keyword: "Dark Spruce" }, { hex: "#F0ECE6", keyword: "Bone White" }, { hex: "#505860", keyword: "Gunmetal" }] },
  ],
  "urban-confidence-cozy": [
    { name: "Noir District", colors: [{ hex: "#1C1C20", keyword: "Pitch Black" }, { hex: "#B8944C", keyword: "Old Gold" }, { hex: "#5C4E42", keyword: "Coffee Grounds" }] },
    { name: "Dark Denim", colors: [{ hex: "#2A3040", keyword: "Indigo Ink" }, { hex: "#C8B498", keyword: "Toasted Almond" }, { hex: "#4A3E34", keyword: "Dark Umber" }] },
    { name: "Iron & Ember", colors: [{ hex: "#3C3C3C", keyword: "Forged Iron" }, { hex: "#C07A3A", keyword: "Burnt Caramel" }, { hex: "#E4D8C8", keyword: "Smoked Cream" }] },
  ],
  "urban-empathy-bright": [
    { name: "Pastel District", colors: [{ hex: "#D4A8B4", keyword: "Faded Peony" }, { hex: "#B8C8D4", keyword: "Rain Wash" }, { hex: "#E8E0D4", keyword: "Cotton" }] },
    { name: "Rooftop Garden", colors: [{ hex: "#A8C0A4", keyword: "City Sage" }, { hex: "#F0E8E0", keyword: "Soft Plaster" }, { hex: "#C8B4A8", keyword: "Sandwashed" }] },
    { name: "Window Light", colors: [{ hex: "#C8C0D4", keyword: "Pale Lilac" }, { hex: "#F4EEE6", keyword: "Morning Paper" }, { hex: "#A8B0A0", keyword: "Lichen Gray" }] },
  ],
  "urban-empathy-cozy": [
    { name: "Brownstone", colors: [{ hex: "#8A5E48", keyword: "Terra Firma" }, { hex: "#D8B8A4", keyword: "Blush Sand" }, { hex: "#6A6058", keyword: "Storm Taupe" }] },
    { name: "Candlelit Loft", colors: [{ hex: "#B08878", keyword: "Adobe Rose" }, { hex: "#E8DCC8", keyword: "Warm Parchment" }, { hex: "#5A5040", keyword: "Umber Shadow" }] },
    { name: "Muted Terrace", colors: [{ hex: "#9A7A6A", keyword: "Dried Fig" }, { hex: "#C8B8A0", keyword: "Raffia" }, { hex: "#7A6E64", keyword: "Stone Gray" }] },
  ],
  "urban-motivation-bright": [
    { name: "Neon Rush", colors: [{ hex: "#E05830", keyword: "Signal Orange" }, { hex: "#2896B4", keyword: "Electric Cyan" }, { hex: "#F4EEE4", keyword: "Gallery White" }] },
    { name: "Graffiti Pulse", colors: [{ hex: "#C83860", keyword: "Hot Magenta" }, { hex: "#E8C438", keyword: "Chrome Yellow" }, { hex: "#3A4A5A", keyword: "Deep Slate" }] },
    { name: "Street Voltage", colors: [{ hex: "#4AA060", keyword: "Neon Clover" }, { hex: "#D44A2A", keyword: "Fire Engine" }, { hex: "#F0E8DA", keyword: "Chalk White" }] },
  ],
  "urban-motivation-cozy": [
    { name: "Late Night Hustle", colors: [{ hex: "#9A2848", keyword: "Cranberry" }, { hex: "#C8A040", keyword: "Burnished Gold" }, { hex: "#3A2A28", keyword: "Bitter Chocolate" }] },
    { name: "Underground", colors: [{ hex: "#2C2C30", keyword: "Jet Onyx" }, { hex: "#D47030", keyword: "Rust Orange" }, { hex: "#8A7A68", keyword: "Clay Loam" }] },
    { name: "Warehouse Glow", colors: [{ hex: "#B85028", keyword: "Terracotta Blaze" }, { hex: "#5A5448", keyword: "Industrial Gray" }, { hex: "#DCC070", keyword: "Vintage Mustard" }] },
  ],
  "nature-assured-bright": [
    { name: "Birch & Sky", colors: [{ hex: "#92B4A0", keyword: "Silver Birch" }, { hex: "#C8DAE8", keyword: "High Sky" }, { hex: "#E4DDD0", keyword: "Driftwood" }] },
    { name: "Meadow Morning", colors: [{ hex: "#B8C890", keyword: "Spring Grass" }, { hex: "#F0EAD8", keyword: "Hay Gold" }, { hex: "#8AA898", keyword: "River Jade" }] },
    { name: "Soft Shoreline", colors: [{ hex: "#D4C8B0", keyword: "Beach Sand" }, { hex: "#A8C8D0", keyword: "Tide Pool" }, { hex: "#C4D0B8", keyword: "Willow" }] },
  ],
  "nature-assured-cozy": [
    { name: "Forest Floor", colors: [{ hex: "#4A5A30", keyword: "Deep Fern" }, { hex: "#B89058", keyword: "Acorn" }, { hex: "#7A6040", keyword: "Bark Brown" }] },
    { name: "Harvest Hearth", colors: [{ hex: "#8A5230", keyword: "Raw Umber" }, { hex: "#C4A870", keyword: "Wheat Sheaf" }, { hex: "#5C6A40", keyword: "Olive Grove" }] },
    { name: "Woodland Ember", colors: [{ hex: "#6A4830", keyword: "Pecan Shell" }, { hex: "#D4B090", keyword: "Dried Honey" }, { hex: "#484A38", keyword: "Pine Bark" }] },
  ],
  "nature-confidence-bright": [
    { name: "Summit View", colors: [{ hex: "#2A4A38", keyword: "Deep Evergreen" }, { hex: "#C8D8D0", keyword: "Mountain Mist" }, { hex: "#E0D8C4", keyword: "Limestone Bluff" }] },
    { name: "River Stone", colors: [{ hex: "#6A8A78", keyword: "Jade Creek" }, { hex: "#F0EAE0", keyword: "Quartz White" }, { hex: "#4A5A4A", keyword: "Forest Shadow" }] },
    { name: "Eagle Ridge", colors: [{ hex: "#384848", keyword: "Slate Spruce" }, { hex: "#B8C4A8", keyword: "Lichen Moss" }, { hex: "#D8D0C0", keyword: "Pale Sandstone" }] },
  ],
  "nature-confidence-cozy": [
    { name: "Timber Stronghold", colors: [{ hex: "#3A4E2C", keyword: "Dark Moss" }, { hex: "#8E6840", keyword: "Toasted Oak" }, { hex: "#B87438", keyword: "Copper Leaf" }] },
    { name: "Granite Lodge", colors: [{ hex: "#504840", keyword: "River Rock" }, { hex: "#3A5430", keyword: "Hemlock" }, { hex: "#C4A880", keyword: "Buckwheat" }] },
    { name: "Ancient Oak", colors: [{ hex: "#5A3E2A", keyword: "Heartwood" }, { hex: "#7A8A58", keyword: "Wild Sage" }, { hex: "#D4BA90", keyword: "Honeyed Pine" }] },
  ],
  "nature-empathy-bright": [
    { name: "Wildflower Dell", colors: [{ hex: "#C4A8B0", keyword: "Wild Orchid" }, { hex: "#A8C8A4", keyword: "Soft Fern" }, { hex: "#E4DED4", keyword: "Eggshell" }] },
    { name: "Butterfly Garden", colors: [{ hex: "#B8C4D8", keyword: "Forget-Me-Not" }, { hex: "#D8C8A0", keyword: "Honeycomb" }, { hex: "#A0B890", keyword: "Clover" }] },
    { name: "Spring Brook", colors: [{ hex: "#98C0B8", keyword: "Cool Mint" }, { hex: "#E8D0C4", keyword: "Peach Blossom" }, { hex: "#C0D0A0", keyword: "New Leaf" }] },
  ],
  "nature-empathy-cozy": [
    { name: "Mushroom Forest", colors: [{ hex: "#8A7A5E", keyword: "Chanterelle" }, { hex: "#C8A890", keyword: "Soft Cedar" }, { hex: "#5A7050", keyword: "Fiddlehead" }] },
    { name: "Autumn Wildflower", colors: [{ hex: "#B87868", keyword: "Dried Rose Hip" }, { hex: "#90A470", keyword: "Meadow Green" }, { hex: "#D8C4A8", keyword: "Oat Straw" }] },
    { name: "Fireweed Trail", colors: [{ hex: "#9A5A58", keyword: "Berry Bramble" }, { hex: "#B4A478", keyword: "Goldenrod" }, { hex: "#6A7A58", keyword: "Moss Carpet" }] },
  ],
  "nature-motivation-bright": [
    { name: "Sunrise Peak", colors: [{ hex: "#E08838", keyword: "Mountain Sunrise" }, { hex: "#3E8A5A", keyword: "Vibrant Fern" }, { hex: "#F0E8D8", keyword: "Morning Frost" }] },
    { name: "River Rapid", colors: [{ hex: "#2A7A9A", keyword: "Rapids Blue" }, { hex: "#C8B030", keyword: "Wild Mustard" }, { hex: "#58A868", keyword: "Spring Meadow" }] },
    { name: "Tropic Canopy", colors: [{ hex: "#D85A28", keyword: "Flame Lily" }, { hex: "#288870", keyword: "Tropical Green" }, { hex: "#E8D8B0", keyword: "Vanilla Bark" }] },
  ],
  "nature-motivation-cozy": [
    { name: "Bonfire Night", colors: [{ hex: "#A04020", keyword: "Ember Glow" }, { hex: "#5A6E30", keyword: "Woodland Olive" }, { hex: "#D4A050", keyword: "Toasted Maize" }] },
    { name: "Autumn Trail", colors: [{ hex: "#7A4420", keyword: "Fallen Acorn" }, { hex: "#B88C28", keyword: "Harvest Gold" }, { hex: "#4A5A34", keyword: "Spruce Needle" }] },
    { name: "Wild Campfire", colors: [{ hex: "#C46028", keyword: "Campfire Orange" }, { hex: "#6A5028", keyword: "Smoked Bark" }, { hex: "#8A9A48", keyword: "Fresh Lichen" }] },
  ],
  "restaurant-assured-bright": [
    { name: "Farmhouse Table", colors: [{ hex: "#E4DCC8", keyword: "Unbleached Linen" }, { hex: "#A09480", keyword: "Natural Clay" }, { hex: "#C8C4B0", keyword: "Pale Rye" }] },
    { name: "White Porcelain", colors: [{ hex: "#F4F0E8", keyword: "Fine China" }, { hex: "#B0A898", keyword: "Silver Sage" }, { hex: "#D4C4A8", keyword: "Sweet Butter" }] },
    { name: "Seaside Brunch", colors: [{ hex: "#A8C0C8", keyword: "Sea Glass" }, { hex: "#E8DED0", keyword: "Cream Linen" }, { hex: "#B8B0A0", keyword: "Warm Ash" }] },
  ],
  "restaurant-assured-cozy": [
    { name: "Tuscan Table", colors: [{ hex: "#9A4A30", keyword: "Sun-Dried Tomato" }, { hex: "#D4AA60", keyword: "Olive Oil Gold" }, { hex: "#5E4030", keyword: "Espresso Bean" }] },
    { name: "Whiskey & Walnut", colors: [{ hex: "#6A4428", keyword: "Barrel Oak" }, { hex: "#E0CEB0", keyword: "Aged Cream" }, { hex: "#8A6838", keyword: "Rye Whiskey" }] },
    { name: "Red Wine Evening", colors: [{ hex: "#5A2030", keyword: "Merlot" }, { hex: "#C8A880", keyword: "Bread Crust" }, { hex: "#7A5E48", keyword: "Cocoa Nib" }] },
  ],
  "restaurant-confidence-bright": [
    { name: "Michelin White", colors: [{ hex: "#1C2840", keyword: "Napkin Navy" }, { hex: "#F4F0E8", keyword: "Bone China" }, { hex: "#A8A098", keyword: "Pewter" }] },
    { name: "Clean Slate", colors: [{ hex: "#505860", keyword: "Chef Gray" }, { hex: "#E8E0D4", keyword: "Table Linen" }, { hex: "#8A9490", keyword: "Cool Sage" }] },
    { name: "Marble Counter", colors: [{ hex: "#F0ECE4", keyword: "Marble White" }, { hex: "#3A4450", keyword: "Dark Steel" }, { hex: "#C0B4A4", keyword: "Travertine Tan" }] },
  ],
  "restaurant-confidence-cozy": [
    { name: "Speakeasy Velvet", colors: [{ hex: "#2A1E1A", keyword: "Black Coffee" }, { hex: "#A06830", keyword: "Aged Brandy" }, { hex: "#D4B890", keyword: "Candlelight" }] },
    { name: "Dark Tasting Room", colors: [{ hex: "#3C2028", keyword: "Cabernet" }, { hex: "#B89460", keyword: "Smoked Honey" }, { hex: "#4A4038", keyword: "Charred Wood" }] },
    { name: "Omakase Night", colors: [{ hex: "#282830", keyword: "Lacquer Black" }, { hex: "#C49838", keyword: "Soy Glaze" }, { hex: "#605848", keyword: "Bamboo Charcoal" }] },
  ],
  "restaurant-empathy-bright": [
    { name: "Garden Patio", colors: [{ hex: "#D0AEA4", keyword: "Sun-Warmed Clay" }, { hex: "#C4D0B8", keyword: "Fresh Basil" }, { hex: "#F0E8DC", keyword: "Whipped Cream" }] },
    { name: "Afternoon Tea", colors: [{ hex: "#C8B0C0", keyword: "Earl Grey" }, { hex: "#F2EAE0", keyword: "Scone Cream" }, { hex: "#B4C4A8", keyword: "Mint Leaf" }] },
    { name: "Sunny Bistro", colors: [{ hex: "#E0C8A0", keyword: "Croissant Gold" }, { hex: "#F4EEE6", keyword: "Cream Silk" }, { hex: "#A8B4A0", keyword: "Herb Garden" }] },
  ],
  "restaurant-empathy-cozy": [
    { name: "Nonna's Kitchen", colors: [{ hex: "#A86048", keyword: "Baked Terracotta" }, { hex: "#D8C0A4", keyword: "Warm Focaccia" }, { hex: "#6E6050", keyword: "Smoked Paprika" }] },
    { name: "Comfort Stew", colors: [{ hex: "#8A6448", keyword: "Brown Butter" }, { hex: "#C4A47A", keyword: "Golden Broth" }, { hex: "#B08878", keyword: "Rustic Pink" }] },
    { name: "Hearth & Herbs", colors: [{ hex: "#6A7450", keyword: "Dried Thyme" }, { hex: "#D4B898", keyword: "Sourdough" }, { hex: "#946858", keyword: "Paprika Dust" }] },
  ],
  "restaurant-motivation-bright": [
    { name: "Spice Market", colors: [{ hex: "#D85830", keyword: "Chili Pepper" }, { hex: "#E8B830", keyword: "Turmeric" }, { hex: "#2A8A58", keyword: "Fresh Cilantro" }] },
    { name: "Farm to Table", colors: [{ hex: "#48A060", keyword: "Garden Kale" }, { hex: "#D44838", keyword: "Ripe Tomato" }, { hex: "#F4E8D0", keyword: "Flour Dust" }] },
    { name: "Tropical Plate", colors: [{ hex: "#E08828", keyword: "Mango" }, { hex: "#B03848", keyword: "Dragon Fruit" }, { hex: "#E8E0D0", keyword: "Coconut Milk" }] },
  ],
  "restaurant-motivation-cozy": [
    { name: "Charcoal Grill", colors: [{ hex: "#3A3030", keyword: "Smoke Char" }, { hex: "#D46828", keyword: "Sriracha" }, { hex: "#C4A048", keyword: "Corn Gold" }] },
    { name: "Tandoori Night", colors: [{ hex: "#B83828", keyword: "Tandoori Red" }, { hex: "#C89038", keyword: "Turmeric Root" }, { hex: "#5A4030", keyword: "Dark Cumin" }] },
    { name: "Harvest Feast", colors: [{ hex: "#7A4020", keyword: "Roasted Pecan" }, { hex: "#A86840", keyword: "Pumpkin Spice" }, { hex: "#D8BA70", keyword: "Cornbread" }] },
  ],
  "workvan-assured-bright": [
    { name: "Clean Concrete", colors: [{ hex: "#C0C4C0", keyword: "Fresh Cement" }, { hex: "#E4DED4", keyword: "Work Canvas" }, { hex: "#8C9498", keyword: "Galvanized" }] },
    { name: "Open Highway", colors: [{ hex: "#A8B8C8", keyword: "Clear Horizon" }, { hex: "#D8D0C0", keyword: "Desert Tan" }, { hex: "#90988C", keyword: "Sage Dust" }] },
    { name: "Blueprint White", colors: [{ hex: "#E8E4DC", keyword: "Drafting Paper" }, { hex: "#7A8A98", keyword: "Steel Pipe" }, { hex: "#B4ACA0", keyword: "Raw Plaster" }] },
  ],
  "workvan-assured-cozy": [
    { name: "Sawdust & Stain", colors: [{ hex: "#7A5838", keyword: "Wood Stain" }, { hex: "#C49C68", keyword: "Sawdust Gold" }, { hex: "#4A3828", keyword: "Dark Timber" }] },
    { name: "Old Garage", colors: [{ hex: "#504844", keyword: "Grease Stain" }, { hex: "#B8A488", keyword: "Shop Cloth" }, { hex: "#8A7058", keyword: "Oil Leather" }] },
    { name: "Copper Pipe", colors: [{ hex: "#A06838", keyword: "Aged Copper" }, { hex: "#D4C0A4", keyword: "Workshop Cream" }, { hex: "#5A5048", keyword: "Tool Steel" }] },
  ],
  "workvan-confidence-bright": [
    { name: "Blueprint Bold", colors: [{ hex: "#1A3048", keyword: "Deep Blueprint" }, { hex: "#98A8B8", keyword: "Cold Steel" }, { hex: "#D8D4C8", keyword: "Concrete Pale" }] },
    { name: "Hardhat Edge", colors: [{ hex: "#D4A020", keyword: "Safety Yellow" }, { hex: "#3A4450", keyword: "Dark Utility" }, { hex: "#E4E0D8", keyword: "White Primer" }] },
    { name: "Structural Gray", colors: [{ hex: "#6A7078", keyword: "Rebar Gray" }, { hex: "#F0ECE4", keyword: "Plaster White" }, { hex: "#2A3A48", keyword: "Deep Iron" }] },
  ],
  "workvan-confidence-cozy": [
    { name: "Anvil Dark", colors: [{ hex: "#2A2828", keyword: "Blacksmith" }, { hex: "#A07840", keyword: "Burnished Bronze" }, { hex: "#6A5C48", keyword: "Old Leather" }] },
    { name: "Forge Heat", colors: [{ hex: "#4A3A30", keyword: "Charred Walnut" }, { hex: "#C88838", keyword: "Molten Brass" }, { hex: "#D4C0A8", keyword: "Sandpaper" }] },
    { name: "Welding Spark", colors: [{ hex: "#383838", keyword: "Cast Iron" }, { hex: "#B87028", keyword: "Arc Orange" }, { hex: "#8A8078", keyword: "Weld Slag" }] },
  ],
  "workvan-empathy-bright": [
    { name: "Friendly Fix", colors: [{ hex: "#B8C0B4", keyword: "Soft Putty" }, { hex: "#E0D4C4", keyword: "Painter's Drop" }, { hex: "#A0A8B4", keyword: "Light Nickel" }] },
    { name: "Community Build", colors: [{ hex: "#C8B8A8", keyword: "Warm Mortar" }, { hex: "#A8C0B8", keyword: "Gentle Verdigris" }, { hex: "#F0E8DE", keyword: "Fresh Gesso" }] },
    { name: "Helper's Hand", colors: [{ hex: "#C4ACA0", keyword: "Sandstone Pink" }, { hex: "#B0B8A8", keyword: "Celadon Mist" }, { hex: "#E8E0D4", keyword: "Soft Primer" }] },
  ],
  "workvan-empathy-cozy": [
    { name: "Worn Gloves", colors: [{ hex: "#8E6848", keyword: "Work Leather" }, { hex: "#C8AA88", keyword: "Suede Tan" }, { hex: "#6A6058", keyword: "Weathered Brown" }] },
    { name: "Porch Repair", colors: [{ hex: "#7A7060", keyword: "Reclaimed Wood" }, { hex: "#D4BAA0", keyword: "Old Paint" }, { hex: "#9A7A5A", keyword: "Hemp Rope" }] },
    { name: "Trusted Tools", colors: [{ hex: "#A07858", keyword: "Saddle Leather" }, { hex: "#B8A888", keyword: "Canvas Sack" }, { hex: "#5A5448", keyword: "Worn Handle" }] },
  ],
  "workvan-motivation-bright": [
    { name: "Job Site Energy", colors: [{ hex: "#D85020", keyword: "Construction Orange" }, { hex: "#D8B830", keyword: "Caution Yellow" }, { hex: "#707880", keyword: "Tool Gray" }] },
    { name: "Early Start", colors: [{ hex: "#2888A0", keyword: "Dawn Teal" }, { hex: "#E87838", keyword: "Hi-Vis Orange" }, { hex: "#E4DCD0", keyword: "Dusty White" }] },
    { name: "Power Drill", colors: [{ hex: "#C83838", keyword: "Power Red" }, { hex: "#4A8A60", keyword: "Grounded Green" }, { hex: "#F0E8D8", keyword: "Clean Canvas" }] },
  ],
  "workvan-motivation-cozy": [
    { name: "Overtime Glow", colors: [{ hex: "#A84828", keyword: "Work Flame" }, { hex: "#C89838", keyword: "Lantern Gold" }, { hex: "#4A3E30", keyword: "Boot Leather" }] },
    { name: "Night Build", colors: [{ hex: "#3A3038", keyword: "Dark Workshop" }, { hex: "#C86030", keyword: "Welding Spark" }, { hex: "#8A7860", keyword: "Sawmill Dust" }] },
    { name: "Hustle & Grit", colors: [{ hex: "#7A4018", keyword: "Iron Rust" }, { hex: "#B89040", keyword: "Brass Fitting" }, { hex: "#584838", keyword: "Workbench" }] },
  ],
  "suburban-assured-bright": [
    { name: "Front Yard", colors: [{ hex: "#B4C8A8", keyword: "Fresh Lawn" }, { hex: "#E8E0D4", keyword: "Porch Cream" }, { hex: "#A0B8C4", keyword: "Sky Reflection" }] },
    { name: "Morning Walk", colors: [{ hex: "#C8D0BC", keyword: "Dewy Grass" }, { hex: "#F0EAE0", keyword: "Mailbox White" }, { hex: "#B0A890", keyword: "Stepping Stone" }] },
    { name: "Garden Gate", colors: [{ hex: "#98B0A4", keyword: "Patina Mint" }, { hex: "#D8CEB8", keyword: "Picket Fence" }, { hex: "#C0C8C4", keyword: "Morning Fog" }] },
  ],
  "suburban-assured-cozy": [
    { name: "Family Den", colors: [{ hex: "#7A6048", keyword: "Worn Pine" }, { hex: "#B89870", keyword: "Harvest Wheat" }, { hex: "#5A6A48", keyword: "Backyard Sage" }] },
    { name: "Autumn Porch", colors: [{ hex: "#9A5A38", keyword: "Pumpkin Spice" }, { hex: "#D4BC98", keyword: "Apple Cider" }, { hex: "#6A6450", keyword: "Dried Leaf" }] },
    { name: "Quilt Blanket", colors: [{ hex: "#8A6858", keyword: "Cinnamon Stick" }, { hex: "#C4A480", keyword: "Brown Sugar" }, { hex: "#7A7A60", keyword: "Olive Flannel" }] },
  ],
  "suburban-confidence-bright": [
    { name: "Clean Curb", colors: [{ hex: "#2A4050", keyword: "Mailbox Navy" }, { hex: "#B8C8A8", keyword: "Trimmed Hedge" }, { hex: "#E0D8C8", keyword: "Garage Door" }] },
    { name: "New Build", colors: [{ hex: "#606868", keyword: "Roof Slate" }, { hex: "#F0ECE4", keyword: "Primer White" }, { hex: "#A0A898", keyword: "New Shingle" }] },
    { name: "Driveway Sharp", colors: [{ hex: "#3A5040", keyword: "Dark Boxwood" }, { hex: "#D4CCC0", keyword: "Clean Concrete" }, { hex: "#8A8A80", keyword: "Paver Gray" }] },
  ],
  "suburban-confidence-cozy": [
    { name: "Study Room", colors: [{ hex: "#3A2E28", keyword: "Dark Bookcase" }, { hex: "#7A8A60", keyword: "Study Fern" }, { hex: "#9A7A58", keyword: "Desk Maple" }] },
    { name: "Leather Chair", colors: [{ hex: "#5A4030", keyword: "Saddle Brown" }, { hex: "#C4A880", keyword: "Worn Linen" }, { hex: "#3A4038", keyword: "Lamp Shade" }] },
    { name: "Wine Cellar", colors: [{ hex: "#4A2830", keyword: "Vintage Wine" }, { hex: "#B8A088", keyword: "Cork Board" }, { hex: "#6A5A48", keyword: "Cellar Wood" }] },
  ],
  "suburban-empathy-bright": [
    { name: "Sunroom", colors: [{ hex: "#D0B8B0", keyword: "Rose Quartz" }, { hex: "#B4C8B0", keyword: "Window Fern" }, { hex: "#E8E2D8", keyword: "Sheer Curtain" }] },
    { name: "Welcome Mat", colors: [{ hex: "#C8C0D0", keyword: "Lavender Haze" }, { hex: "#E0D4C4", keyword: "Warm Welcome" }, { hex: "#A8B8A0", keyword: "Front Garden" }] },
    { name: "Nursery Light", colors: [{ hex: "#B8D0C4", keyword: "Baby Sage" }, { hex: "#E8D4C8", keyword: "Peach Fuzz" }, { hex: "#C8C4D4", keyword: "Soft Iris" }] },
  ],
  "suburban-empathy-cozy": [
    { name: "Reading Nook", colors: [{ hex: "#8A6A5A", keyword: "Spiced Chai" }, { hex: "#C8AA90", keyword: "Cashew Butter" }, { hex: "#6A7858", keyword: "Garden Herb" }] },
    { name: "Baked Comfort", colors: [{ hex: "#A87868", keyword: "Cinnamon Toast" }, { hex: "#D8C4A8", keyword: "Fresh Biscuit" }, { hex: "#7A6E5E", keyword: "Nutmeg" }] },
    { name: "Knitted Throw", colors: [{ hex: "#9A7A70", keyword: "Rose Cocoa" }, { hex: "#B4A488", keyword: "Oatmeal" }, { hex: "#6A6E58", keyword: "Soft Olive" }] },
  ],
  "suburban-motivation-bright": [
    { name: "Backyard Kickstart", colors: [{ hex: "#48A470", keyword: "Lush Green" }, { hex: "#E0A030", keyword: "Sunbeam Gold" }, { hex: "#E8E0D4", keyword: "Fence White" }] },
    { name: "Morning Jog", colors: [{ hex: "#3890B0", keyword: "Clear Pool" }, { hex: "#D85838", keyword: "Running Coral" }, { hex: "#F0E8DC", keyword: "Sidewalk Cream" }] },
    { name: "Garage Project", colors: [{ hex: "#D4A028", keyword: "Bright Marigold" }, { hex: "#4A7A60", keyword: "Garden Fresh" }, { hex: "#B0C0D0", keyword: "Weekend Sky" }] },
  ],
  "suburban-motivation-cozy": [
    { name: "Game Night", colors: [{ hex: "#8A3040", keyword: "Berry Jam" }, { hex: "#C8A040", keyword: "Popcorn Gold" }, { hex: "#5A4838", keyword: "Game Table" }] },
    { name: "Weekend Workshop", colors: [{ hex: "#7A5028", keyword: "Raw Cedar" }, { hex: "#B88838", keyword: "Lacquer Gold" }, { hex: "#6A6858", keyword: "Garage Floor" }] },
    { name: "Fire Pit", colors: [{ hex: "#A84828", keyword: "Kindling" }, { hex: "#5A6840", keyword: "Evening Yard" }, { hex: "#D4B080", keyword: "Toasted Marshmallow" }] },
  ],
};

const emotionalFallback: Record<string, PaletteOption[]> = {
  bright: [
    { name: "Fresh Canvas", colors: [{ hex: "#E8E4D8", keyword: "Natural Linen" }, { hex: "#A0C0D0", keyword: "Soft Cerulean" }, { hex: "#B4C8A0", keyword: "Spring Leaf" }] },
    { name: "Airy Pastel", colors: [{ hex: "#C8D4E4", keyword: "Pale Chambray" }, { hex: "#F0E8DC", keyword: "Warm Cloud" }, { hex: "#B0B8A4", keyword: "Frosted Sage" }] },
    { name: "Gentle Dawn", colors: [{ hex: "#D8C4B0", keyword: "Morning Wheat" }, { hex: "#F4F0E8", keyword: "Daybreak White" }, { hex: "#90A8B4", keyword: "Haze Blue" }] },
  ],
  cozy: [
    { name: "Amber Warmth", colors: [{ hex: "#B88840", keyword: "Dark Honey" }, { hex: "#7A5A3A", keyword: "Roasted Pecan" }, { hex: "#5A4430", keyword: "Deep Walnut" }] },
    { name: "Hearthstone", colors: [{ hex: "#A05838", keyword: "Fired Clay" }, { hex: "#D4BA90", keyword: "Toasted Grain" }, { hex: "#6A5040", keyword: "Smoked Cedar" }] },
    { name: "Cabin Twilight", colors: [{ hex: "#6A4E38", keyword: "Log Cabin" }, { hex: "#C49858", keyword: "Lantern Glow" }, { hex: "#8A7460", keyword: "Worn Saddle" }] },
  ],
  powerful: [
    { name: "Iron Authority", colors: [{ hex: "#1E2A3C", keyword: "Deep Admiral" }, { hex: "#3A3A3C", keyword: "Black Steel" }, { hex: "#B0ACA4", keyword: "Matte Silver" }] },
    { name: "Obsidian Edge", colors: [{ hex: "#2C2824", keyword: "Obsidian" }, { hex: "#8A2030", keyword: "Commander Red" }, { hex: "#D4CCC4", keyword: "Polished Stone" }] },
    { name: "Titan Gray", colors: [{ hex: "#4A4E54", keyword: "Gunship Gray" }, { hex: "#F0ECE4", keyword: "Stark White" }, { hex: "#2A3440", keyword: "Midnight Navy" }] },
  ],
  cinematic: [
    { name: "Film Noir", colors: [{ hex: "#14182A", keyword: "Deep Midnight" }, { hex: "#B89040", keyword: "Gilded Amber" }, { hex: "#3A4A5C", keyword: "Moody Blue" }] },
    { name: "Golden Reel", colors: [{ hex: "#C89840", keyword: "Projection Gold" }, { hex: "#1A2030", keyword: "Theater Black" }, { hex: "#58646C", keyword: "Celluloid Gray" }] },
    { name: "Teal Drama", colors: [{ hex: "#1A3A40", keyword: "Deep Teal" }, { hex: "#D4A850", keyword: "Muted Gold" }, { hex: "#4A4850", keyword: "Smoke Screen" }] },
  ],
};

const genericFallback: PaletteOption[] = [
  { name: "Timeless Natural", colors: [{ hex: "#D8D0C0", keyword: "Natural Stone" }, { hex: "#8A9490", keyword: "Lichen Gray" }, { hex: "#A8B4A0", keyword: "Dried Sage" }] },
  { name: "Warm Earth", colors: [{ hex: "#C4AA88", keyword: "Sun-Baked Clay" }, { hex: "#8A7A68", keyword: "Driftwood" }, { hex: "#E4DAC8", keyword: "Linen Cream" }] },
  { name: "Cool Mineral", colors: [{ hex: "#94A0A8", keyword: "Sea Stone" }, { hex: "#E8E4DC", keyword: "Chalk White" }, { hex: "#B4C0C8", keyword: "Winter Harbor" }] },
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
