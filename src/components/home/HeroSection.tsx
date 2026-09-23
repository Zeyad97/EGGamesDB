"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, Gamepad2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { GamePrice, GameRating } from "@/components/games/GamePrice";
import { EgyptFlag } from "@/components/layout/Brand";
import { cn } from "@/lib/utils";
import type { Game } from "@/types";

interface HeroSectionProps {
  game: Game;
  locale: string;
}

/**
 * Above-the-fold storefront feature: one real game, its media on the start
 * side and its store facts on the end side. No marketing copy.
 */
export function HeroSection({ game, locale }: HeroSectionProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tg = useTranslations("games");
  const [activeShot, setActiveShot] = useState(0);

  const title = locale === "ar" && game.title_ar ? game.title_ar : game.title;
  const description =
    locale === "ar" && game.short_description_ar ? game.short_description_ar : game.short_description;
  const screenshots = (game.screenshots ?? []).slice(0, 5);
  const media = screenshots[activeShot]?.path_full || game.header_image || game.capsule_image;
  const developer = game.profiles?.display_name || game.developer_name;
  const developerHref = game.profiles?.username ? `/developers/${game.profiles.username}` : null;

  return (
    <section className="border-b border-eg-border bg-eg-darker py-5" aria-labelledby="storefront-feature">
      <div className="store-container">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <div>
            <div className="relative aspect-video w-full overflow-hidden border border-eg-border bg-[#0d141b]">
              {media ? (
                <Image
                  src={media}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  preload
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-eg-muted">
                  <Gamepad2 size={26} aria-hidden="true" />
                </span>
              )}
            </div>

            {screenshots.length > 1 && (
              <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {screenshots.map((shot, index) => (
                  <li key={shot.id ?? index}>
                    <button
                      type="button"
                      onClick={() => setActiveShot(index)}
                      aria-pressed={index === activeShot}
                      aria-label={tg("screenshot_label", { index: index + 1 })}
                      className={cn(
                        "relative block aspect-video w-24 shrink-0 overflow-hidden border transition-opacity sm:w-28",
                        index === activeShot
                          ? "border-eg-blue opacity-100"
                          : "border-eg-border opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={shot.path_thumbnail || shot.path_full}
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
                className="inline-flex h-9 items-center rounded-sm bg-eg-blue px-3.5 text-[13px] font-medium text-[#0f1a24] transition-colors hover:bg-[#8bd2fa]"
              >
                {t("view_store_page")}
              </Link>
              {game.steam_url && (
                <a
                  href={game.steam_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-eg-border bg-eg-surface px-3.5 text-[13px] text-eg-text transition-colors hover:border-eg-border-strong hover:text-white"
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
