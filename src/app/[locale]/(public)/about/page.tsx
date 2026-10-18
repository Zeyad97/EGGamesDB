import type { Metadata } from "next";
import { buildAlternates } from "@/lib/site";
import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { DEMO_GAMES } from "@/lib/demo-games";
import { AboutExperience } from "@/components/about/AboutExperience";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: "User";
}

const CONTRIBUTORS_URL = "https://api.github.com/repos/Zeyad97/EGGamesDB/contributors?per_page=100";
const founderFallback: Contributor = {
  login: "Zeyad97",
  id: 143192185,
  avatar_url: "https://avatars.githubusercontent.com/u/143192185?v=4",
  html_url: "https://github.com/Zeyad97",
  contributions: 1,
  type: "User",
};

function isContributor(value: unknown): value is Contributor {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Contributor>;
  if (typeof item.login !== "string" || !item.login.trim()) return false;
  if (typeof item.id !== "number" || !Number.isInteger(item.id)) return false;
  if (item.type !== "User" || typeof item.contributions !== "number" || item.contributions < 0) return false;

  try {
    const profileUrl = new URL(item.html_url || "");
    const avatarUrl = new URL(item.avatar_url || "");
    return profileUrl.protocol === "https:" && profileUrl.hostname === "github.com" && avatarUrl.protocol === "https:" && avatarUrl.hostname === "avatars.githubusercontent.com";
  } catch {
    return false;
  }
}

async function getContributors(): Promise<Contributor[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const response = await fetch(CONTRIBUTORS_URL, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 43200 },
      signal: controller.signal,
    });
    if (!response.ok) return [founderFallback];
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return [founderFallback];
    const contributors = payload.filter(isContributor);
    if (!contributors.some((contributor) => contributor.login.toLowerCase() === founderFallback.login.toLowerCase())) contributors.push(founderFallback);
    return contributors.sort((a, b) => b.contributions - a.contributions || a.login.localeCompare(b.login));
  } catch {
    return [founderFallback];
  } finally {
    clearTimeout(timeout);
  }
}

async function getCatalogFacts() {
  try {
    const { data, count, error } = await createPublicClient()
      .from("games")
      .select("developer_name,header_image", { count: "exact" })
      .eq("status", "approved");
    if (error) throw error;
    const rows = data ?? [];
    const studios = new Set(rows.map((game) => game.developer_name?.trim()).filter(Boolean));
    const images = rows.map((game) => game.header_image).filter((image): image is string => Boolean(image)).slice(0, 3);
    const fallbackImages = DEMO_GAMES.map((game) => game.header_image).filter((image): image is string => Boolean(image)).slice(0, 3);
    return {
      games: count ?? rows.length,
      studios: studios.size,
      images: images.length > 0 ? images : fallbackImages,
    };
  } catch {
    const studios = new Set(DEMO_GAMES.map((game) => game.developer_name.trim()).filter(Boolean));
    return {
      games: DEMO_GAMES.length,
      studios: studios.size,
      images: DEMO_GAMES.map((game) => game.header_image).filter((image): image is string => Boolean(image)).slice(0, 3),
    };
  }
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("about_title"), description: t("about_description"), alternates: buildAlternates(locale, "/about") };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const [contributors, catalog] = await Promise.all([getContributors(), getCatalogFacts()]);
  const contributionTotal = contributors.reduce((total, contributor) => total + contributor.contributions, 0);

  return (
    <AboutExperience
      locale={locale}
      contributors={contributors}
      gameImages={catalog.images}
      stats={{ games: catalog.games, studios: catalog.studios, contributors: contributors.length, contributions: contributionTotal }}
    />
  );
}
