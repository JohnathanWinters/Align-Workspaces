import { useState, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

interface ImageAttachButtonProps {
  onImageReady: (imageUrl: string) => void;
  pendingImage: string | null;
  onClear: () => void;
  uploadUrl?: string;
}

export function ImageAttachButton({ onImageReady, pendingImage, onClear, uploadUrl = "/api/messages/upload-image" }: ImageAttachButtonProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(uploadUrl, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onImageReady(data.imageUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {pendingImage ? (
        <div className="relative">
          <img src={pendingImage} alt="Attachment" className="w-8 h-8 rounded object-cover border border-gray-200" />
          <button
            onClick={onClear}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          data-testid="button-image-attach"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}

export function MessageImage({ src, className = "" }: { src: string; className?: string }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt="Shared image"
        className={`rounded-lg max-w-[280px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={() => setFullscreen(true)}
        loading="lazy"
      />
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={src}
            alt="Shared image"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
