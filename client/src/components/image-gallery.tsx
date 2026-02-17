import { motion, AnimatePresence } from "framer-motion";
import type { Environment, EmotionalImpact } from "@/lib/configurator-data";
import { environmentImages } from "@/lib/configurator-data";

interface ImageGalleryProps {
  environment: Environment | null;
  emotionalImpact: EmotionalImpact | null;
}

const filterStyles: Record<string, string> = {
  cozy: "brightness(1.05) saturate(1.2) sepia(0.2)",
  bright: "brightness(1.15) saturate(0.9) contrast(0.95)",
  powerful: "brightness(0.9) saturate(1.1) contrast(1.3)",
  cinematic: "brightness(0.85) saturate(1.3) contrast(1.15) sepia(0.1)",
};

export function ImageGallery({ environment, emotionalImpact }: ImageGalleryProps) {
  const imageSrc = environment && environment !== "other" ? environmentImages[environment] ?? null : null;
  const filter = "none";

  return (
    <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-muted" data-testid="image-gallery">
      <AnimatePresence mode="wait">
        {imageSrc ? (
          <motion.img
            key={environment}
            src={imageSrc}
            alt={`${environment} environment preview`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm">
                {environment === "other" ? "Custom environment selected" : "Select an environment to preview your shoot"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
