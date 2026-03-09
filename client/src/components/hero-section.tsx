import { useState, useEffect, useRef, useCallback } from "react";
import { User, Menu, X, Building2, Camera, Star } from "lucide-react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollOffset = useSpring(0, { stiffness: 400, damping: 35 });
  const y = useTransform(scrollOffset, (v) => v);
  const scale = useTransform(scrollOffset, [-10, 0, 10], [0.997, 1, 0.997]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.max(-10, Math.min(10, e.deltaY * 0.1));
    scrollOffset.set(delta);

    setTimeout(() => {
      scrollOffset.set(0);
    }, 120);
  }, [scrollOffset]);

  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const delta = (touchStartY.current - e.touches[0].clientY) * 0.5;
    const clamped = Math.max(-10, Math.min(10, delta * 0.3));
    scrollOffset.set(clamped);
  }, [scrollOffset]);

  const handleTouchEnd = useCallback(() => {
    scrollOffset.set(0);
  }, [scrollOffset]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <section ref={sectionRef} className="relative h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-stone-900">
      <motion.div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: "url(/images/hero-bg-bright.webp)",
          backgroundPosition: "43% 10%",
          filter: "brightness(0.85) contrast(1.05)",
          y,
          scale,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 via-40% to-black/80" />

      <nav className="relative z-20 px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-hero-menu"
              className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white/90 font-semibold transition-colors duration-300"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              Menu
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                >
                  <Link href="/spaces">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3" data-testid="link-spaces-hero">
                      <Building2 className="w-4 h-4" />
                      Align Spaces
                    </button>
                  </Link>
                  <Link href="/portal">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3" data-testid="link-portal-hero">
                      <User className="w-4 h-4" />
                      Client Portal
                    </button>
                  </Link>
                  <Link href="/featured">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3" data-testid="link-featured-hero">
                      <Star className="w-4 h-4" />
                      Featured Pros
                    </button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-end px-6 pb-6 sm:pb-20 relative z-10">
        <div className="flex-1 min-h-[38dvh] sm:min-h-0" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-center max-w-2xl mx-auto"
          style={{ y }}
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight">
            Your Portrait Is
            <br />
            <span className="italic font-normal">Your First</span>
            <br />
            Impression
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/50 text-sm sm:text-base max-w-sm mx-auto leading-relaxed mt-4 sm:mt-8 font-light"
          >
            Design a photoshoot that aligns your work, character, and the impression you want your clients to feel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-5 sm:mt-10 flex flex-col items-center gap-3"
          >
            <button
              onClick={onStart}
              data-testid="button-start-configurator"
              className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-white text-black px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 font-medium"
            >
              Begin Your Session
            </button>
            <Link href="/featured">
              <button
                data-testid="button-featured-hero"
                className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors duration-300"
              >
                Meet Our Featured Professionals
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
