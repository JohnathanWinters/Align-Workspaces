import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col bg-[#0d0d0d]">
      <nav className="relative z-20 px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.img
            src="/images/logo-align.png"
            alt="Align"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-10 sm:h-12 cursor-pointer"
            data-testid="link-home-hero-logo"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Link href="/portal">
              <button
                data-testid="button-client-portal"
                className="flex items-center gap-2 text-xs tracking-widest uppercase text-white/50 hover:text-white transition-colors duration-300"
              >
                <User className="w-3.5 h-3.5" />
                Client Portal
              </button>
            </Link>
          </motion.div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-white/40 mb-6 sm:mb-8 font-light">
            Portrait Photography &mdash; Miami
          </p>

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
            className="text-white/45 text-sm sm:text-base max-w-sm mx-auto leading-relaxed mt-6 sm:mt-8 font-light"
          >
            Design a photoshoot that aligns your work, character, and the impression you want your clients to feel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 sm:mt-10"
          >
            <button
              onClick={onStart}
              data-testid="button-start-configurator"
              className="group relative inline-flex items-center gap-3 text-sm tracking-widest uppercase text-white/80 hover:text-white transition-all duration-500"
            >
              <span className="h-px w-8 bg-white/30 group-hover:w-12 group-hover:bg-white/60 transition-all duration-500" />
              Begin Your Session
              <span className="h-px w-8 bg-white/30 group-hover:w-12 group-hover:bg-white/60 transition-all duration-500" />
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative w-full px-4 sm:px-8 pb-6 sm:pb-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="relative w-full max-w-5xl mx-auto aspect-[16/9] sm:aspect-[21/9] rounded-lg overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: "url(/images/hero-bg-bright.png)",
              backgroundPosition: "43% 30%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 via-transparent to-[#0d0d0d]/20" />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent z-0 pointer-events-none" />
    </section>
  );
}
