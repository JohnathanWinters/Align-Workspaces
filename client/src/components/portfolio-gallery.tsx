import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { PortfolioPhoto, ColorSwatch } from "@shared/schema";
import { Sparkles, Palette } from "lucide-react";
import { useState } from "react";
import { getRecommendedPalette } from "@/lib/color-palettes";

interface PortfolioGalleryProps {
  environment: string;
  brandMessage: string;
  emotionalImpact: string;
}

export function PortfolioGallery({ environment, brandMessage, emotionalImpact }: PortfolioGalleryProps) {
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

  const recommendedPalette = getRecommendedPalette(environment, brandMessage, emotionalImpact);

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
        <PhotoGrid photos={matchedPhotos} />
        <RecommendedPalette palette={recommendedPalette} />
      </div>
    );
  }

  return (
    <div data-testid="portfolio-unique">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-xl mb-2" data-testid="text-unique-heading">Your choice is unique!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Since we can't show you any sample photos your photoshoot gets a <span className="font-semibold">25% discount!</span>
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
          <PhotoGrid photos={allPhotos} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Portfolio photos coming soon.</p>
        )}
      </div>

      <RecommendedPalette palette={recommendedPalette} />
    </div>
  );
}

function PhotoGrid({ photos }: { photos: PortfolioPhoto[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="portfolio-grid">
      {photos.map((photo, index) => (
        <PhotoCard key={photo.id} photo={photo} index={index} />
      ))}
    </div>
  );
}

function PhotoCard({ photo, index }: { photo: PortfolioPhoto; index: number }) {
  const [showPalette, setShowPalette] = useState(false);
  const palette = (photo.colorPalette as ColorSwatch[] | null) || [];

  return (
    <motion.div
      key={photo.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="relative aspect-[3/4] rounded-md overflow-hidden group"
      onMouseEnter={() => setShowPalette(true)}
      onMouseLeave={() => setShowPalette(false)}
      onClick={() => setShowPalette(!showPalette)}
      data-testid={`portfolio-photo-card-${photo.id}`}
    >
      <img
        src={photo.imageUrl}
        alt="Client portfolio photo"
        className="w-full h-full object-cover"
        loading="eager"
        decoding="async"
        style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        data-testid={`portfolio-photo-${photo.id}`}
      />

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 transition-opacity duration-300 ${
          showPalette ? "opacity-100" : "opacity-0"
        }`}
        data-testid={`palette-overlay-${photo.id}`}
      >
        {palette.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="w-3 h-3 text-white/70" />
              <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium">Color Palette</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {palette.map((swatch, i) => (
                <div key={i} className="flex items-center gap-2" data-testid={`swatch-${photo.id}-${i}`}>
                  <div
                    className="w-4 h-4 rounded-sm shrink-0 border border-white/20"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-white text-[11px] leading-tight">{swatch.keyword}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RecommendedPalette({ palette }: { palette: ColorSwatch[] }) {
  return (
    <div className="mt-8 p-4 rounded-md border border-border bg-card" data-testid="recommended-palette">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium">Recommended Color Palette</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Based on your selections, these colors will complement your shoot
      </p>
      <div className="flex gap-2 flex-wrap">
        {palette.map((swatch, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5"
            data-testid={`recommended-swatch-${i}`}
          >
            <div
              className="w-12 h-12 rounded-md border border-border"
              style={{ backgroundColor: swatch.hex }}
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[52px]">
              {swatch.keyword}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
