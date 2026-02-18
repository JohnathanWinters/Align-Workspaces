import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { PortfolioPhoto } from "@shared/schema";

export function PortfolioSection() {
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
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="aspect-[3/4] rounded-md overflow-hidden"
            >
              <img
                src={photo.imageUrl}
                alt="Portfolio photo"
                className="w-full h-full object-cover"
                data-testid={`portfolio-preview-${index}`}
              />
            </motion.div>
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
    </section>
  );
}
