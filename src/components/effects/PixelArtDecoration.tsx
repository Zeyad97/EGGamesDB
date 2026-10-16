"use client";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";

const emptySubscribe = () => () => {};

export function PixelController({ className }: { className?: string }) {
  return (
    <motion.div
      className={`text-eg-gold font-pixel select-none ${className}`}
      animate={{ y: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      style={{ fontSize: "clamp(2rem, 5vw, 6rem)", lineHeight: 1 }}
    >
      <pre className="text-[0.4em] leading-[1.1] opacity-70">{`
  ┌─────────────────┐
  │  ▪   ▲   □ ▲ ○ │
  │◄ ■  ═╪═  ✕ ■ ◉ │
  │  ▪   ▼   □ ▼ △ │
  └─────────────────┘`}</pre>
    </motion.div>
  );
}

export function EgyptianPattern({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden>
      <div className="text-eg-gold/5 text-[0.6rem] leading-3 tracking-widest font-mono whitespace-nowrap">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i}>
            {Array.from({ length: 80 }, (_, j) =>
              (i + j) % 4 === 0 ? "𓂀" : (i + j) % 4 === 1 ? "𓃭" : (i + j) % 4 === 2 ? "𓅃" : "𓆙"
            ).join("")}
          </div>
        ))}
      </div>
    </div>
  );
}

// Fixed pixel positions — deterministic so server & client match, no hydration mismatch
const PIXEL_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: (i * 8.33 + 2) % 100,
  delay: (i * 0.4) % 3,
  dur: 3 + (i % 4),
  size: i % 2 === 0 ? "w-1 h-1" : "w-0.5 h-0.5",
}));

export function FloatingPixels() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {PIXEL_DATA.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute ${p.size} bg-eg-gold/40`}
          style={{ left: `${p.x}%`, bottom: "-4px" }}
          animate={{ y: [0, -400, -800], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: p.dur, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}
