import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { loadStudioCatalog } from "@/lib/studios";

export const revalidate = 3600;
const locales = ["en", "ar"] as const;
const staticPaths = ["/", "/store", "/games", "/developers", "/about", "/contact", "/privacy", "/terms"];

type SitemapRow = MetadataRoute.Sitemap[number];
function entry(path: string, lastModified?: string): SitemapRow[] {
  const cleanPath = path === "/" ? "" : path;
  const en = `${SITE_URL}/en${cleanPath}`;
  const languages = { en, ar: `${SITE_URL}/ar${cleanPath}`, "x-default": en };
  return locales.map((locale) => ({ url: `${SITE_URL}/${locale}${cleanPath}`, ...(lastModified ? { lastModified } : {}), alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = staticPaths.flatMap((path) => entry(path));
  try {
    const client = createPublicClient();
    const { data: games } = await client.from("games").select("slug, updated_at, developer_id, developer_name").eq("status", "approved").not("slug", "like", "demo-%");
    const approved = games ?? [];
    const gamePages = approved.filter((game) => game.slug && !game.slug.startsWith("demo-")).flatMap((game) => entry(`/games/${game.slug}`, game.updated_at));
    // Registered studios (public.studios) plus studios that only exist in approved games.
    // Demo games are excluded so demo studios never reach the sitemap.
    const { studios } = await loadStudioCatalog({ demoFallback: false });
    const studioPages = studios.flatMap((studio) => entry(`/developers/studio/${studio.slug}`));
    const developerIds = [...new Set(approved.map((game) => game.developer_id).filter(Boolean))];
    let contributorPages: SitemapRow[] = [];
    if (developerIds.length) {
      const { data: profiles } = await client.from("profiles").select("id, username").eq("role", "contributor").in("id", developerIds);
      contributorPages = [...new Set((profiles ?? []).map((profile) => profile.username).filter(Boolean))].flatMap((username) => entry(`/developers/${username}`));
    }
    return [...pages, ...gamePages, ...studioPages, ...contributorPages];
  } catch {
    return pages;
  }
}
