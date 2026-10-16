"use client";

import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { GamePrice, GameRating } from "@/components/games/GamePrice";
import { cn, formatDate } from "@/lib/utils";
import type { Game } from "@/types";

export type GameCardVariant = "default" | "compact" | "capsule" | "list";

interface GameCardProps {
  game: Game;
  locale?: string;
  variant?: GameCardVariant;
  className?: string;
}

function localized(game: Game, locale: string) {
  return {
    title: locale === "ar" && game.title_ar ? game.title_ar : game.title,
    description:
      locale === "ar" && game.short_description_ar
        ? game.short_description_ar
        : game.short_description,
  };
}

/**
 * Dense, image-led game entries. Variants:
 * - `list`    Steam-search style row (catalog, trending lists)
 * - `capsule` shelf capsule (horizontal shelves)
 * - `compact` small row (related games, sidebars)
 * - `default` grid card (developer pages)
 */
export function GameCard({ game, locale = "en", variant = "default", className }: GameCardProps) {
  const { title, description } = localized(game, locale);
  const image = game.header_image || game.capsule_image;

  if (variant === "list") {
    return (
      <Link
        href={`/games/${game.slug}`}
        className={cn(
          "group flex gap-3 border border-transparent px-2.5 py-2 transition-colors hover:border-eg-border hover:bg-eg-surface",
          className
        )}
      >
        <div className="relative aspect-[231/87] w-36 shrink-0 overflow-hidden bg-eg-surface sm:w-44">
          {image ? (
            <Image src={image} alt="" fill sizes="176px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-eg-muted">
              <Gamepad2 size={20} aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-eg-heading transition-colors group-hover:text-eg-blue">
            {title}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-eg-muted">
            {game.release_date ? `${formatDate(game.release_date, locale)} · ` : ""}
            {game.developer_name}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-eg-text-sub">{description}</p>
          {game.tags.length > 0 && (
            <div className="mt-1.5 hidden gap-1 sm:flex">
              {game.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="hidden w-24 shrink-0 flex-col items-end justify-between py-0.5 text-end sm:flex">
          <GameRating game={game} locale={locale} />
          <GamePrice game={game} className="text-xs font-semibold" />
        </div>
      </Link>
    );
  }

  if (variant === "capsule") {
    return (
      <Link
        href={`/games/${game.slug}`}
        className={cn(
          "group w-[200px] shrink-0 sm:w-[230px]",
          className
        )}
      >
        <div className="relative aspect-[460/215] overflow-hidden bg-eg-surface">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="230px"
              className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-eg-muted">
              <Gamepad2 size={22} aria-hidden="true" />
            </span>
          )}
        </div>
        <h3 className="mt-1.5 truncate text-[13px] font-medium text-eg-text-sub transition-colors group-hover:text-eg-blue">
          {title}
        </h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <GamePrice game={game} className="text-xs font-semibold" />
          <GameRating game={game} locale={locale} />
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/games/${game.slug}`}
        className={cn(
          "group flex items-center gap-3 border border-transparent bg-eg-card px-2 py-1.5 transition-colors hover:border-eg-border hover:bg-eg-surface",
          className
        )}
      >
        <div className="relative aspect-[231/87] w-24 shrink-0 overflow-hidden bg-eg-surface">
          {image ? (
            <Image src={image} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-eg-muted">
              <Gamepad2 size={16} aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-medium text-eg-heading transition-colors group-hover:text-eg-blue">
            {title}
          </h3>
          <p className="truncate text-[11px] text-eg-muted">{game.developer_name}</p>
        </div>
        <GamePrice game={game} className="shrink-0 text-[11px] font-semibold" />
      </Link>
    );
  }

  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn("group block border border-eg-border bg-eg-card transition-colors hover:border-eg-border-strong", className)}
    >
      <div className="relative aspect-[460/215] overflow-hidden bg-eg-surface">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-eg-muted">
            <Gamepad2 size={28} aria-hidden="true" />
          </span>
        )}
        {game.status !== "approved" && (
          <span className="absolute start-2 top-2">
            <Badge variant={game.status === "pending" ? "blue" : "red"}>{game.status}</Badge>
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-[13px] font-semibold text-eg-heading transition-colors group-hover:text-eg-blue">
          {title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-eg-muted">{game.developer_name}</p>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-eg-border pt-2">
          <GameRating game={game} locale={locale} />
          <GamePrice game={game} className="text-xs font-semibold" />
        </div>
      </div>
    </Link>
  );
}
