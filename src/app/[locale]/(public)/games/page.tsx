import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { GamesGrid } from "@/components/games/GamesGrid";
import { GameFiltersBar } from "@/components/games/GameFiltersBar";
import { SpotlightBanner } from "@/components/games/SpotlightBanner";
import { DemoNotice } from "@/components/games/DemoNotice";
import { DEMO_GAMES, queryDemoGames } from "@/lib/demo-games";
import type { Game, GameFilters } from "@/types";

interface GamesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

const PAGE_SIZE = 20;

export async function generateMetadata({ params }: GamesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "games" });
  return {
    title: t("explore_title"),
    description: t("explore_subtitle"),
  };
}

export default async function GamesPage({ params, searchParams }: GamesPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "games" });

  const filters: GameFilters = {
    search: sp.search || undefined,
    genre: sp.genre || undefined,
    tag: sp.tag || undefined,
    sortBy: (sp.sort as GameFilters["sortBy"]) || "created_at",
    sortOrder: "desc",
    page: Number(sp.page) || 1,
    pageSize: PAGE_SIZE,
  };

  // Whether the database holds ANY approved game, independent of the active
  // search/filter. Demo data is used only when the approved catalog is
  // globally empty or unavailable — never to pad filtered-out results.
  let usingDemo = false;
  let spotlightGame: Game | null = null;
  let games: Game[] = [];
  let count = 0;

  try {
    const client = createPublicClient();
    const { count: approvedCount, error } = await client
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    if (error || (approvedCount ?? 0) === 0) {
      usingDemo = true;
    } else {
      try {
        const [{ data: spotlight }, { data: rows, count: total }] = await Promise.all([
          client
            .from("games")
            .select("*")
            .eq("status", "approved")
            .not("spotlight_at", "is", null)
            .order("spotlight_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          (() => {
            let query = client.from("games").select("*", { count: "exact" }).eq("status", "approved");

            if (filters.search) {
              query = query.textSearch("search_vector", filters.search, { type: "websearch" });
            }
            if (filters.genre) {
              query = query.contains("genres", [filters.genre]);
            }
            if (filters.tag) {
              query = query.contains("tags", [filters.tag]);
            }

            return query
              .order(filters.sortBy ?? "created_at", { ascending: filters.sortOrder === "asc" })
              .range(
                ((filters.page ?? 1) - 1) * PAGE_SIZE,
                ((filters.page ?? 1) - 1) * PAGE_SIZE + PAGE_SIZE - 1
              );
          })(),
        ]);
        spotlightGame = (spotlight as Game | null) ?? null;
        games = (rows ?? []) as Game[];
        count = total ?? 0;
      } catch {
        // Supabase became unreachable mid-request: fall back to demos.
        usingDemo = true;
      }
    }
  } catch {
    usingDemo = true;
  }

  if (usingDemo) {
    const result = queryDemoGames({
      search: filters.search,
      genre: filters.genre,
      tag: filters.tag,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      pageSize: PAGE_SIZE,
    });
    games = result.games;
    count = result.count;
    if (
      filters.page === 1 &&
      !filters.search &&
      !filters.genre &&
      !filters.tag
    ) {
      spotlightGame = DEMO_GAMES[0];
    }
  }

  const showSpotlight =
    Boolean(spotlightGame) &&
    filters.page === 1 &&
    !filters.search &&
    !filters.genre &&
    !filters.tag;

  return (
    <div className="pb-4">
      <div className="store-container pt-5">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[11px] text-eg-muted">
          <Link href="/" className="transition-colors hover:text-eg-blue">
            EGGameDB
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-eg-text-sub">{t("store")}</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-eg-border pb-3">
          <h1 className="text-xl font-semibold text-eg-heading">{t("explore_title")}</h1>
          <p className="text-xs text-eg-muted">{t("explore_subtitle")}</p>
        </div>

        {usingDemo && <DemoNotice className="mb-4" />}

        {showSpotlight && <SpotlightBanner game={spotlightGame as Game} locale={locale} />}

        <div className="grid gap-x-6 gap-y-5 lg:grid-cols-[200px_minmax(0,1fr)]">
          <GameFiltersBar currentFilters={filters} totalCount={count ?? 0} locale={locale} />
          <GamesGrid
            games={(games ?? []) as Game[]}
            locale={locale}
            totalCount={count ?? 0}
            currentPage={filters.page ?? 1}
            pageSize={PAGE_SIZE}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}
