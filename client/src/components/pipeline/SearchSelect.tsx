import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface SearchItem {
  id: string;
  primary: string;
  secondary?: string;
  searchText: string;
}

interface SearchSelectProps {
  value: string;
  onChange: (id: string) => void;
  items: SearchItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

export default function SearchSelect({
  value,
  onChange,
  items,
  placeholder = "Select…",
  searchPlaceholder = "Search by name, email, or title…",
  emptyLabel = "None",
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = items.find(i => i.id === value);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    inputRef.current?.focus();
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(i => i.searchText.toLowerCase().includes(q)).slice(0, 30)
    : items.slice(0, 30);

  return (
    <div ref={containerRef} className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-9 flex items-center justify-between px-3 text-sm bg-white border border-input rounded-md hover:border-stone-300 transition-colors"
        >
          <span className={selected ? "truncate" : "text-muted-foreground"}>
            {selected?.primary || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0 ml-1" />
        </button>
      ) : (
        <div className="w-full h-9 flex items-center gap-1.5 px-2.5 border border-stone-400 rounded-md bg-white ring-1 ring-stone-200">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
            placeholder={searchPlaceholder}
            className="flex-1 text-sm outline-none bg-transparent min-w-0"
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
          style={{ zIndex: 10003 }}
        >
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${!value ? "bg-gray-50" : ""}`}
            >
              <span className="text-gray-500">{emptyLabel}</span>
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex flex-col ${value === item.id ? "bg-gray-50" : ""}`}
                >
                  <span className="font-medium text-gray-900 truncate">{item.primary}</span>
                  {item.secondary && <span className="text-[11px] text-gray-500 truncate">{item.secondary}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
