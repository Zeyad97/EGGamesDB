import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GameCard } from "@/components/games/GameCard";
import { CATALOG_GENRES } from "@/components/games/genres";
import type { Game } from "@/types";

interface LatestGamesProps {
  games: Game[];
  locale: string;
}

/**
 * New & Trending: a dense row list next to a compact genre index.
 * Replaces the old icon-tile genre grid.
 */
export function LatestGames({ games, locale }: LatestGamesProps) {
  const t = useTranslations("home");

  const genreLabel = (genre: string) => {
    const key = `genre_${genre.toLowerCase()}`;
    return t.has(key) ? t(key) : genre;
  };

  return (
    <section className="store-section py-5" aria-labelledby="shelf-new-trending">
      <div className="store-container grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="shelf-new-trending" className="store-title">
              {t("new_trending")}
            </h2>
            <Link
              href="/games?sort=release_date"
              className="inline-flex min-h-10 items-center text-xs text-eg-blue transition-colors hover:text-white sm:min-h-0"
            >
              {t("view_all")}
            </Link>
          </div>

          {games.length > 0 ? (
            <div className="divide-y divide-eg-border border-y border-eg-border">
              {games.map((game) => (
                <GameCard key={game.id} game={game} locale={locale} variant="list" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-eg-muted">{t("empty_latest")}</p>
          )}
        </div>

        <aside className="lg:pt-8">
          <h2 className="mb-2 text-[11px] font-semibold text-eg-muted">{t("browse_genre")}</h2>
          <ul className="space-y-1">
            {CATALOG_GENRES.map((genre) => (
              <li key={genre}>
                <Link
                  href={`/games?genre=${encodeURIComponent(genre)}`}
                  className="inline-flex min-h-10 items-center border-s border-eg-border ps-2 text-xs text-eg-text-sub transition-colors hover:border-eg-blue hover:text-white sm:min-h-0"
                >
                  {genreLabel(genre)}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
