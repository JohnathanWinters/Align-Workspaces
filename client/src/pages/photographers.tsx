import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Sparkles, X, Menu, MapPin, Star, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import armandoPhoto from "@assets/14764699-b1dd-4fe8-88ff-ed19c87cc1f8_1773349252752.png";
import { UserIndicator } from "@/components/user-indicator";

const founderSections = [
  {
    paragraphs: [
      "Align was founded with a simple belief — the spaces where professionals meet their clients should reflect the care behind their work.",
      "As more professionals build independent practices, the environment where that work happens becomes part of the experience itself. A thoughtful space can shape trust, comfort, and the way a service is perceived.",
    ],
  },
  {
    title: "The Problem",
    paragraphs: [
      "Yet many professionals struggle to find spaces that support the work they are doing. Offices can feel temporary, overly corporate, or disconnected from the experience they want to create for their clients.",
      "At the same time, many small businesses are working to present themselves clearly and professionally, but lack the environment and imagery that reflects the quality of their work.",
    ],
  },
  {
    title: "Why Align Exists",
    paragraphs: [
      "Align was created to bring those pieces together.",
      "We help therapists, coaches, and independent professionals find thoughtful workspaces while also helping them present their work with clarity. The goal is simple — support small businesses in creating environments and imagery that align with the work they do every day.",
    ],
  },
  {
    title: "Where We're Going",
    paragraphs: [
      "Our vision is to make it easier for professionals to build practices that feel intentional from the inside out — from the space they work in to the way their work is seen and understood.",
    ],
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
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="button-back-home-photographers">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Our Vision</span>
            <div className="flex items-center gap-3">
              <UserIndicator />
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
                      <Link href="/portrait-builder">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-photographers">
                          <Camera className="w-4 h-4" />
                          Portrait Builder
                        </button>
                      </Link>
                      <Link href="/workspaces">
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
                      <Link href="/our-vision">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-photographers">
                          <Info className="w-4 h-4" />
                          Our Vision
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
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Our Vision
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-photographers-title">
            Where Your Work and Space Align
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-16 sm:mb-20 space-y-6"
          data-testid="text-vision-statement"
        >
          <p className="text-foreground/80 text-base sm:text-lg leading-relaxed">
            Align was created from a simple idea — the spaces where meaningful work happens should reflect the people doing it.
          </p>
          <p className="text-foreground/80 text-base sm:text-lg leading-relaxed">
            Many small business professionals rely on trust, presence, and connection in the room, yet the environments available to them often feel disconnected from the work they offer.
          </p>
          <p className="text-foreground/80 text-base sm:text-lg leading-relaxed">
            Align exists to bring those pieces together — helping professionals align their workspace, their image, and the experience they create for their clients.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="text-center mb-10"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Behind the Vision
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl" data-testid="text-team-heading">
            Meet the Founder
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="overflow-visible p-0" data-testid="card-photographer-page-0">
            <div className="md:flex">
              <div className="md:w-2/5 flex-shrink-0">
                <div className="aspect-square md:aspect-auto md:h-full overflow-hidden rounded-t-md md:rounded-t-none md:rounded-l-md">
                  <img
                    src={armandoPhoto}
                    alt="Armando Ramirez Romero"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    data-testid="img-photographer-page-0"
                  />
                </div>
              </div>
              <div className="p-6 sm:p-8 md:w-3/5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase font-medium" data-testid="text-photographer-page-role-0">
                    Founder
                  </p>
                </div>
                <h2 className="font-serif text-2xl mb-5" data-testid="text-photographer-page-name-0">
                  Armando Ramirez Romero
                </h2>
                <div className="space-y-5" data-testid="text-photographer-page-bio-0">
                  {founderSections.map((section, i) => (
                    <div key={i}>
                      {section.title && (
                        <h3 className="text-xs uppercase tracking-[0.15em] text-[#c4956a] font-semibold mb-2">
                          {section.title}
                        </h3>
                      )}
                      <div className="space-y-2.5">
                        {section.paragraphs.map((p, j) => (
                          <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
