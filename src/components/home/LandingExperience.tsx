"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks/useCarousel";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface LandingGame {
  id: string;
  title: string;
  developer: string;
  year: number | null;
  media: string[];
}

interface LandingExperienceProps {
  locale: string;
  latest: LandingGame | null;
  previews: LandingGame[];
  usingDemo: boolean;
}

export function LandingExperience({ locale, latest, previews, usingDemo }: LandingExperienceProps) {
  const t = useTranslations("landing");
  const prefersReducedMotion = usePrefersReducedMotion();
  const reducedMotion = prefersReducedMotion === true;
  const [activeMedia, setActiveMedia] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const reelRef = useRef<HTMLElement>(null);
  const reelInView = useInView(reelRef, { amount: 0.16 });

  const media = useMemo(() => {
    if (!latest) return [];
    return [...new Set(latest.media)].filter(Boolean);
  }, [latest]);

  useEffect(() => {
    if (reducedMotion || media.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveMedia((index) => (index + 1) % media.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [media.length, reducedMotion]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (reducedMotion || event.pointerType !== "mouse") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      setParallax({
        x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 10,
        y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 7,
      });
    },
    [reducedMotion]
  );

  const resetParallax = useCallback(() => {
    if (!reducedMotion) setParallax({ x: 0, y: 0 });
  }, [reducedMotion]);

  const title = latest?.title ?? t("empty_state");
  const contentDirection = locale === "ar" ? "rtl" : "ltr";
  const reelCopies = useMemo(() => [...previews, ...previews], [previews]);
  const reelMotion = locale === "ar" ? ["-50%", "0%"] : ["0%", "-50%"];

  return (
    <div className="overflow-hidden bg-eg-darker">
      <section
        className="relative isolate flex min-h-[100svh] overflow-hidden bg-eg-darker"
        aria-labelledby="landing-title"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetParallax}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-3%] z-0"
          animate={{ x: parallax.x, y: parallax.y }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          {media.map((source, index) => {
            if (index !== activeMedia && index !== (activeMedia + 1) % media.length) return null;
            const active = index === activeMedia;
            return (
              <motion.div
                key={source}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0 : 1.15, ease: "easeInOut" }}
              >
                <motion.div
                  className="absolute inset-[-2%]"
                  animate={
                    active && !reducedMotion
                      ? { scale: [1.02, 1.075], x: [0, index % 2 === 0 ? -8 : 8], y: [0, index % 2 === 0 ? -5 : 5] }
                      : { scale: 1.02, x: 0, y: 0 }
                  }
                  transition={
                    active && !reducedMotion
                      ? { duration: 6, ease: "easeInOut" }
                      : { duration: 0 }
                  }
                >
                  <Image
                    src={source}
                    alt=""
                    fill
                    aria-hidden="true"
                    sizes="100vw"
                    preload={index === 0}
                    className="object-cover object-center"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-[#120e0c]/35" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(18,14,12,.94)_0%,rgba(18,14,12,.7)_32%,rgba(18,14,12,.18)_78%,rgba(18,14,12,.38)_100%)] rtl:bg-[linear-gradient(270deg,rgba(18,14,12,.94)_0%,rgba(18,14,12,.7)_32%,rgba(18,14,12,.18)_78%,rgba(18,14,12,.38)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(0deg,rgba(18,14,12,1)_0%,rgba(18,14,12,.5)_28%,transparent_68%)]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-px bg-eg-gold/80" />

        <div
          aria-hidden="true"
          className="landing-hero-curtain pointer-events-none absolute inset-0 z-[3] bg-eg-nav"
        />

        <div
          className="landing-hero-content relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1600px] flex-col justify-end px-6 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-[calc(7rem+env(safe-area-inset-top))] sm:px-10 sm:pb-20 sm:pt-28 lg:px-16 lg:pb-24"
          dir={contentDirection}
        >
          <div aria-hidden="true" className="landing-hero-rule mb-7 h-px w-full max-w-3xl origin-left bg-eg-gold/80 rtl:origin-right" />

          <div className="landing-hero-copy max-w-4xl">
            <div className="landing-hero-enter landing-hero-enter--1 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-eg-gold sm:text-[11px]">
                {t("latest_label")}
              </p>
              {usingDemo && <p className="text-[10px] text-eg-text-sub sm:text-[11px]">{t("demo_label")}</p>}
            </div>

            <h1
              id="landing-title"
              className="landing-hero-enter landing-hero-enter--2 mt-4 max-w-[13ch] text-[clamp(3.25rem,13vw,9.5rem)] font-semibold leading-[0.88] tracking-[-0.065em] text-eg-heading"
            >
              {title}
            </h1>

            <p className="landing-hero-enter landing-hero-enter--3 mt-6 max-w-md text-base leading-7 text-eg-text sm:text-lg sm:leading-8">
              {t("persuasive_line")}
            </p>

            {latest && (
              <p className="landing-hero-enter landing-hero-enter--4 mt-4 text-xs text-eg-text-sub sm:text-sm">
                {latest.developer}
                {latest.year ? <span className="mx-2 text-eg-gold/70">·</span> : null}
                {latest.year}
              </p>
            )}

            <div className="landing-hero-enter landing-hero-enter--5 landing-hero-cta mt-8">
              <Link
                href="/store"
                aria-label={t("entry_aria")}
                className="group relative inline-flex min-h-14 items-center gap-5 overflow-hidden border border-eg-gold bg-eg-gold px-6 text-sm font-semibold text-eg-darker shadow-[0_12px_30px_rgba(0,0,0,.22)] transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-eg-accent-hover hover:bg-eg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-eg-heading active:translate-y-0 sm:px-7"
              >
                <span className="relative z-10">{t("enter")}</span>
                <motion.span
                  aria-hidden="true"
                  className="relative z-10"
                  animate={reducedMotion ? { x: 0 } : { x: [0, 4, 0] }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowUpRight size={18} strokeWidth={1.8} className="rtl:rotate-[-90deg]" />
                </motion.span>
                {!reducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -start-1/2 z-0 w-1/2 skew-x-[-18deg] bg-white/25"
                    initial={{ x: "-120%" }}
                    animate={{ x: "330%" }}
                    transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 3.8, ease: "easeInOut" }}
                  />
                )}
              </Link>
            </div>
          </div>

          {media.length > 0 && (
            <div
              className="landing-hero-progress mt-12 w-full max-w-xl"
              role="img"
              aria-label={`${t("progress_label")}: ${t("progress_item", { current: activeMedia + 1, total: media.length })}`}
            >
              <div className="flex items-center gap-2" aria-hidden="true">
                {media.map((source, index) => (
                  <span key={source} className="relative h-1 flex-1 overflow-hidden bg-white/20">
                    <motion.span
                      className="absolute inset-0 origin-left bg-eg-gold rtl:origin-right"
                      animate={{ scaleX: index <= activeMedia ? 1 : 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-eg-text-sub" aria-hidden="true">
                <span>01</span>
                <span>{String(media.length).padStart(2, "0")}</span>
              </div>
            </div>
          )}
        </div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-eg-text-sub/80"
          animate={reducedMotion ? { opacity: 1, y: 0 } : { opacity: [0.45, 0.9, 0.45], y: [0, 5, 0] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span>{t("scroll_cue")}</span>
          <ChevronDown size={13} strokeWidth={1.5} />
        </motion.div>
      </section>

      <section ref={reelRef} className="relative overflow-hidden bg-eg-dark" aria-labelledby="landing-reel-title" dir={contentDirection}>
        <div aria-hidden="true" className="h-1 bg-eg-nav" />
        <div aria-hidden="true" className="h-px bg-eg-gold/60" />
        <div className="px-6 pb-9 pt-10 sm:px-10 sm:pb-12 sm:pt-14 lg:px-16">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-eg-gold sm:text-[11px]">
              {t("reel_label")}
            </p>
            <h2 id="landing-reel-title" className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.03em] text-eg-heading sm:text-3xl">
              {t("previews_heading")}
            </h2>
          </div>
        </div>

        {previews.length > 0 ? (
          <div className="relative overflow-hidden pb-12 sm:pb-16">
            <motion.div
              className="flex w-max gap-4 px-6 sm:gap-5 sm:px-10 lg:px-16"
              dir="ltr"
              animate={reducedMotion || !reelInView ? { x: 0 } : { x: reelMotion }}
              transition={
                reducedMotion || !reelInView
                  ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 30, repeat: Infinity, ease: "linear", repeatType: "loop" }
              }
            >
              {reelCopies.map((game, index) => {
                const duplicate = index >= previews.length;
                const image = game.media[0];
                return (
                  <article
                    key={`${game.id}-${duplicate ? "duplicate" : "original"}`}
                    aria-hidden={duplicate || undefined}
                    className="w-[76vw] max-w-[420px] shrink-0 sm:w-[42vw] lg:w-[31vw]"
                    dir={contentDirection}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden border border-eg-border bg-eg-surface">
                      {image ? (
                        <Image
                          src={image}
                          alt=""
                          fill
                          aria-hidden="true"
                          sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 31vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-eg-muted">{t("empty_state")}</div>
                      )}
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#12100d]/65 via-transparent to-transparent" />
                    </div>
                    <div className="border-b border-eg-border px-1 py-4">
                      <h3 className="truncate text-lg font-semibold tracking-[-0.025em] text-eg-heading">{game.title}</h3>
                      <p className="mt-1 truncate text-xs text-eg-text-sub">{game.developer}</p>
                    </div>
                  </article>
                );
              })}
            </motion.div>
          </div>
        ) : (
          <p className="px-6 pb-12 text-sm text-eg-muted sm:px-10 lg:px-16">{t("empty_state")}</p>
        )}
      </section>
    </div>
  );
}
