import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GameCard } from "@/components/games/GameCard";
import type { Game } from "@/types";

interface FeaturedGamesProps {
  games: Game[];
  locale: string;
}

/** Horizontal capsule shelf of the highest rated games. */
export function FeaturedGames({ games, locale }: FeaturedGamesProps) {
  const t = useTranslations("home");

  return (
    <section className="store-section py-5" aria-labelledby="shelf-top-rated">
      <div className="store-container">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="shelf-top-rated" className="store-title">
            {t("top_rated")}
          </h2>
          <Link
            href="/games?sort=average_rating"
            className="text-xs text-eg-blue transition-colors hover:text-white"
          >
            {t("view_all")}
          </Link>
        </div>

        {games.length > 0 ? (
          <div className="store-row">
            {games.map((game) => (
              <GameCard key={game.id} game={game} locale={locale} variant="capsule" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-eg-muted">{t("empty_shelf")}</p>
        )}
      </div>
    </section>
  );
}
