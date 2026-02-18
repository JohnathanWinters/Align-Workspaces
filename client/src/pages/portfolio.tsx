import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { PortfolioPhoto } from "@shared/schema";

export default function PortfolioPage() {
  const { data: photos, isLoading } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/">
              <p className="font-serif text-lg cursor-pointer" data-testid="link-home-from-portfolio">Brand Vision Studio</p>
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
            Portfolio
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-portfolio-title">
            Our Work
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-portfolio-desc">
            Every session is designed to capture your unique brand story. Here's a look at what we've created with our clients.
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
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="aspect-[3/4] rounded-md overflow-hidden"
              >
                <img
                  src={photo.imageUrl}
                  alt="Portfolio photo"
                  className="w-full h-full object-cover"
                  data-testid={`portfolio-full-photo-${index}`}
                />
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && (!photos || photos.length === 0) && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Portfolio coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
