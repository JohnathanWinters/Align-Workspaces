import { useEffect, useRef, useCallback } from "react";
import { User } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Link } from "wouter";

export default function AlignSpacesPage() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollOffset = useSpring(0, { stiffness: 400, damping: 35 });
  const y = useTransform(scrollOffset, (v) => v);
  const scale = useTransform(scrollOffset, [-10, 0, 10], [0.997, 1, 0.997]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.max(-10, Math.min(10, e.deltaY * 0.1));
    scrollOffset.set(delta);
    setTimeout(() => { scrollOffset.set(0); }, 120);
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

  useEffect(() => {
    document.title = "Align Spaces | Rent Workspaces for Your Profession in Miami";
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden bg-stone-900" data-testid="section-spaces-hero">
      <motion.div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: "url(/images/spaces-hero.png)",
          backgroundPosition: "center center",
          filter: "brightness(0.7) contrast(1.05)",
          y,
          scale,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75" />

      <nav className="relative z-20 px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Link href="/">
              <button
                data-testid="button-back-home"
                className="flex items-center gap-2 text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors duration-300"
              >
                Align Portraits
              </button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Link href="/portal">
              <button
                data-testid="button-client-portal-spaces"
                className="flex items-center gap-2 text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors duration-300"
              >
                <User className="w-3.5 h-3.5" />
                Client Portal
              </button>
            </Link>
          </motion.div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-end px-6 pb-36 sm:pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-center max-w-2xl mx-auto"
          style={{ y }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c4956a] font-semibold mb-4">Align Spaces</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight">
            Your Space,
            <br />
            <span className="italic font-normal">Your Practice</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/50 text-sm sm:text-base max-w-sm mx-auto leading-relaxed mt-6 sm:mt-8 font-light"
          >
            Find and rent professional workspaces in Miami — therapy offices, training studios, meeting rooms, and more. Built for small business professionals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 sm:mt-10 flex flex-col items-center gap-4"
          >
            <Link href="/spaces/browse">
              <button
                data-testid="button-explore-spaces"
                className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-white text-black px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 font-medium"
              >
                Explore Spaces
              </button>
            </Link>
            <Link href="/featured">
              <button
                data-testid="button-featured-spaces"
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
