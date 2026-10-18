"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CATALOG_GENRES } from "@/components/games/genres";
import { cn } from "@/lib/utils";
import type { GameFilters } from "@/types";

interface GameFiltersBarProps {
  currentFilters: GameFilters;
  totalCount: number;
  locale: string;
}

/**
 * Catalog filtering: a narrow genre/sort sidebar on desktop, a compact
 * control row with a collapsible genre list on mobile. All state lives in
 * the URL, so pagination and links keep working.
 */
export function GameFiltersBar({ currentFilters, totalCount, locale }: GameFiltersBarProps) {
  const t = useTranslations("games");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentFilters.search ?? "");
  const [genresOpen, setGenresOpen] = useState(false);

  const genreLabel = (genre: string) => {
    const key = `genre_${genre.toLowerCase()}`;
    return th.has(key) ? th(key) : genre;
  };

  const hrefFor = (changes: Partial<GameFilters>) => {
    const merged = { ...currentFilters, ...changes };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", merged.search);
    if (merged.genre) params.set("genre", merged.genre);
    if (merged.tag) params.set("tag", merged.tag);
    if (merged.sortBy && merged.sortBy !== "created_at") params.set("sort", merged.sortBy);
    if (merged.page && merged.page > 1) params.set("page", String(merged.page));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const update = (changes: Partial<GameFilters>) => {
    startTransition(() => router.push(hrefFor(changes)));
  };

  const active = Boolean(currentFilters.search || currentFilters.genre || currentFilters.tag);
  const sortOptions = [
    { value: "created_at", label: t("sort_newest") },
    { value: "average_rating", label: t("sort_rating") },
    { value: "view_count", label: t("sort_popular") },
    { value: "title", label: t("sort_title") },
    { value: "release_date", label: t("release_date") },
  ];

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update({ search: search.trim() || undefined, page: undefined });
  };

  const clearAll = () => {
    setSearch("");
    update({ search: undefined, genre: undefined, tag: undefined, page: undefined });
  };

  const status = pending
    ? tc("loading")
    : `${totalCount.toLocaleString(locale)} ${t("games_found")}`;

  const genreList = (
    <ul className="space-y-0.5">
      <li>
        <button
          type="button"
          onClick={() => update({ genre: undefined, page: undefined })}
          aria-pressed={!currentFilters.genre}
          className={cn(
            "block min-h-10 w-full border-s ps-2 text-start text-xs transition-colors lg:min-h-0",
            !currentFilters.genre
              ? "border-eg-blue text-white"
              : "border-eg-border text-eg-text-sub hover:border-eg-border-strong hover:text-white"
          )}
        >
          {t("genre_all")}
        </button>
      </li>
      {CATALOG_GENRES.map((genre) => {
        const isActive = currentFilters.genre === genre;
        return (
          <li key={genre}>
            <button
              type="button"
              onClick={() => update({ genre: isActive ? undefined : genre, page: undefined })}
              aria-pressed={isActive}
              className={cn(
                "block min-h-10 w-full border-s ps-2 text-start text-xs transition-colors lg:min-h-0",
                isActive
                  ? "border-eg-blue text-white"
                  : "border-eg-border text-eg-text-sub hover:border-eg-border-strong hover:text-white"
              )}
            >
              {genreLabel(genre)}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile controls */}
      <div className="lg:hidden">
        <div className="flex gap-2">
          <form onSubmit={submitSearch} className="min-w-0 flex-1" role="search">
            <label htmlFor="catalog-search-mobile" className="sr-only">
              {tc("search")}
            </label>
            <div className="flex h-10 items-center border border-eg-border bg-eg-darker focus-within:border-eg-blue/70">
              <input
                id="catalog-search-mobile"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("search_placeholder")}
                className="h-full min-h-10 w-full min-w-0 bg-transparent px-2.5 text-base text-eg-text placeholder:text-eg-muted focus:outline-none lg:min-h-0 lg:text-[13px]"
              />
              <button
                type="submit"
                aria-label={tc("search")}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-eg-muted transition-colors hover:text-white"
              >
                <Search size={15} aria-hidden="true" />
              </button>
            </div>
          </form>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setGenresOpen((open) => !open)}
            aria-expanded={genresOpen}
            aria-controls="catalog-genres-mobile"
            className="gap-1.5"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            {tc("filter")}
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="w-40">
            <Select
              aria-label={t("sort_by")}
              options={sortOptions}
              value={currentFilters.sortBy ?? "created_at"}
              onChange={(event) => update({ sortBy: event.target.value as GameFilters["sortBy"], page: undefined })}
            />
          </div>
          {active && (
            <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="gap-1.5">
              <X size={14} aria-hidden="true" />
              {t("clear")}
            </Button>
          )}
          <p className="ms-auto text-[11px] text-eg-muted">{status}</p>
        </div>

        {genresOpen && (
          <div id="catalog-genres-mobile" className="mt-3 border border-eg-border bg-eg-card p-3">
            <p className="mb-2 text-[11px] font-semibold text-eg-muted">{t("filter_genre")}</p>
            <div className="grid grid-cols-2 gap-x-3">{genreList}</div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label={t("filters")}>
        <form onSubmit={submitSearch} role="search" className="mb-4">
          <label htmlFor="catalog-search" className="sr-only">
            {tc("search")}
          </label>
          <div className="flex h-8 items-center border border-eg-border bg-eg-darker focus-within:border-eg-blue/70">
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search_placeholder")}
              className="h-full min-h-10 w-full min-w-0 bg-transparent px-2.5 text-base text-eg-text placeholder:text-eg-muted focus:outline-none lg:min-h-0 lg:text-[13px]"
            />
            <button
              type="submit"
              aria-label={tc("search")}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-eg-muted transition-colors hover:text-white"
            >
              <Search size={14} aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="mb-4">
          <label htmlFor="catalog-sort" className="mb-1.5 block text-[11px] font-semibold text-eg-muted">
            {t("sort_by")}
          </label>
          <Select
            id="catalog-sort"
            options={sortOptions}
            value={currentFilters.sortBy ?? "created_at"}
            onChange={(event) => update({ sortBy: event.target.value as GameFilters["sortBy"], page: undefined })}
            className="py-1.5"
          />
        </div>

        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold text-eg-muted">{t("filter_genre")}</p>
          {genreList}
        </div>

        {currentFilters.tag && (
          <div className="mb-4">
            <p className="mb-1.5 text-[11px] font-semibold text-eg-muted">{t("filter_tag")}</p>
            <button
              type="button"
              onClick={() => update({ tag: undefined, page: undefined })}
              className="inline-flex items-center gap-1.5 rounded-sm border border-eg-blue/40 bg-eg-blue/10 px-2 py-1 text-[11px] text-eg-blue"
            >
              {currentFilters.tag}
              <X size={11} aria-hidden="true" />
            </button>
          </div>
        )}

        {active && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="mb-3 w-full gap-1.5">
            <X size={14} aria-hidden="true" />
            {t("clear")}
          </Button>
        )}

        <p className="border-t border-eg-border pt-3 text-[11px] text-eg-muted">{status}</p>
      </aside>
    </>
  );
}
