import { User } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: "url(/images/hero-bg-bright.webp)",
          backgroundPosition: "43% center",
          filter: "brightness(0.85) contrast(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      <nav className="relative z-20 px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Link href="/portal">
              <button
                data-testid="button-client-portal"
                className="flex items-center gap-2 text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors duration-300"
              >
                <User className="w-3.5 h-3.5" />
                Client Portal
              </button>
            </Link>
          </motion.div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-end px-6 pb-20 sm:pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/50 text-sm sm:text-base max-w-sm mx-auto leading-relaxed mt-6 sm:mt-8 font-light"
          >
            Design a photoshoot that aligns your work, character, and the impression you want your clients to feel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 sm:mt-10 flex flex-col items-center gap-4"
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-6 left-0 right-0 z-10 flex justify-center"
      >
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">No scroll</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <motion.div
              className="w-1 h-1 rounded-full bg-white/40"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
