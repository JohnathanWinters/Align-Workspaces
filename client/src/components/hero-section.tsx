import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/hero-bg-bright.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="font-serif text-lg text-white">Brand Vision Studio</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/portfolio">
              <Button variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm" data-testid="link-portfolio-nav">
                Portfolio
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm" data-testid="link-about-nav">
                About Us
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white/70 text-sm tracking-[0.2em] uppercase mb-6 font-medium"
        >
          Professional Photos
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6"
        >
          Portraits That
          <br />
          Define You
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/80 text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
        >
          Design a photoshoot that reflects where you work, who you are, and the emotional impact you want to leave behind.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Button
            onClick={onStart}
            size="lg"
            data-testid="button-start-configurator"
            className="text-base px-8 bg-white text-black border-white/20"
          >
            Design Your Portrait
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <button
            onClick={onStart}
            data-testid="button-scroll-down"
            className="text-white/50 transition-colors"
          >
            <ArrowDown className="w-6 h-6 animate-bounce" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
