import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatNumber, ratingToColor } from "@/lib/utils";
import type { Game } from "@/types";

type PricedGame = Pick<Game, "is_free" | "price_usd">;
type RatedGame = Pick<Game, "average_rating" | "rating_count">;

/**
 * Price / free state. Green marks free and positive states, matching
 * the storefront convention.
 */
export function GamePrice({ game, className }: { game: PricedGame; className?: string }) {
  const t = useTranslations("games");

  if (game.is_free) {
    return <span className={cn("text-eg-green", className)}>{t("free_to_play")}</span>;
  }
  if (typeof game.price_usd === "number") {
    return <span className={cn("text-eg-text", className)}>${game.price_usd.toFixed(2)}</span>;
  }
  return <span className={cn("text-eg-muted", className)}>{t("price_unknown")}</span>;
}

/** Compact rating, hidden entirely when a game has no rating yet. */
export function GameRating({
  game,
  locale = "en",
  className,
}: {
  game: RatedGame;
  locale?: string;
  className?: string;
}) {
  if (!game.average_rating) return null;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <Star size={11} className={cn("fill-current", ratingToColor(game.average_rating))} aria-hidden="true" />
      <span className={cn("font-semibold", ratingToColor(game.average_rating))}>
        {game.average_rating.toFixed(1)}
      </span>
      {game.rating_count > 0 && (
        <span className="text-eg-muted">({formatNumber(game.rating_count, locale)})</span>
      )}
    </span>
  );
}
