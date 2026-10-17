import type { SteamGameData } from "@/types";
import { sanitizeGameDescription } from "@/lib/security/sanitize-html";

const STEAM_APP_DETAILS = "https://store.steampowered.com/api/appdetails";
const STEAM_SEARCH_URL = "https://store.steampowered.com/api/storesearch";

export async function fetchSteamGameData(appId: string): Promise<SteamGameData | null> {
  // Only ever fetch appdetails for a numeric Steam app id.
  if (!/^\d+$/.test(appId.trim())) return null;
  try {
    const res = await fetch(
      `${STEAM_APP_DETAILS}?appids=${appId}&cc=us&l=english`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json[appId];
    if (!entry?.success) return null;
    return entry.data as SteamGameData;
  } catch {
    return null;
  }
}

export async function searchSteamGames(query: string): Promise<Array<{ appid: number; name: string; tiny_image: string }>> {
  try {
    const res = await fetch(
      `${STEAM_SEARCH_URL}?term=${encodeURIComponent(query)}&cc=us&l=english`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.items ?? [];
  } catch {
    return [];
  }
}

export function steamDataToGameFields(data: SteamGameData) {
  return {
    title: data.name,
    short_description: data.short_description,
    long_description: sanitizeGameDescription(data.detailed_description),
    header_image: data.header_image,
    capsule_image: data.capsule_image,
    steam_app_id: String(data.steam_appid),
    steam_url: `https://store.steampowered.com/app/${data.steam_appid}`,
    screenshots: data.screenshots?.map((s) => ({
      id: String(s.id),
      path_full: s.path_full,
      path_thumbnail: s.path_thumbnail,
    })) ?? [],
    videos: data.movies?.map((m) => ({
      id: String(m.id),
      name: m.name,
      youtube_id: null,
      mp4_url: m.mp4?.max ?? m.mp4?.["480"] ?? null,
      webm_url: m.webm?.max ?? m.webm?.["480"] ?? null,
      thumbnail: m.thumbnail,
    })) ?? [],
    genres: data.genres?.map((g) => g.description) ?? [],
    tags: data.categories?.map((c) => c.description) ?? [],
    release_date: data.release_date?.date
      ? parseReleaseDateSafe(data.release_date.date)
      : null,
    developer_name: data.developers?.[0] ?? "",
    publisher: data.publishers?.[0] ?? null,
    is_free: data.is_free,
    price_usd: data.price_overview ? data.price_overview.final / 100 : null,
    metacritic_score: data.metacritic?.score ?? null,
    windows_requirements: data.pc_requirements
      ? { minimum: data.pc_requirements.minimum ?? "", recommended: data.pc_requirements.recommended ?? "" }
      : null,
    mac_requirements: data.mac_requirements
      ? { minimum: data.mac_requirements.minimum ?? "", recommended: data.mac_requirements.recommended ?? "" }
      : null,
    linux_requirements: data.linux_requirements
      ? { minimum: data.linux_requirements.minimum ?? "", recommended: data.linux_requirements.recommended ?? "" }
      : null,
  };
}

function parseReleaseDateSafe(dateStr: string): string | null {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
}
