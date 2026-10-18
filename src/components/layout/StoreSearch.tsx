"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { GamePrice } from "@/components/games/GamePrice";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/app/api/search/route";

const DEBOUNCE_MS = 150;
const LISTBOX_SUFFIX = "store-search-listbox";

/**
 * Steam-style live search for the store bar. Fetches prefix suggestions from
 * `/api/search` as the user types and renders them in a dropdown under the
 * input. Plain submit keeps the legacy `/games?search=` navigation.
 */
export function StoreSearch({
  locale,
  onNavigate,
}: {
  locale: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const router = useRouter();
  const listboxId = `${useId()}-${LISTBOX_SUFFIX}`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const trimmed = query.trim();
  // Last row ("see all results") sits after the suggestion rows.
  const seeAllIndex = results.length;

  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&locale=${encodeURIComponent(locale)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const data = (await response.json()) as { results?: SearchSuggestion[] };
        // Ignore stale responses from superseded keystrokes.
        if (requestRef.current !== requestId) return;
        setResults(Array.isArray(data.results) ? data.results : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (requestRef.current !== requestId) return;
        setResults([]);
        setActiveIndex(-1);
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open ]);

  const goToGames = (slug: string) => {    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(`/games/${slug}`);
  };

  const submitSearch = () => {
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(trimmed ? `/games?search=${encodeURIComponent(trimmed)}` : "/games");
  };

  const showDropdown = open && trimmed.length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeIndex >= 0 && activeIndex < results.length) {
      goToGames(results[activeIndex].slug);
      return;
    }
    submitSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!showDropdown || (loading && results.length === 0)) return;
      event.preventDefault();
      const max = seeAllIndex;
      setActiveIndex((current) => {
        if (event.key === "ArrowDown") {
          return current >= max ? 0 : current + 1;
        }
        return current <= 0 ? max : current - 1;
      });
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const activeId =
    activeIndex >= 0 && activeIndex < results.length
      ? `${listboxId}-option-${results[activeIndex].id}`
      : activeIndex === seeAllIndex
        ? `${listboxId}-option-see-all`
        : undefined;

  return (
    <div ref={boxRef} className="relative ms-auto w-full md:w-auto">
      <form onSubmit={handleSubmit} role="search" className="w-full md:w-auto">
        <label htmlFor="store-search" className="sr-only">
          {tc("search")}
        </label>
        <div className="flex h-10 items-center overflow-hidden rounded-sm bg-black/30 focus-within:ring-1 focus-within:ring-eg-blue md:h-7">
          <input
            id="store-search"
            type="search"
            name="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              if (!value.trim()) {
                setResults([]);
                setLoading(false);
                setActiveIndex(-1);
                setOpen(false);
              } else {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (trimmed) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("search_store")}
            className="h-full w-full min-w-0 bg-transparent px-2.5 text-base text-eg-text placeholder:text-eg-muted focus:outline-none md:w-52 md:text-[13px]"
          />
          <button
            type="submit"
            aria-label={tc("search")}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-eg-text-sub transition-colors hover:bg-black/25 hover:text-eg-heading md:h-7 md:w-8"
          >
            <Search size={14} aria-hidden="true" />
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute start-0 end-0 top-full z-50 mt-1 overflow-hidden rounded-sm border border-eg-border bg-eg-darker shadow-[0_12px_28px_rgba(0,0,0,0.55)] md:start-auto md:w-[22rem]">
          {loading && results.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-eg-muted" role="status">
              {tc("loading")}
            </p>
          ) : (
            <ul role="listbox" id={listboxId} aria-label={t("search_store")} className="py-1">
              {results.length === 0 && (
                <li className="px-3 py-2 text-[12px] text-eg-muted" role="presentation">
                  <span role="status">{t("search_no_results")}</span>
                </li>
              )}
              {results.map((game, index) => {
                const thumbnail = game.capsule_image || game.header_image;
                const title = locale === "ar" && game.title_ar ? game.title_ar : game.title;
                return (
                  <li
                    key={game.id}
                    id={`${listboxId}-option-${game.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <Link
                      href={`/games/${game.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        goToGames(game.slug);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 transition-colors",
                        index === activeIndex ? "bg-white/[0.08]" : "bg-transparent"
                      )}
                    >
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt=""
                          width={92}
                          height={43}
                          className="h-[43px] w-[92px] shrink-0 rounded-[2px] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-[43px] w-[92px] shrink-0 rounded-[2px] bg-eg-surface"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-eg-heading">
                          {title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-eg-muted">
                          {game.developer_name}
                        </span>
                      </span>
                      <GamePrice
                        game={game}
                        className="shrink-0 text-[12px] font-semibold"
                      />
                    </Link>
                  </li>
                );
              })}
              <li
                id={`${listboxId}-option-see-all`}
                role="option"
                aria-selected={activeIndex === seeAllIndex}
              >
                <button
                  type="button"
                  onClick={submitSearch}
                  onMouseEnter={() => setActiveIndex(seeAllIndex)}
                  className={cn(
                    "block w-full px-3 py-2 text-start text-[12px] font-medium transition-colors",
                    activeIndex === seeAllIndex
                      ? "bg-white/[0.08] text-eg-gold"
                      : "text-eg-text-sub hover:text-eg-heading"
                  )}
                >
                  {t("search_see_all", { query: trimmed })}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
