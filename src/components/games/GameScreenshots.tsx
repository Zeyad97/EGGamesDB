"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Screenshot } from "@/types";

interface GameScreenshotsProps {
  screenshots: Screenshot[];
  title: string;
  /** Cover image shown on its own when the game has no screenshots yet. */
  fallbackImage?: string | null;
}

interface GalleryItem {
  key: string;
  full: string;
  thumbnail: string;
  alt: string;
  /** Cover images are letterboxed instead of cropped. */
  contain: boolean;
}

const controlClasses =
  "flex h-8 w-8 items-center justify-center rounded-sm border border-white/15 bg-black/65 text-white/80 transition-colors hover:border-white/30 hover:text-white";

/**
 * Product gallery: main image, always-available prev/next controls, thumbnail
 * strip, arrow-key support and a fullscreen view. Falls back to a single cover
 * image when the game has no screenshots.
 */
export function GameScreenshots({ screenshots, title, fallbackImage }: GameScreenshotsProps) {
  const t = useTranslations("games");
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const items: GalleryItem[] = screenshots.length
    ? screenshots.map((screenshot, index) => ({
        key: screenshot.id ?? `screenshot-${index}`,
        full: screenshot.path_full,
        thumbnail: screenshot.path_thumbnail || screenshot.path_full,
        alt: t("screenshot_label", { index: index + 1 }),
        contain: false,
      }))
    : fallbackImage
      ? [
          {
            key: "cover",
            full: fallbackImage,
            thumbnail: fallbackImage,
            alt: t("cover_label", { title }),
            contain: true,
          },
        ]
      : [];

  const total = items.length;

  const showPrevious = useCallback(
    () => setCurrent((index) => (index === 0 ? total - 1 : index - 1)),
    [total]
  );
  const showNext = useCallback(
    () => setCurrent((index) => (index === total - 1 ? 0 : index + 1)),
    [total]
  );

  useEffect(() => {
    if (!lightbox) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightbox, showPrevious, showNext]);

  if (!total) {
    return (
      <p className="border border-eg-border bg-eg-card px-4 py-10 text-center text-xs text-eg-muted">
        {t("no_media")}
      </p>
    );
  }

  const active = items[Math.min(current, total - 1)];

  return (
    <div>
      <div
        role="group"
        aria-label={t("gallery_label", { title })}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") showPrevious();
          if (event.key === "ArrowRight") showNext();
        }}
        className="relative aspect-video overflow-hidden border border-eg-border bg-[#0d141b]"
      >
        <Image
          src={active.full}
          alt={active.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className={active.contain ? "object-contain" : "object-cover"}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label={t("previous")}
              className={cn(controlClasses, "absolute top-1/2 start-2 -translate-y-1/2")}
            >
              <ChevronLeft size={17} className="rtl:rotate-180" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label={t("next")}
              className={cn(controlClasses, "absolute top-1/2 end-2 -translate-y-1/2")}
            >
              <ChevronRight size={17} className="rtl:rotate-180" aria-hidden="true" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={t("open_fullscreen")}
          className={cn(controlClasses, "absolute end-2 top-2")}
        >
          <Expand size={14} aria-hidden="true" />
        </button>

        {total > 1 && (
          <span className="absolute bottom-2 end-2 rounded-sm bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
            {current + 1} / {total}
          </span>
        )}
      </div>

      {total > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {items.map((item, index) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-pressed={index === current}
                aria-label={item.alt}
                className={cn(
                  "relative block aspect-video w-24 shrink-0 overflow-hidden border transition-opacity",
                  index === current
                    ? "border-eg-blue opacity-100"
                    : "border-eg-border opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={item.thumbnail}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("gallery_label", { title })}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
        >
          <button
            type="button"
            aria-label={t("close_fullscreen")}
            onClick={() => setLightbox(false)}
            className={cn(controlClasses, "absolute end-4 top-4")}
          >
            <X size={18} aria-hidden="true" />
          </button>

          {total > 1 && (
            <button
              type="button"
              aria-label={t("previous")}
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              className={cn(controlClasses, "absolute start-4 top-1/2 -translate-y-1/2")}
            >
              <ChevronLeft size={20} className="rtl:rotate-180" aria-hidden="true" />
            </button>
          )}

          <div
            className="relative aspect-video w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.full}
              alt={active.alt}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          {total > 1 && (
            <button
              type="button"
              aria-label={t("next")}
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className={cn(controlClasses, "absolute end-4 top-1/2 -translate-y-1/2")}
            >
              <ChevronRight size={20} className="rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
