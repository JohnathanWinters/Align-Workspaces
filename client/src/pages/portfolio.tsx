import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Palette, Eye, Tag, X, Menu, Camera, MapPin, Users, Star, Building2, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import type { PortfolioPhoto, ColorSwatch } from "@shared/schema";
import { UserIndicator } from "@/components/user-indicator";
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
  const crop = (photo.cropPosition as { x: number; y: number; zoom: number } | null) || { x: 50, y: 50, zoom: 1 };
  const isSpaces = photo.category === "spaces";
  const subjectName = (photo as any).subjectName as string | null;
  const subjectProfession = (photo as any).subjectProfession as string | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`${isSpaces ? "aspect-[4/3]" : "aspect-[3/4]"} rounded-lg overflow-hidden relative cursor-pointer group break-inside-avoid mb-4`}
      onClick={() => onPhotoClick(photo)}
      data-testid={`portfolio-full-card-${index}`}
    >
      <img
        src={photo.imageUrl}
        alt={subjectName ? `${subjectName} — portrait by Align Miami` : isSpaces ? "Creative workspace by Align Miami" : "Personal branding portrait by Align Miami"}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{
          objectPosition: `${crop.x}% ${crop.y}%`,
          ...(crop.zoom !== 1 ? { transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` } : {}),
        }}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        data-testid={`portfolio-full-photo-${index}`}
      />

      {subjectName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 md:hidden" data-testid={`name-mobile-${index}`}>
          <p className="text-white/90 text-[13px] font-medium leading-tight">{subjectName}</p>
          {subjectProfession && <p className="text-white/50 text-[11px] mt-0.5">{subjectProfession}</p>}
        </div>
      )}

      {!subjectName && palette.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 md:hidden" data-testid={`palette-mobile-full-${index}`}>
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
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-10 transition-opacity duration-300 hidden md:block opacity-0 group-hover:opacity-100"
        data-testid={`portfolio-full-overlay-${index}`}
      >
        {subjectName ? (
          <div>
            <p className="text-white/90 text-[13px] font-medium leading-tight">{subjectName}</p>
            {subjectProfession && <p className="text-white/50 text-[11px] mt-0.5">{subjectProfession}</p>}
          </div>
        ) : palette.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {palette.map((swatch, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm border border-white/20"
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function PhotoLightbox({ photo, onClose }: { photo: PortfolioPhoto | null; onClose: () => void }) {
  const palette = photo ? (photo.colorPalette as ColorSwatch[] | null) || [] : [];
  const subjectName = photo ? (photo as any).subjectName as string | null : null;
  const subjectProfession = photo ? (photo as any).subjectProfession as string | null : null;

  return (
    <Dialog open={!!photo} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden border-none bg-black/95 max-h-[90vh]" data-testid="photo-lightbox-full" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Photo Details</DialogTitle>
        <div className="flex flex-col md:flex-row max-h-[90vh]">
          <div className="relative flex-1 min-h-[300px] md:min-h-[500px]">
            {photo && (
              <img
                src={photo.imageUrl}
                alt={subjectName ? `${subjectName} portrait detail` : "Professional branding portrait detail - Align Miami"}
                className="w-full h-full object-cover"
                data-testid="lightbox-image-full"
              />
            )}
          </div>

          <div className="w-full md:w-72 bg-card p-5 flex flex-col gap-4 overflow-y-auto" data-testid="lightbox-palette-panel-full">
            {subjectName && (
              <div className="pb-3 border-b border-border">
                <h3 className="font-serif text-lg font-semibold" data-testid="lightbox-subject-name">{subjectName}</h3>
                {subjectProfession && (
                  <p className="text-sm text-muted-foreground">{subjectProfession}</p>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Color Palette</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {photo?.category === "spaces" ? "Colors defining this space" : "Colors featured in this portrait"}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"people" | "spaces">("people");

  useEffect(() => {
    document.title = "Portfolio | Miami Personal Branding Photography | Align";
  }, []);

  const { data: photos, isLoading } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos"],
  });

  const filteredPhotos = photos?.filter(p => (p.category || "people") === activeCategory) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Our Work</span>
            <div className="flex items-center gap-3">
              <UserIndicator />
              <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="button-portfolio-menu"
                className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="hidden sm:inline">Menu</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[200px] z-[9999]"
                  >
                    <Link href="/portrait-builder">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-portfolio">
                        <Camera className="w-4 h-4" />
                        Portrait Builder
                      </button>
                    </Link>
                    <Link href="/workspaces">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-portfolio">
                        <MapPin className="w-4 h-4" />
                        Align Spaces
                      </button>
                    </Link>
                    <Link href="/featured">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-portfolio">
                        <Star className="w-4 h-4" />
                        Featured Pros
                      </button>
                    </Link>
                    <Link href="/our-vision">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-portfolio">
                        <Info className="w-4 h-4" />
                        Our Vision
                      </button>
                    </Link>
                    <Link href="/portal">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-portfolio">
                        <Users className="w-4 h-4" />
                        Client Portal
                      </button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-portfolio-title">
            {activeCategory === "people" ? "First Impressions" : "Our Spaces"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-portfolio-desc">
            {activeCategory === "people"
              ? "Every portrait here was built around one question \u2014 how should your clients feel before you say a word?"
              : "Spaces designed for the work you do. Click any photo to see its color palette and atmosphere."}
          </p>
        </motion.div>

        {activeCategory === "people" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto text-center mb-10 px-4"
            data-testid="portfolio-testimonial"
          >
            <blockquote className="relative">
              <span className="absolute -top-4 -left-2 text-[#c9a96e]/30 text-5xl font-serif leading-none select-none" aria-hidden="true">"</span>
              <p className="text-[15px] sm:text-base text-stone-600 italic leading-relaxed pl-4">
                I was nervous about getting professional photos done, but the whole process felt like a conversation, not a photoshoot. When I saw the final images I thought, that's actually how I want people to see me.
              </p>
              <footer className="mt-3 text-xs text-stone-400 tracking-wide uppercase">
                Edith C. · Therapist, Miami
              </footer>
            </blockquote>
          </motion.div>
        )}

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-stone-100 rounded-full p-1 gap-1" data-testid="toggle-portfolio-category">
            <button
              onClick={() => setActiveCategory("people")}
              data-testid="toggle-category-people"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === "people"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Users className="w-4 h-4" />
              People
            </button>
            <button
              onClick={() => setActiveCategory("spaces")}
              data-testid="toggle-category-spaces"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === "spaces"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Spaces
            </button>
          </div>
        </div>

        {isLoading && (
          <div className={activeCategory === "spaces"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "columns-2 sm:columns-3 lg:columns-4 gap-4"
          }>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`${activeCategory === "spaces" ? "aspect-[4/3]" : "aspect-[3/4]"} rounded-lg bg-foreground/5 animate-pulse ${activeCategory === "people" ? "mb-4 break-inside-avoid" : ""}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isLoading && filteredPhotos.length > 0 && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={activeCategory === "spaces"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "columns-2 sm:columns-3 lg:columns-4 gap-4"
              }
              data-testid="portfolio-full-grid"
            >
              {filteredPhotos.map((photo, index) => (
                <PortfolioCard key={photo.id} photo={photo} index={index} onPhotoClick={setSelectedPhoto} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && filteredPhotos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {activeCategory === "spaces" ? "Space photos coming soon." : "Portfolio coming soon."}
            </p>
          </div>
        )}

        <motion.div
          key={`cta-${activeCategory}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mt-16 mb-4"
        >
          {activeCategory === "people" ? (
            <div className="text-center bg-gradient-to-br from-[#faf6f1] to-[#f5ede3] rounded-2xl px-6 py-12 sm:py-16 border border-[#e8ddd0]/60" data-testid="cta-people-portfolio">
              <h2 className="font-serif text-2xl sm:text-3xl mb-3">Ready to build yours?</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                Tell us how you want clients to feel. We'll build the session around it, from color palette to setting to emotion.
              </p>
              <Link href="/portrait-builder">
                <button
                  data-testid="button-cta-builder"
                  className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-stone-900 text-white px-8 py-3.5 rounded-full hover:bg-stone-800 transition-all duration-300 font-medium"
                >
                  Build your session around your brand
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="text-center bg-gradient-to-br from-[#faf6f1] to-[#f5ede3] rounded-2xl px-6 py-12 sm:py-16 border border-[#e8ddd0]/60" data-testid="cta-spaces-portfolio">
              <h2 className="font-serif text-2xl sm:text-3xl mb-3">Find or List a Space</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                Match a space's palette to your portrait. Or share your own space with the Align community.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/workspaces">
                  <button
                    data-testid="button-cta-browse-spaces"
                    className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-stone-900 text-white px-8 py-3.5 rounded-full hover:bg-stone-800 transition-all duration-300 font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    Explore Spaces
                  </button>
                </Link>
                <Link href="/portal">
                  <button
                    data-testid="button-cta-list-space"
                    className="inline-flex items-center gap-2 text-sm tracking-widest uppercase border border-stone-300 text-stone-700 px-8 py-3.5 rounded-full hover:bg-stone-100 transition-all duration-300 font-medium"
                  >
                    <Building2 className="w-4 h-4" />
                    List Your Space
                  </button>
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </div>
  );
}
