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
      <AnimatePresence>
        {imageSrc && (
          <motion.img
            key={environment}
            src={imageSrc}
            alt={`${environment} environment preview`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
