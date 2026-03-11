import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, X, Menu, MapPin, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

const photographers = [
  {
    name: "Armando Ramirez Romero",
    role: "Founder / Photographer",
    image: "/images/photographer-armando.webp",
    bio: "With over 9 years behind the lens, Armando founded Align to help professionals share the story behind their business. Through both photography and technology, he's building a platform that makes it easier for professionals to showcase who they are, what they do, and why they do it.",
  },
];

export default function PhotographersPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.title = "About Armando Ramirez | Miami Portrait Photographer | Align";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="button-back-home-photographers">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Our Vision</span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="button-photographers-menu"
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
                    <Link href="/portraits">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-photographers">
                        <Camera className="w-4 h-4" />
                        Align Portraits
                      </button>
                    </Link>
                    <Link href="/spaces/browse">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-photographers">
                        <MapPin className="w-4 h-4" />
                        Align Spaces
                      </button>
                    </Link>
                    <Link href="/featured">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-photographers">
                        <Star className="w-4 h-4" />
                        Featured Pros
                      </button>
                    </Link>
                    <Link href="/portal">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-photographers">
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
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Behind the Vision
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-photographers-title">
            Meet the Team
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-photographers-page-desc">
            Helping professionals align their presence with how clients experience them.
          </p>
        </motion.div>

        <div className="flex justify-center">
          {photographers.map((photographer, index) => (
            <motion.div
              key={photographer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="max-w-md w-full"
            >
              <Card className="overflow-visible p-0" data-testid={`card-photographer-page-${index}`}>
                <div className="aspect-square overflow-hidden rounded-t-md">
                  <img
                    src={photographer.image}
                    alt={photographer.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    data-testid={`img-photographer-page-${index}`}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase font-medium" data-testid={`text-photographer-page-role-${index}`}>
                      {photographer.role}
                    </p>
                  </div>
                  <h2 className="font-serif text-2xl mb-3" data-testid={`text-photographer-page-name-${index}`}>
                    {photographer.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-photographer-page-bio-${index}`}>
                    {photographer.bio}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
