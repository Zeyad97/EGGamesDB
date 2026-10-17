import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/utils";

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
    const studioSlugs = [...new Set(approved.map((game) => slugify(game.developer_name ?? "")).filter(Boolean))];
    const gamePages = approved.filter((game) => game.slug && !game.slug.startsWith("demo-")).flatMap((game) => entry(`/games/${game.slug}`, game.updated_at));
    const studioPages = studioSlugs.flatMap((slug) => entry(`/developers/studio/${slug}`));
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
