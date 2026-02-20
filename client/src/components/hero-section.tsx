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
  const hintOpacity = useTransform(y, [-30, -10, 0, 10, 30], [1, 0.5, 0, 0.5, 1]);
  const hintY = useTransform(y, [-60, 0, 60], [-8, 0, 8]);
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
        className="relative min-h-screen flex items-center justify-center overflow-hidden touch-pan-x"
        style={{ opacity, scale }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-bg-bright.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="font-serif text-lg text-white">Brand Vision Studio</p>
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

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6"
          >
            Your Portrait is
            <br />
            Your First Introduction
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/80 text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Helping you design a photoshoot that aligns your work with your character and the emotional impact you want clients to feel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mb-6"
          >
            <button
              onClick={onStart}
              data-testid="button-scroll-down"
              className="text-white/50 transition-colors"
            >
              <ArrowDown className="w-6 h-6 animate-bounce" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col items-center gap-3"
          >
            <Button
              onClick={onStart}
              size="lg"
              data-testid="button-start-configurator"
              className="text-base px-8 bg-white text-black border-white/20"
            >
              Start Designing Your Shoot
            </Button>
          </motion.div>

          <motion.div
            style={{ opacity: hintOpacity, y: hintY }}
            className="mt-6 pointer-events-none"
          >
            <p className="text-white/60 text-xs transition-opacity duration-300" data-testid="text-scroll-hint">
              {hintText}
            </p>
          </motion.div>
        </div>

      </motion.section>
    </div>
  );
}
