import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { DEMO_GAMES } from "@/lib/demo-games";
import { slugify } from "@/lib/utils";
import {
  STUDIO_LINK_KEYS,
  studioKey,
  type StudioLinks,
  type StudioRow,
} from "@/lib/validators/studio";
import type { Game } from "@/types";

/**
 * Studio data for the public Developers pages.
 *
 * Studios come from public.studios (migration 008) merged with approved games,
 * matched by name (lower(games.developer_name) = lower(studios.name)). A studio
 * that only exists in games still gets a page with a monogram fallback.
 *
 * Until migration 008 is applied the table does not exist. Everything then falls
 * back silently to game-derived studios, and the three seeded studios keep their
 * shipped logos from public/studios.
 */

// Fallback facts for the three seeded studios, mirrored from the seed INSERT in
// supabase/migrations/008_studios.sql. Used only while the studios table is
// unavailable, so the pages stay complete before the migration is applied. The
// logo is only taken from here for game-derived studios, so an admin who clears
// a logo in the table gets the monogram instead.
const SEEDED_FALLBACK: Record<string, Omit<StudioEntry, "id" | "slug" | "name" | "registered" | "games">> = {
  "moving-dimensions": {
    name_ar: null,
    logo_url: "/studios/moving-dimensions.png",
    about: "Moving Dimensions is an Egyptian game studio and the developer and publisher of Abo Khashem, a comedic 3D open-world action game set in the City of Torrid. Abo Khashem was released on Steam on 22 February 2018.",
    about_ar: "استوديو Moving Dimensions مطوّر وناشر ألعاب مصري، وهو مطوّر لعبة أبو خشم، وهي لعبة أكشن ثلاثية الأبعاد بعالم مفتوح وطابع كوميدي. صدرت اللعبة على متجر Steam في 22 فبراير 2018.",
    founded_year: null,
    city: null,
    links: {
      website_url: "https://www.abokhashem.com",
      steam_url: null,
      x_url: "https://twitter.com/AboKhashemGame",
      instagram_url: null,
      facebook_url: "https://www.facebook.com/abokhashemgame",
      youtube_url: "https://www.youtube.com/channel/UCmksCHaupG0_dyxeGzG49Hw",
      discord_url: null,
      linkedin_url: null,
    },
  },
  "rumbling-games-studio": {
    name_ar: "استوديو رامبلنج للألعاب",
    logo_url: "/studios/rumbling-games-studio.png",
    about: "Rumbling Games Studio is an Egyptian game studio developing Knights of Light: The Prologue, an action adventure role-playing game set during a seventh-century historical battle in Iraq. The game is available on Steam, and the studio describes Knights of Light as its main project.",
    about_ar: "استوديو رامبلنج للألعاب استوديو مصري يطوّر لعبة Knights of Light: The Prologue، وهي لعبة أكشن ومغامرات ولعب أدوار تدور أحداثها في الشرق الأوسط خلال معركة تاريخية في القرن السابع. اللعبة متوفرة على متجر Steam، وهي المشروع الرئيسي للاستوديو.",
    founded_year: null,
    city: null,
    links: {
      website_url: "https://www.rumbling-games.com",
      steam_url: null,
      x_url: "https://twitter.com/rumblinggames",
      instagram_url: "https://www.instagram.com/rumbling.games.studio",
      facebook_url: "https://www.facebook.com/RumblingGamesStudio",
      youtube_url: null,
      discord_url: null,
      linkedin_url: null,
    },
  },
  "dergham-games": {
    name_ar: null,
    logo_url: "/studios/dergham-games.png",
    about: "Dergham Games is a game studio developing Light Dude, a skill-based action game in which the level hides as the player moves. A playable demo is available on Steam, and the full release is listed for Q4 2026.",
    about_ar: "ديرغام جيمز استوديو ألعاب يطوّر لعبة Light Dude، وهي لعبة أكشن تعتمد على المهارة، يختفي فيها المستوى كلما تحرك اللاعب. النسخة التجريبية متوفرة على متجر Steam، والإصدار الكامل معلن للربع الرابع من 2026.",
    founded_year: null,
    city: null,
    links: {
      website_url: null,
      steam_url: "https://store.steampowered.com/developer/DerghamGames/",
      x_url: null,
      instagram_url: null,
      facebook_url: null,
      youtube_url: null,
      discord_url: "https://discord.gg/GKMBQh4935",
      linkedin_url: null,
    },
  },
};

export interface StudioEntry {
  id: string | null;
  slug: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  about: string | null;
  about_ar: string | null;
  founded_year: number | null;
  city: string | null;
  links: StudioLinks;
  /** True when a row exists in public.studios; false for game-derived studios. */
  registered: boolean;
  games: Game[];
}

export interface StudioCatalog {
  studios: StudioEntry[];
  /** Approved games used to build the catalog (demo games when the catalog is empty). */
  games: Game[];
  /** False when the studios table could not be read (migration missing or Supabase unreachable). */
  tableReady: boolean;
}

function emptyLinks(): StudioLinks {
  return Object.fromEntries(STUDIO_LINK_KEYS.map((key) => [key, null])) as StudioLinks;
}

function byNewest(a: Game, b: Game) {
  return Date.parse(b.created_at) - Date.parse(a.created_at);
}

async function loadApprovedGames(demoFallback: boolean): Promise<Game[]> {
  let games: Game[] = [];
  try {
    const { data } = await createPublicClient().from("games").select("*").eq("status", "approved");
    games = (data ?? []) as Game[];
  } catch {
    games = [];
  }
  if (games.length === 0 && demoFallback) games = DEMO_GAMES;
  return games;
}

async function loadStudioRows(): Promise<{ rows: StudioRow[]; tableReady: boolean }> {
  try {
    const { data, error } = await createPublicClient().from("studios").select("*").order("name");
    // Any PostgREST error (missing table 42P01/PGRST205/PGRST200, or a transient failure)
    // falls back to game-derived studios; only a successful read counts as ready.
    if (error) return { rows: [], tableReady: false };
    return { rows: (data ?? []) as StudioRow[], tableReady: true };
  } catch {
    return { rows: [], tableReady: false };
  }
}

export async function loadStudioCatalog({ demoFallback = true }: { demoFallback?: boolean } = {}): Promise<StudioCatalog> {
  const [games, { rows, tableReady }] = await Promise.all([loadApprovedGames(demoFallback), loadStudioRows()]);

  const studios = new Map<string, StudioEntry>();
  for (const row of rows) {
    studios.set(studioKey(row.name), {
      id: row.id,
      slug: row.slug,
      name: row.name,
      name_ar: row.name_ar,
      logo_url: row.logo_url,
      about: row.about,
      about_ar: row.about_ar,
      founded_year: row.founded_year,
      city: row.city,
      links: {
        website_url: row.website_url,
        steam_url: row.steam_url,
        x_url: row.x_url,
        instagram_url: row.instagram_url,
        facebook_url: row.facebook_url,
        youtube_url: row.youtube_url,
        discord_url: row.discord_url,
        linkedin_url: row.linkedin_url,
      },
      registered: true,
      games: [],
    });
  }

  for (const game of games) {
    const name = game.developer_name?.trim();
    if (!name) continue;
    const key = studioKey(name);
    let entry = studios.get(key);
    if (!entry) {
      const slug = slugify(name);
      if (!slug) continue;
      const seeded = SEEDED_FALLBACK[slug];
      entry = {
        id: null,
        slug,
        name,
        name_ar: seeded?.name_ar ?? null,
        logo_url: seeded?.logo_url ?? null,
        about: seeded?.about ?? null,
        about_ar: seeded?.about_ar ?? null,
        founded_year: seeded?.founded_year ?? null,
        city: seeded?.city ?? null,
        links: seeded?.links ?? emptyLinks(),
        registered: false,
        games: [],
      };
      studios.set(key, entry);
    }
    entry.games.push(game);
  }

  const list = [...studios.values()].map((studio) => ({ ...studio, games: studio.games.sort(byNewest) }));
  list.sort((a, b) => b.games.length - a.games.length || a.name.localeCompare(b.name));
  return { studios: list, games, tableReady };
}

/** Per-request catalog, shared by generateMetadata and the page itself. */
export const getStudioCatalog = cache(() => loadStudioCatalog());

export async function getStudios(): Promise<StudioEntry[]> {
  return (await getStudioCatalog()).studios;
}

export async function getStudioBySlug(slug: string): Promise<StudioEntry | undefined> {
  const normalized = slug.toLowerCase();
  return (await getStudioCatalog()).studios.find((studio) => studio.slug === normalized);
}
