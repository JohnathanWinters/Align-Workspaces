import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Palette, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import type { PortfolioPhoto, ColorSwatch } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

function PortfolioCard({ photo, index, onPhotoClick }: { photo: PortfolioPhoto; index: number; onPhotoClick: (photo: PortfolioPhoto) => void }) {
  const palette = (photo.colorPalette as ColorSwatch[] | null) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="aspect-[3/4] rounded-md overflow-hidden relative cursor-pointer group"
      onClick={() => onPhotoClick(photo)}
      data-testid={`portfolio-preview-card-${index}`}
    >
      <img
        src={photo.imageUrl}
        alt="Miami personal branding portrait photography"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        data-testid={`portfolio-preview-${index}`}
      />

      {palette.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-6 md:hidden" data-testid={`palette-mobile-preview-${index}`}>
          <div className="flex items-center gap-1.5">
            {palette.map((swatch, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm border border-white/20"
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex-col justify-end p-3 transition-opacity duration-300 hidden md:flex opacity-0 group-hover:opacity-100"
        data-testid={`portfolio-preview-overlay-${index}`}
      >
        {palette.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="w-3 h-3 text-white/70" />
              <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium">Color Palette</p>
            </div>
            <div className="flex gap-1.5">
              {palette.map((swatch, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-sm border border-white/20"
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.keyword}
                />
              ))}
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1 text-white/70">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider font-medium">View</span>
        </div>
      </div>
    </motion.div>
  );
}

function PhotoLightbox({ photo, onClose }: { photo: PortfolioPhoto | null; onClose: () => void }) {
  const palette = photo ? (photo.colorPalette as ColorSwatch[] | null) || [] : [];

  return (
    <Dialog open={!!photo} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden border-none bg-black/95" data-testid="photo-lightbox-preview" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Photo Details</DialogTitle>
        <div className="flex flex-col md:flex-row">
          <div className="relative flex-1 min-h-[300px] md:min-h-[500px]">
            {photo && (
              <img
                src={photo.imageUrl}
                alt="Professional branding portrait detail - Align Miami"
                className="w-full h-full object-cover"
                data-testid="lightbox-image-preview"
              />
            )}
          </div>

          <div className="w-full md:w-72 bg-card p-5 flex flex-col gap-5" data-testid="lightbox-palette-panel-preview">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Color Palette</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Colors featured in this portrait
              </p>
            </div>

            {palette.length > 0 ? (
              <div className="flex flex-col gap-3">
                {palette.map((swatch, i) => (
                  <div key={i} className="flex items-center gap-3" data-testid={`lightbox-swatch-preview-${i}`}>
                    <div
                      className="w-10 h-10 rounded-md shrink-0 border border-border"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{swatch.keyword}</span>
                      <span className="text-xs text-muted-foreground font-mono">{swatch.hex}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No palette data available for this photo.</p>
            )}

            {photo && (
              <div className="mt-auto pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tap a color swatch to note it for your session. These tones guide wardrobe and backdrop recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PortfolioSection() {
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioPhoto | null>(null);

  const { data: photos, isLoading } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos"],
  });

  if (isLoading) {
    return (
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-md bg-foreground/5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!photos || photos.length === 0) return null;

  const displayPhotos = photos.slice(0, 4);

  return (
    <section className="py-20 px-6 bg-background" data-testid="section-portfolio-preview">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Our Work
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl mb-4" data-testid="text-recent-sessions">
            Recent Sessions
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-portfolio-preview-desc">
            A glimpse at what we create together with our clients.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayPhotos.map((photo, index) => (
            <PortfolioCard key={photo.id} photo={photo} index={index} onPhotoClick={setSelectedPhoto} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link href="/portfolio">
            <Button variant="outline" data-testid="link-view-portfolio">
              View Full Portfolio
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>

      <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </section>
  );
}
