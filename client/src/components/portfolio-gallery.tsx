import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { PortfolioPhoto, ColorSwatch } from "@shared/schema";
import { Sparkles, Palette, Eye, Tag } from "lucide-react";
import { brandMessages, emotionalImpacts, environments } from "@/lib/configurator-data";
import { useState } from "react";
import { getRecommendedPalettes, type PaletteOption } from "@/lib/color-palettes";
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

function selectVariedPhotos(photos: PortfolioPhoto[], environment: string, brandMessage: string, emotionalImpact: string): PortfolioPhoto[] {
  if (photos.length <= 6) return photos;

  const scored = photos.map((photo) => {
    let matchCount = 0;
    if (photo.environments?.includes(environment)) matchCount++;
    if (photo.brandMessages?.includes(brandMessage)) matchCount++;
    if (photo.emotionalImpacts?.includes(emotionalImpact)) matchCount++;
    return { photo, matchCount };
  });

  scored.sort((a, b) => b.matchCount - a.matchCount);

  const selected: PortfolioPhoto[] = [];
  const usedEnvs = new Set<string>();
  const usedMsgs = new Set<string>();
  const usedMoods = new Set<string>();

  for (const { photo } of scored) {
    if (selected.length >= 6) break;

    const env = photo.environments?.[0] || "";
    const msg = photo.brandMessages?.[0] || "";
    const mood = photo.emotionalImpacts?.[0] || "";

    const isNew = !usedEnvs.has(env) || !usedMsgs.has(msg) || !usedMoods.has(mood);

    if (selected.length === 0 || isNew) {
      selected.push(photo);
      if (env) usedEnvs.add(env);
      if (msg) usedMsgs.add(msg);
      if (mood) usedMoods.add(mood);
    }
  }

  while (selected.length < 6 && selected.length < photos.length) {
    const remaining = scored.find(({ photo }) => !selected.includes(photo));
    if (remaining) selected.push(remaining.photo);
    else break;
  }

  return selected;
}

interface PortfolioGalleryProps {
  environment: string;
  brandMessage: string;
  emotionalImpact: string;
}

export function PortfolioGallery({ environment, brandMessage, emotionalImpact }: PortfolioGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioPhoto | null>(null);

  const { data: matchedPhotos, isLoading: matchedLoading } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos", environment, brandMessage, emotionalImpact],
    queryFn: async () => {
      const params = new URLSearchParams({
        environment,
        brandMessage,
        emotionalImpact,
      });
      const res = await fetch(`/api/portfolio-photos?${params}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
    enabled: !!environment && !!brandMessage && !!emotionalImpact,
  });

  const hasMatches = matchedPhotos && matchedPhotos.length > 0;

  const { data: allPhotos, isLoading: allLoading } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio-photos");
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
    enabled: !matchedLoading && !hasMatches,
  });

  const recommendedPalettes = getRecommendedPalettes(environment, brandMessage, emotionalImpact);

  if (matchedLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-md bg-foreground/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (hasMatches) {
    return (
      <div data-testid="portfolio-matched">
        <PhotoGrid photos={matchedPhotos} onPhotoClick={setSelectedPhoto} />
        <RecommendedPalettes palettes={recommendedPalettes} />
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      </div>
    );
  }

  return (
    <div data-testid="portfolio-unique">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-xl mb-2" data-testid="text-unique-heading">Your combination is custom-built.</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          We'll design this look specifically for you. <span className="font-semibold">Receive 25% off for pioneering this look!</span>
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-4" data-testid="text-portfolio-fallback">Here are some photos from our portfolio.</p>
        {allLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-md bg-foreground/5 animate-pulse" />
            ))}
          </div>
        ) : allPhotos && allPhotos.length > 0 ? (
          <PhotoGrid photos={selectVariedPhotos(allPhotos, environment, brandMessage, emotionalImpact)} onPhotoClick={setSelectedPhoto} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Portfolio photos coming soon.</p>
        )}
      </div>

      <RecommendedPalettes palettes={recommendedPalettes} />
      <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </div>
  );
}

function PhotoGrid({ photos, onPhotoClick }: { photos: PortfolioPhoto[]; onPhotoClick: (photo: PortfolioPhoto) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="portfolio-grid">
      {photos.slice(0, 6).map((photo, index) => (
        <PhotoCard key={photo.id} photo={photo} index={index} onPhotoClick={onPhotoClick} className={index >= 4 ? "hidden sm:block" : ""} />
      ))}
    </div>
  );
}

function PhotoCard({ photo, index, onPhotoClick, className }: { photo: PortfolioPhoto; index: number; onPhotoClick: (photo: PortfolioPhoto) => void; className?: string }) {
  const palette = (photo.colorPalette as ColorSwatch[] | null) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className={`relative aspect-[3/4] rounded-md overflow-hidden group cursor-pointer ${className || ""}`}
      onClick={() => onPhotoClick(photo)}
      data-testid={`portfolio-photo-card-${photo.id}`}
    >
      <img
        src={photo.imageUrl}
        alt="Professional portrait photography for small business professionals in Miami"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="eager"
        decoding="async"
        style={{ imageRendering: "auto" }}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        data-testid={`portfolio-photo-${photo.id}`}
      />

      {palette.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-6 md:hidden" data-testid={`palette-mobile-${photo.id}`}>
          <div className="flex items-center gap-1.5">
            {palette.map((swatch, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm border border-white/20"
                style={{ backgroundColor: swatch.hex }}
                data-testid={`swatch-mobile-${photo.id}-${i}`}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex-col justify-end p-3 transition-opacity duration-300 hidden md:flex opacity-0 group-hover:opacity-100"
        data-testid={`palette-overlay-${photo.id}`}
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
                    data-testid={`swatch-${photo.id}-${i}`}
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
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden border-none bg-black/95" data-testid="photo-lightbox" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Photo Details</DialogTitle>
        <div className="flex flex-col md:flex-row">
          <div className="relative flex-1 min-h-[300px] md:min-h-[500px]">
            {photo && (
              <img
                src={photo.imageUrl}
                alt="Professional branding portrait detail - Brand Vision Studio Miami"
                className="w-full h-full object-cover"
                data-testid="lightbox-image"
              />
            )}
          </div>

          <div className="w-full md:w-72 bg-card p-5 flex flex-col gap-5" data-testid="lightbox-palette-panel">
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
                  <div key={i} className="flex items-center gap-3" data-testid={`lightbox-swatch-${i}`}>
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

function RecommendedPalettes({ palettes }: { palettes: PaletteOption[] }) {
  return (
    <div className="mt-8" data-testid="recommended-palette">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium">Recommended Color Palettes</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Based on your selections, here are 3 palette options to complement your shoot
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {palettes.map((option, i) => (
          <div
            key={i}
            className="p-3 rounded-md border border-border bg-card"
            data-testid={`recommended-palette-option-${i}`}
          >
            <p className="text-xs font-medium mb-3 text-center">{option.name}</p>
            <div className="flex justify-center gap-2">
              {option.colors.map((swatch, j) => (
                <div
                  key={j}
                  className="flex flex-col items-center gap-1.5"
                  data-testid={`recommended-swatch-${i}-${j}`}
                >
                  <div
                    className="w-10 h-10 rounded-md border border-border"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[48px]">
                    {swatch.keyword}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
