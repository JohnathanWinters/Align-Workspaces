import { Button } from "@/components/ui/button";
import { ArrowDown, User } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState, useCallback } from "react";
import { Link } from "wouter";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-60, 0, 60], [0.6, 1, 0.6]);
  const scale = useTransform(y, [-60, 0, 60], [0.98, 1, 0.98]);
  const [hintText, setHintText] = useState("");

  const handleDragEnd = useCallback(() => {
    setHintText("");
  }, []);

  const handleDrag = useCallback((_: any, info: { offset: { y: number } }) => {
    if (Math.abs(info.offset.y) > 15) {
      setHintText("Tap the button below to get started");
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#1a1a1a]">
      <motion.section
        className="relative min-h-screen flex flex-col overflow-hidden touch-pan-x"
        style={{ opacity, scale }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div
          className="absolute inset-0 bg-cover scale-[1.02]"
          style={{ backgroundImage: "url(/images/hero-bg-bright.png)", backgroundPosition: "43% center", filter: "contrast(1.06) brightness(1.03) blur(0.5px)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/images/logo-mountain-1.png" alt="Align logo" className="h-12 invert" />
            </div>
            <Link href="/portal">
              <button
                data-testid="button-client-portal"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm bg-white/5 hover:bg-white/10"
              >
                <User className="w-4 h-4" />
                Client Portal
              </button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto flex flex-col items-center flex-1 justify-end pb-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4"
          >
            Your Portrait is
            <br />
            Your First Impression
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/80 text-sm sm:text-base max-w-md mx-auto leading-relaxed"
          >
            Helping you design a photoshoot that aligns you work, character, and the impression you want your clients to feel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col items-center gap-3 mt-4"
          >
            <ArrowDown className="w-6 h-6 text-white/50 animate-bounce" />
            <Button
              onClick={onStart}
              size="lg"
              data-testid="button-start-configurator"
              className="text-base px-8 bg-white text-black border-white/20"
            >
              Start Designing Your Shoot
            </Button>
          </motion.div>
        </div>

      </motion.section>
    </div>
  );
}
