import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { DEMO_GAMES } from "@/lib/demo-games";
import type { Game } from "@/types";

// Search suggestions are per-query and always read live catalog data, so this
// handler runs dynamically on every request. Short public caching (see
// Cache-Control below) lets the CDN absorb repeated keystroke traffic.
export const dynamic = "force-dynamic";

const MAX_RESULTS = 8;
const MAX_QUERY_LENGTH = 64;

const SEARCH_COLUMNS =
  "id,slug,title,title_ar,capsule_image,header_image,is_free,price_usd,release_date,developer_name";

export interface SearchSuggestion {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  capsule_image: string | null;
  header_image: string | null;
  is_free: boolean;
  price_usd: number | null;
  release_date: string | null;
  developer_name: string;
}

function toSuggestion(game: Pick<Game, keyof SearchSuggestion & keyof Game>): SearchSuggestion {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    title_ar: game.title_ar,
    capsule_image: game.capsule_image,
    header_image: game.header_image,
    is_free: game.is_free,
    price_usd: game.price_usd,
    release_date: game.release_date,
    developer_name: game.developer_name,
  };
}

// Escape PostgREST `ilike` wildcards so user input is matched literally.
function escapeIlike(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function wordsStartWith(value: string | null, query: string): boolean {
  if (!value) return false;
  const words = value.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 1 && words.slice(1).some((word) => word.startsWith(query));
}

// Shared ranker used for the demo fallback (and to merge Supabase rounds):
// title/title_ar prefix matches first, then later-word matches.
function rankMatches<T extends Pick<Game, "id" | "title" | "title_ar">>(
  games: T[],
  query: string
): T[] {
  const lowered = query.toLowerCase();
  const prefix = games.filter(
    (game) =>
      game.title.toLowerCase().startsWith(lowered) ||
      (game.title_ar ?? "").toLowerCase().startsWith(lowered)
  );
  const prefixIds = new Set(prefix.map((game) => game.id));
  const laterWord = games.filter(
    (game) =>
      !prefixIds.has(game.id) && (wordsStartWith(game.title, lowered) || wordsStartWith(game.title_ar, lowered))
  );
  return [...prefix, ...laterWord];
}

function matchDemoGames(query: string): SearchSuggestion[] {
  return rankMatches(DEMO_GAMES, query)
    .slice(0, MAX_RESULTS)
    .map(toSuggestion);
}

function json(results: SearchSuggestion[]) {
  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("q") ?? "";
  const query = raw.trim();

  if (!query || query.length > MAX_QUERY_LENGTH) {
    return json([]);
  }

  const escaped = escapeIlike(query);

  try {
    const supabase = createPublicClient();

    const [countResult, prefixResult, laterWordResult] = await Promise.all([
      supabase.from("games").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase
        .from("games")
        .select(SEARCH_COLUMNS)
        .eq("status", "approved")
        .or(`title.ilike.${escaped}%,title_ar.ilike.${escaped}%`)
        .order("title", { ascending: true })
        .limit(MAX_RESULTS),
      supabase
        .from("games")
        .select(SEARCH_COLUMNS)
        .eq("status", "approved")
        .or(`title.ilike.% ${escaped}%,title_ar.ilike.% ${escaped}%`)
        .order("title", { ascending: true })
        .limit(MAX_RESULTS * 2),
    ]);

    if (countResult.error) throw countResult.error;
    // No approved games at all: mirror the storefront fallback to demo data.
    if ((countResult.count ?? 0) === 0) {
      return json(matchDemoGames(query));
    }

    if (prefixResult.error) throw prefixResult.error;
    if (laterWordResult.error) throw laterWordResult.error;

    const seen = new Set<string>();
    const ranked: SearchSuggestion[] = [];
    for (const row of [...(prefixResult.data ?? []), ...(laterWordResult.data ?? [])]) {
      const game = row as unknown as SearchSuggestion;
      if (seen.has(game.id)) continue;
      seen.add(game.id);
      ranked.push(game);
      if (ranked.length >= MAX_RESULTS) break;
    }
    return json(ranked);
  } catch {
    // Supabase unreachable, timed out, or errored: serve the demo catalog.
    return json(matchDemoGames(query));
  }
}
