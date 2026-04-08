import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GamificationOverlayProps {
  show: "stage" | "milestone" | null;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

const COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

export default function GamificationOverlay({ show }: GamificationOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: -(Math.random() * 400 + 100),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 720 - 360,
      });
    }
    setParticles(newParticles);
  }, [show]);

  return (
    <AnimatePresence>
      {show && particles.length > 0 && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden">
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              animate={{
                x: p.x,
                y: p.y + 800,
                opacity: 0,
                rotate: p.rotation,
                scale: 0.5,
              }}
              transition={{
                duration: 1.5 + Math.random() * 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: Math.random() * 0.3,
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
          {/* Message */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="absolute text-center"
          >
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {show === "stage" ? "Nice!" : "On fire!"}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
