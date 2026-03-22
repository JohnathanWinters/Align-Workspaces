import { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";

export function EmojiPickerButton({ onEmoji }: { onEmoji: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
        data-testid="button-emoji-picker"
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 z-50 shadow-xl rounded-xl overflow-hidden">
          <EmojiPicker
            onEmojiClick={(data: EmojiClickData) => {
              onEmoji(data.emoji);
              setOpen(false);
            }}
            theme={Theme.LIGHT}
            width={320}
            height={400}
            searchPlaceholder="Search emoji..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
