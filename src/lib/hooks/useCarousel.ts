"use client";

import { useEffect, useState } from "react";

/** Storefront carousels advance on the same unhurried cadence. */
export const CAROUSEL_INTERVAL_MS = 5000;

/**
 * Tracks the OS "reduce motion" preference. It is read after mount so the
 * server-rendered markup and the first client render always agree.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return prefersReducedMotion;
}

interface AutoAdvanceOptions {
  /** Autoplay only runs while this is true (paused by the user or by hover/focus). */
  enabled: boolean;
  total: number;
  advance: () => void;
  /** Changing this restarts the timer, e.g. after a manual step. */
  resetKey?: number | string;
  intervalMs?: number;
}

/**
 * Steps a multi-image carousel forward on an interval. Single-image media and
 * the reduced-motion preference simply never start a timer.
 */
export function useAutoAdvance({
  enabled,
  total,
  advance,
  resetKey,
  intervalMs = CAROUSEL_INTERVAL_MS,
}: AutoAdvanceOptions) {
  useEffect(() => {
    if (!enabled || total < 2) return;

    const timer = window.setInterval(advance, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, total, advance, resetKey, intervalMs]);
}
