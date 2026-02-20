import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import type { PortfolioPhoto, ColorSwatch } from "@shared/schema";
import { environments, brandMessages, emotionalImpacts } from "@/lib/configurator-data";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

function getLabel(value: string, list: { value: string; label: string }[]) {
  return list.find((item) => item.value === value)?.label || value;
}

function PhotoTags({ photo }: { photo: PortfolioPhoto }) {
  const tags: string[] = [];
  if (photo.environments?.length) tags.push(...photo.environments.map((v: string) => getLabel(v, environments)));
  if (photo.brandMessages?.length) tags.push(...photo.brandMessages.map((v: string) => getLabel(v, brandMessages)));
  if (photo.emotionalImpacts?.length) tags.push(...photo.emotionalImpacts.map((v: string) => getLabel(v, emotionalImpacts)));
  if (!tags.length) return null;
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Tag className="w-3 h-3 text-white/70" />
        <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium">Emotion</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span key={i} className="text-[10px] bg-white/20 text-white/90 px-1.5 py-0.5 rounded-sm font-medium">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function PortfolioCard({ photo, index, onPhotoClick }: { photo: PortfolioPhoto; index: number; onPhotoClick: (photo: PortfolioPhoto) => void }) {
  const palette = (photo.colorPalette as ColorSwatch[] | null) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="aspect-[3/4] rounded-md overflow-hidden relative cursor-pointer group"
      onClick={() => onPhotoClick(photo)}
      data-testid={`portfolio-full-card-${index}`}
    >
      <img
        src={photo.imageUrl}
        alt="Personal branding portrait by Align Miami"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="eager"
        decoding="async"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        data-testid={`portfolio-full-photo-${index}`}
      />

      {palette.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-6 md:hidden" data-testid={`palette-mobile-full-${index}`}>
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
        data-testid={`portfolio-full-overlay-${index}`}
      >
        <PhotoTags photo={photo} />

        {palette.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="w-3 h-3 text-white/70" />
              <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium">Color Palette</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {palette.map((swatch, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-sm border border-white/20 shrink-0"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-white/90 text-[11px] font-medium truncate">{swatch.keyword}</span>
                </div>
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
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden border-none bg-black/95" data-testid="photo-lightbox-full" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Photo Details</DialogTitle>
        <div className="flex flex-col md:flex-row">
          <div className="relative flex-1 min-h-[300px] md:min-h-[500px]">
            {photo && (
              <img
                src={photo.imageUrl}
                alt="Professional branding portrait detail - Align Miami"
                className="w-full h-full object-cover"
                data-testid="lightbox-image-full"
              />
            )}
          </div>

          <div className="w-full md:w-72 bg-card p-5 flex flex-col gap-5" data-testid="lightbox-palette-panel-full">
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
                  <div key={i} className="flex items-center gap-3" data-testid={`lightbox-swatch-full-${i}`}>
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
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Emotion</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...(photo.environments || []).map((v: string) => getLabel(v, environments)),
                    ...(photo.brandMessages || []).map((v: string) => getLabel(v, brandMessages)),
                    ...(photo.emotionalImpacts || []).map((v: string) => getLabel(v, emotionalImpacts)),
                  ].map((tag, i) => (
                    <span key={i} className="text-xs bg-muted text-foreground px-2 py-1 rounded-sm font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PortfolioPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioPhoto | null>(null);

  useEffect(() => {
    document.title = "Portfolio | Miami Personal Branding Photography | Align";
  }, []);

  const { data: photos, isLoading } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/">
              <p className="font-serif text-base sm:text-lg font-semibold tracking-tight cursor-pointer" data-testid="link-home-from-portfolio">Align Portrait Designer</p>
            </Link>
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Our Work
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-portfolio-title">
            First Impressions
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-portfolio-desc">
            Each of these sessions was designed around one question: How should clients feel before the first conversation begins?
          </p>
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-md bg-foreground/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && photos && photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="portfolio-full-grid">
            {photos.map((photo, index) => (
              <PortfolioCard key={photo.id} photo={photo} index={index} onPhotoClick={setSelectedPhoto} />
            ))}
          </div>
        )}

        {!isLoading && (!photos || photos.length === 0) && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Portfolio coming soon.</p>
          </div>
        )}
      </div>

      <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </div>
  );
}
