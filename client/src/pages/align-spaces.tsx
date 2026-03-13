import { useState, useEffect } from "react";
import { Menu, X, Camera, Star, Info, User, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "@/components/site-footer";
import { UserIndicator } from "@/components/user-indicator";

export default function AlignSpacesPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Align | Flexible Workspaces & Visual Branding for Professionals in Miami";
  }, []);

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-stone-900" data-testid="section-split-hero">
      <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="w-9" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-split-menu"
              className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-white/70 hover:text-white font-semibold transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/10"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              Menu
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                >
                  <button onClick={() => { setLocation("/portraits"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-split">
                    <Camera className="w-4 h-4" />
                    Align Portraits
                  </button>
                  <button onClick={() => { setLocation("/browse"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-split">
                    <Building2 className="w-4 h-4" />
                    Browse Spaces
                  </button>
                  <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-split">
                    <User className="w-4 h-4" />
                    Client Portal
                  </button>
                  <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-split">
                    <Star className="w-4 h-4" />
                    Featured Pros
                  </button>
                  <button onClick={() => { setLocation("/about"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-split">
                    <Info className="w-4 h-4" />
                    About Us
                  </button>
                  <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-split">
                    <Camera className="w-4 h-4" />
                    Our Work
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <UserIndicator variant="light" />
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row min-h-[100dvh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative flex-1 min-h-[50dvh] md:min-h-[100dvh] flex items-end md:items-center justify-center overflow-hidden group cursor-pointer"
          onClick={() => setLocation("/portraits")}
          data-testid="panel-portraits"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
            style={{
              backgroundImage: "url(/images/hero-bg-bright.webp)",
              backgroundPosition: "43% 25%",
              filter: "brightness(0.8) contrast(1.05)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 md:bg-gradient-to-t md:from-black/60 md:via-black/15 md:to-black/35" />

          <div className="relative z-10 text-center px-6 pb-10 pt-24 md:pb-0 md:pt-0 max-w-md mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-[1.1] tracking-tight">
              Your Portrait Is
              <br />
              <span className="italic font-normal">Your First</span>
              <br />
              Impression
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-xs mx-auto leading-relaxed mt-4 font-normal">
              Design a photoshoot that aligns your work, character, and the impression you want your clients to feel.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/portraits/builder"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                data-testid="button-begin-session"
                className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-widest uppercase bg-white text-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 font-medium"
              >
                Begin Your Session
              </Link>
              <Link
                href="/featured"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                data-testid="button-featured-portraits"
                className="inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/10 transition-all duration-300"
              >
                Meet Our Featured Professionals
              </Link>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-6 left-0 right-0 text-center">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Portraits</span>
          </div>
        </motion.div>

        <div className="hidden md:block w-px bg-white/20 relative z-20" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="relative flex-1 min-h-[50dvh] md:min-h-[100dvh] flex items-start md:items-center justify-center overflow-hidden group cursor-pointer"
          onClick={() => setLocation("/browse")}
          data-testid="panel-spaces"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
            style={{
              backgroundImage: "url(/images/spaces-hero.png)",
              backgroundPosition: "center 40%",
              filter: "brightness(0.8) contrast(1.05)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-black/50 md:bg-gradient-to-t md:from-black/60 md:via-black/15 md:to-black/35" />

          <div className="relative z-10 text-center px-6 pt-10 pb-10 md:pb-0 md:pt-0 max-w-md mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-[1.1] tracking-tight">
              Where Your Work
              <br />
              <span className="italic font-normal">and Space</span> Align
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-xs mx-auto leading-relaxed mt-4 font-normal">
              Book professional workspaces across Miami — therapy offices, studios, meeting rooms, and more.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/browse"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                data-testid="button-explore-spaces"
                className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-widest uppercase bg-white text-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 font-medium"
              >
                Explore Spaces
              </Link>
              <Link
                href="/featured"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                data-testid="button-featured-spaces"
                className="inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/10 transition-all duration-300"
              >
                Meet Our Featured Professionals
              </Link>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-6 left-0 right-0 text-center">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Spaces</span>
          </div>
        </motion.div>
      </div>

      <div className="relative z-20">
        <SiteFooter variant="dark" />
      </div>
    </div>
  );
}
