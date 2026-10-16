"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ExternalLink, Gamepad2, Pause, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { GamePrice, GameRating } from "@/components/games/GamePrice";
import { EgyptFlag } from "@/components/layout/Brand";
import { cn } from "@/lib/utils";
import { useAutoAdvance, usePrefersReducedMotion } from "@/lib/hooks/useCarousel";
import type { Game } from "@/types";

interface HeroSectionProps {
  game: Game;
  locale: string;
}

interface HeroSlide {
  key: string;
  src: string;
  thumbnail: string;
  label: string;
}

const controlClasses =
  "flex h-8 w-8 items-center justify-center rounded-sm border border-white/15 bg-black/65 text-white/80 transition-colors hover:border-eg-gold/70 hover:text-eg-gold";

/**
 * Above-the-fold storefront feature: one real game, its media as a small
 * carousel on the start side and its store facts on the end side. No marketing
 * copy.
 */
export function HeroSection({ game, locale }: HeroSectionProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tg = useTranslations("games");
  const [activeShot, setActiveShot] = useState(0);
  const [interacting, setInteracting] = useState(false);
  /** `null` means "follow the system preference"; a press stores explicit intent. */
  const [playIntent, setPlayIntent] = useState<boolean | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const playing = playIntent ?? !prefersReducedMotion;

  const title = locale === "ar" && game.title_ar ? game.title_ar : game.title;
  const description =
    locale === "ar" && game.short_description_ar ? game.short_description_ar : game.short_description;
  const screenshots = (game.screenshots ?? []).slice(0, 5);
  const cover = game.header_image || game.capsule_image;

  const slides: HeroSlide[] = screenshots
    .filter((shot) => Boolean(shot.path_full))
    .map((shot, index) => ({
      key: shot.id ?? `screenshot-${index}`,
      src: shot.path_full,
      thumbnail: shot.path_thumbnail || shot.path_full,
      label: tg("screenshot_label", { index: index + 1 }),
    }));
  const fallbackSlide: HeroSlide | null = cover
    ? { key: "cover", src: cover, thumbnail: cover, label: tg("cover_label", { title }) }
    : null;
  const gallery = slides.length ? slides : fallbackSlide ? [fallbackSlide] : [];

  const total = gallery.length;
  const current = total ? Math.min(activeShot, total - 1) : 0;
  const active = gallery[current];

  const showPrevious = useCallback(
    () => setActiveShot((index) => (index === 0 ? total - 1 : index - 1)),
    [total]
  );
  const showNext = useCallback(
    () => setActiveShot((index) => (index === total - 1 ? 0 : index + 1)),
    [total]
  );

  useAutoAdvance({
    enabled: playing && !interacting,
    total,
    advance: showNext,
    resetKey: current,
  });

  const developer = game.profiles?.display_name || game.developer_name;
  const developerHref = game.profiles?.username ? `/developers/${game.profiles.username}` : null;

  return (
    <section className="border-b border-eg-border bg-eg-darker py-5" aria-labelledby="storefront-feature">
      <div className="store-container">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <div>
            <div
              role="group"
              aria-roledescription={tg("carousel_role")}
              aria-label={tg("carousel_label", { title })}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") showPrevious();
                if (event.key === "ArrowRight") showNext();
              }}
              onMouseEnter={() => setInteracting(true)}
              onMouseLeave={() => setInteracting(false)}
              onFocusCapture={() => setInteracting(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setInteracting(false);
                }
              }}
              className="relative aspect-video w-full overflow-hidden border border-eg-border bg-eg-darker"
            >
              {active ? (
                <div
                  role="group"
                  aria-roledescription={tg("slide_role")}
                  aria-label={tg("slide_label", { index: current + 1, total })}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 700px"
                    preload={current === 0}
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="flex h-full items-center justify-center text-eg-muted">
                  <Gamepad2 size={26} aria-hidden="true" />
                </span>
              )}

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label={tg("previous")}
                    className={cn(controlClasses, "absolute top-1/2 start-2 -translate-y-1/2")}
                  >
                    <ChevronLeft size={17} className="rtl:rotate-180" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label={tg("next")}
                    className={cn(controlClasses, "absolute top-1/2 end-2 -translate-y-1/2")}
                  >
                    <ChevronRight size={17} className="rtl:rotate-180" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlayIntent(!playing)}
                    aria-label={playing ? tg("pause_slideshow") : tg("play_slideshow")}
                    className={cn(controlClasses, "absolute bottom-2 start-2")}
                  >
                    {playing ? (
                      <Pause size={14} aria-hidden="true" />
                    ) : (
                      <Play size={14} aria-hidden="true" />
                    )}
                  </button>
                  <span className="absolute bottom-2 end-2 rounded-sm bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                    {current + 1} / {total}
                  </span>
                </>
              )}
            </div>

            {total > 1 && (
              <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((slide, index) => (
                  <li key={slide.key}>
                    <button
                      type="button"
                      onClick={() => setActiveShot(index)}
                      aria-pressed={index === current}
                      aria-label={slide.label}
                      className={cn(
                        "relative block aspect-video w-24 shrink-0 overflow-hidden border transition-opacity sm:w-28",
                        index === current
                          ? "border-eg-blue opacity-100"
                          : "border-eg-border opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={slide.thumbnail}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-[11px] font-semibold text-eg-muted">{t("spotlight")}</p>

            <h2 id="storefront-feature" className="mt-1 text-xl font-semibold leading-6">
              <Link href={`/games/${game.slug}`} className="text-eg-heading hover:text-eg-blue">
                {title}
              </Link>
            </h2>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-eg-muted">
              {developerHref ? (
                <Link href={developerHref} className="text-eg-text-sub hover:text-eg-blue">
                  {developer}
                </Link>
              ) : (
                <span className="text-eg-text-sub">{developer}</span>
              )}
              {game.release_date && <span>{new Date(game.release_date).getFullYear()}</span>}
              <GameRating game={game} locale={locale} />
            </div>

            <p className="mt-3 line-clamp-5 text-[13px] leading-6 text-eg-text-sub">{description}</p>

            {(game.genres.length > 0 || game.tags.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {game.genres.slice(0, 3).map((genre) => (
                  <Link key={genre} href={`/games?genre=${encodeURIComponent(genre)}`}>
                    <Badge variant="outline">{genre}</Badge>
                  </Link>
                ))}
                {game.tags.slice(0, 3).map((tag) => (
                  <Link key={tag} href={`/games?tag=${encodeURIComponent(tag)}`}>
                    <Badge>{tag}</Badge>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-eg-muted">{tg("price")}</span>
              <GamePrice game={game} className="font-semibold" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/games/${game.slug}`}
                className="inline-flex h-9 items-center rounded-sm bg-eg-blue px-3.5 text-[13px] font-medium text-eg-darker transition-colors hover:bg-eg-accent-hover"
              >
                {t("view_store_page")}
              </Link>
              {game.steam_url && (
                <a
                  href={game.steam_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-eg-border bg-eg-surface px-3.5 text-[13px] text-eg-text transition-colors hover:border-eg-border-strong hover:text-eg-heading"
                >
                  {game.is_free ? tg("view_on_steam") : tg("buy_on_steam")}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
            </div>

            <p className="mt-auto flex items-center gap-2 pt-4 text-[11px] text-eg-gold">
              <EgyptFlag />
              {tc("made_in_egypt")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
