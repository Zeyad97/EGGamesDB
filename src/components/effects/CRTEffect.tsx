"use client";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";

export function CRTEffect() {
  const { crtEffect, scanlines } = useUIStore();
  if (!crtEffect && !scanlines) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden>
      {scanlines && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2px)",
          }}
        />
      )}
      {crtEffect && (
        <>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(ellipse at center, transparent 60%, black 100%)",
            }}
          />
          <div className="absolute inset-0 animate-crt-flicker opacity-[0.015] bg-white" />
        </>
      )}
    </div>
  );
}

export function GlitchText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block group", className)}>
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 text-eg-gold opacity-0 group-hover:opacity-100 animate-glitch-1 pointer-events-none select-none"
        aria-hidden
      >
        {children}
      </span>
      <span
        className="absolute inset-0 text-red-400 opacity-0 group-hover:opacity-60 animate-glitch-2 pointer-events-none select-none"
        aria-hidden
      >
        {children}
      </span>
    </span>
  );
}
