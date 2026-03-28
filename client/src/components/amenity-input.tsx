import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const STANDARD_AMENITIES = [
  "Wi-Fi",
  "Natural Light",
  "Sound Insulated",
  "White Noise Machine",
  "Parking",
  "Street Parking",
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
  "Dedicated Wi-Fi",
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
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = input.trim()
    ? STANDARD_AMENITIES.filter(
        (a) =>
          a.toLowerCase().includes(input.toLowerCase()) &&
          !value.some((v) => v.toLowerCase() === a.toLowerCase())
      ).slice(0, 8)
    : [];

  const addAmenity = useCallback(
    (amenity: string) => {
      const trimmed = amenity.trim();
      if (!trimmed) return;
      if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
      onChange([...value, trimmed]);
      setInput("");
      setSelectedIdx(0);
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const removeAmenity = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        addAmenity(suggestions[selectedIdx]);
      } else if (input.trim()) {
        addAmenity(input);
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeAmenity(value.length - 1);
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    setSelectedIdx(0);
    setShowSuggestions(suggestions.length > 0 && input.trim().length > 0);
  }, [input]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative" data-testid={testId}>
      <div
        className="flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-gray-200 bg-white cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((amenity, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium"
          >
            {amenity}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAmenity(i);
              }}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && input.trim()) setShowSuggestions(true);
          }}
          placeholder={value.length === 0 ? "Type an amenity and press Enter" : "Add more..."}
          className="flex-1 min-w-[120px] text-xs outline-none bg-transparent py-0.5 placeholder:text-stone-300"
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addAmenity(s);
              }}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                i === selectedIdx
                  ? "bg-stone-100 text-stone-900"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
