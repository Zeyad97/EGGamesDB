"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GameCard } from "./GameCard";
import { cn } from "@/lib/utils";
import type { Game, GameFilters } from "@/types";

interface GamesGridProps {
  games: Game[];
  locale: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: Pick<GameFilters, "search" | "genre" | "tag" | "sortBy">;
}

function pageClasses(isActive: boolean, isDisabled = false) {
  return cn(
    "inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-sm border px-2 text-xs transition-colors",
    isActive
      ? "border-eg-blue bg-eg-blue/15 text-white"
      : "border-eg-border bg-eg-card text-eg-text-sub hover:border-eg-border-strong hover:text-white",
    isDisabled && "pointer-events-none opacity-40"
  );
}

/** Catalog results: dense rows, then filter-preserving pagination. */
export function GamesGrid({
  games,
  locale,
  totalCount,
  currentPage,
  pageSize,
  filters,
}: GamesGridProps) {
  const t = useTranslations("games");
  const pathname = usePathname();

  if (!games.length) {
    return (
      <div className="border border-eg-border bg-eg-card px-4 py-10 text-center">
        <p className="text-sm font-medium text-eg-heading">{t("no_results")}</p>
        <p className="mt-1 text-xs text-eg-text-sub">{t("no_results_desc")}</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const windowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => windowStart + index
  );

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.sortBy && filters.sortBy !== "created_at") params.set("sort", filters.sortBy);
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div>
      <div className="divide-y divide-eg-border border-y border-eg-border">
        {games.map((game) => (
          <GameCard key={game.id} game={game} locale={locale} variant="list" />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-1">
          <Link
            href={pageHref(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={pageClasses(false, currentPage === 1)}
          >
            <ChevronLeft size={13} className="rtl:rotate-180" aria-hidden="true" />
            {t("previous")}
          </Link>

          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={pageHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={pageClasses(page === currentPage)}
            >
              {page}
            </Link>
          ))}

          <Link
            href={pageHref(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage === totalPages}
            className={pageClasses(false, currentPage === totalPages)}
          >
            {t("next")}
            <ChevronRight size={13} className="rtl:rotate-180" aria-hidden="true" />
          </Link>
        </nav>
      )}
    </div>
  );
}
