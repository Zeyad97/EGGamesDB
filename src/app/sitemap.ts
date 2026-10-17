import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
const locales = ["en", "ar"] as const;
const staticPaths = ["/", "/store", "/games", "/developers", "/about", "/contact", "/privacy", "/terms"];

type SitemapRow = MetadataRoute.Sitemap[number];
function entry(path: string, lastModified?: string): SitemapRow[] {
  const cleanPath = path === "/" ? "" : path;
  const en = `${SITE_URL}/en${cleanPath}`;
  const languages = { en, ar: `${SITE_URL}/ar${cleanPath}`, "x-default": en };
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${cleanPath}`,
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = staticPaths.flatMap((path) => entry(path));
  try {
    const client = createPublicClient();
    const [{ data: games }, { data: developers }] = await Promise.all([
      client.from("games").select("slug, updated_at").eq("status", "approved").not("slug", "like", "demo-%"),
      client.from("games").select("developer_id").eq("status", "approved"),
    ]);
    const usernames: string[] = [];
    const developerIds = [...new Set((developers ?? []).map((game) => game.developer_id).filter(Boolean))];
    if (developerIds.length) {
      const { data: profiles } = await client.from("profiles").select("id, username").in("id", developerIds);
      usernames.push(...(profiles ?? []).map((profile) => profile.username).filter(Boolean));
    }
    const gamePages = (games ?? []).filter((game) => game.slug && !game.slug.startsWith("demo-")).flatMap((game) => entry(`/games/${game.slug}`, game.updated_at));
    return [...pages, ...gamePages, ...[...new Set(usernames)].flatMap((username) => entry(`/developers/${username}`))];
  } catch {
    return pages;
  }
}
