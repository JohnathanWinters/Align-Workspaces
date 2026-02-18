import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { PortfolioPhoto } from "@shared/schema";
import { Sparkles } from "lucide-react";

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
    </div>
  );
}

function PhotoGrid({ photos }: { photos: PortfolioPhoto[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="portfolio-grid">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.12 }}
          className="aspect-[3/4] rounded-md overflow-hidden"
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
        </motion.div>
      ))}
    </div>
  );
}
