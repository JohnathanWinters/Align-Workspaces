import { useState } from "react";
import { Plus, X } from "lucide-react";

const STANDARD_AMENITIES = [
  "Wi-Fi",
  "Dedicated Wi-Fi",
  "Natural Light",
  "Sound Insulated",
  "White Noise Machine",
  "Parking",
  "Free Parking",
  "Valet Parking",
  "Private Entrance",
  "Private Restroom",
  "Waiting Area",
  "Comfortable Seating",
  "Soft Lighting",
  "Climate Control",
  "Air Conditioning",
  "Heating",
  "Elevator Access",
  "ADA Accessible",
  "Coffee Station",
  "Espresso Machine",
  "Kitchenette",
  "Refrigerator",
  "Microwave",
  "Bluetooth Speaker",
  "Sound System",
  "Projector",
  "Monitor",
  "Whiteboard",
  "Conference Table",
  "Standing Desk",
  "Printer",
  "Shower",
  "Dressing Room",
  "Makeup Station",
  "Full Length Mirror",
  "Professional Lighting",
  "Backdrops",
  "Garden View",
  "Balcony",
  "Outdoor Space",
  "Bike Rack",
  "Security Camera",
  "Keypad Entry",
  "24/7 Access",
  "Reception Area",
  "Mail Service",
  "Storage Space",
  "Filing Cabinet",
  "Bookshelf",
  "Plants",
  "Essential Oils Diffuser",
  "Yoga Mats",
  "Meditation Cushions",
  "Massage Table",
  "Therapy Couch",
  "Sand Tray",
  "Art Supplies",
  "Toys/Play Area",
  "Child Friendly",
  "Pet Friendly",
];

interface AmenityInputProps {
  value: string[];
  onChange: (amenities: string[]) => void;
  "data-testid"?: string;
}

export function AmenityInput({ value, onChange, "data-testid": testId }: AmenityInputProps) {
  const [customInput, setCustomInput] = useState("");
  const [showAll, setShowAll] = useState(false);

  const toggle = (amenity: string) => {
    if (value.some(v => v.toLowerCase() === amenity.toLowerCase())) {
      onChange(value.filter(v => v.toLowerCase() !== amenity.toLowerCase()));
    } else {
      onChange([...value, amenity]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (value.some(v => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setCustomInput("");
  };

  // Custom amenities the user added that aren't in the standard list
  const customAmenities = value.filter(
    v => !STANDARD_AMENITIES.some(s => s.toLowerCase() === v.toLowerCase())
  );

  const displayList = showAll ? STANDARD_AMENITIES : STANDARD_AMENITIES.slice(0, 20);

  return (
    <div data-testid={testId}>
      {/* Checkbox grid */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {displayList.map(amenity => {
          const checked = value.some(v => v.toLowerCase() === amenity.toLowerCase());
          return (
            <button
              key={amenity}
              type="button"
              onClick={() => toggle(amenity)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                checked
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
            >
              {amenity}
            </button>
          );
        })}
        {customAmenities.map(amenity => (
          <span
            key={amenity}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#c4956a]/10 text-[#946b4a] border border-[#c4956a]/30"
          >
            {amenity}
            <button type="button" onClick={() => onChange(value.filter(v => v !== amenity))} className="text-[#946b4a]/60 hover:text-[#946b4a]">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {!showAll && (
        <button type="button" onClick={() => setShowAll(true)} className="text-[10px] text-stone-400 hover:text-stone-600 mb-2">
          Show all amenities
        </button>
      )}

      {/* Custom amenity input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Add a custom amenity..."
          className="flex-1 h-8 text-xs bg-white border border-stone-200 rounded-md px-2.5 outline-none focus:border-stone-400"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="h-8 px-3 text-xs font-medium bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200 disabled:opacity-40 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </div>
  );
}
