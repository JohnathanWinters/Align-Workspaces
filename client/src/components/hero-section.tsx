import { useState } from "react";
import { User, Menu, X, Building2, Camera, Star, Info, Compass, Images, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "./site-footer";
import { UserIndicator } from "./user-indicator";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-stone-900">
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: "url(/images/hero-bg-bright.webp)",
          backgroundPosition: "43% 25%",
          filter: "brightness(0.85) contrast(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 via-40% to-black/80" />

      <nav className="relative z-20 px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <UserIndicator variant="light" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="button-hero-menu"
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
                    className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                  >
                    {/* Services */}
                    <button onClick={() => { setLocation("/"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-hero">
                      <Building2 className="w-4 h-4" />
                      Align Workspaces
                    </button>
                    {/* Photography */}
                    <div className="border-t border-stone-100 my-1" />
                    <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-hero">
                      <Images className="w-4 h-4" />
                      Portfolio
                    </button>
                    {/* Community */}
                    <div className="border-t border-stone-100 my-1" />
                    <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-hero">
                      <Star className="w-4 h-4" />
                      Featured Pros
                    </button>
                    {/* About & Account */}
                    <div className="border-t border-stone-100 my-1" />
                    <button onClick={() => { setLocation("/our-vision"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-hero">
                      <Compass className="w-4 h-4" />
                      Our Vision
                    </button>
                    <button onClick={() => { setLocation("/support"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-support-hero">
                      <HelpCircle className="w-4 h-4" />
                      Support
                    </button>
                    <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-hero">
                      <User className="w-4 h-4" />
                      Client Portal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-end px-6 pb-24 sm:pb-20 relative z-10">
        <div className="flex-1 sm:min-h-0" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight">
            Your Portrait Is
            <br />
            <span className="italic font-normal">Your First</span>
            <br />
            Impression
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-white/90 text-base sm:text-lg max-w-md mx-auto leading-relaxed mt-4 sm:mt-8 font-normal"
          >
            Design a photoshoot that aligns your work, character, and the impression you want your clients to feel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-5 sm:mt-10 flex flex-col items-center gap-3"
          >
            <Link href="/portrait-builder">
              <button
                data-testid="button-start-configurator"
                className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-white text-black px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 font-medium"
              >
                Build Your Portrait
              </button>
            </Link>
            <Link href="/featured">
              <button
                data-testid="button-featured-hero"
                className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-white px-6 py-2.5 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/10 transition-all duration-300"
              >
                Meet Our Featured Pros
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <SiteFooter variant="dark" />
    </section>
  );
}
