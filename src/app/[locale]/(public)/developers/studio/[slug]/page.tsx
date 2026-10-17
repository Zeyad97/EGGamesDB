import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { GameCard } from "@/components/games/GameCard";
import { EgyptFlag } from "@/components/layout/Brand";
import { buildAlternates } from "@/lib/site";
import { slugify } from "@/lib/utils";
import { DEMO_GAMES } from "@/lib/demo-games";
import type { Game } from "@/types";

export const dynamic = "force-dynamic";
type StudioPageProps = { params: Promise<{ locale: string; slug: string }> };

async function getStudios(): Promise<Map<string, Game[]>> {
  let games: Game[] = [];
  try {
    const { data } = await createPublicClient().from("games").select("*").eq("status", "approved");
    games = (data ?? []) as Game[];
  } catch {}
  if (games.length === 0) games = DEMO_GAMES;
  const studios = new Map<string, Game[]>();
  for (const game of games) {
    const name = game.developer_name?.trim();
    if (!name) continue;
    const slug = slugify(name);
    studios.set(slug, [...(studios.get(slug) ?? []), game]);
  }
  for (const items of studios.values()) items.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return studios;
}

export async function generateMetadata({ params }: StudioPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const games = (await getStudios()).get(slug);
  if (!games?.length) notFound();
  const name = games[0].developer_name;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("developer_title", { name }), description: t("developer_description", { name }), alternates: buildAlternates(locale, `/developers/studio/${slug}`) };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { locale, slug } = await params;
  const studioGames = (await getStudios()).get(slug);
  if (!studioGames?.length) notFound();
  const name = studioGames[0].developer_name;
  const t = await getTranslations({ locale, namespace: "developers" });
  const tc = await getTranslations({ locale, namespace: "common" });
  return <div className="pb-4"><div className="store-container pt-5">
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-eg-muted"><Link href="/" className="hover:text-eg-blue">EGGameDB</Link><span aria-hidden="true">/</span><Link href="/developers" className="hover:text-eg-blue">{t("all_developers")}</Link><span aria-hidden="true">/</span><span className="text-eg-text-sub">{name}</span></nav>
    <header className="border border-eg-border bg-eg-card p-4 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-eg-gold">{t("studios_title")}</p><h1 className="mt-2 text-2xl font-black text-eg-heading">{name}</h1><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-eg-muted"><span className="text-eg-text-sub">{t("games_count", { count: studioGames.length })}</span><span className="inline-flex items-center gap-1.5 text-eg-gold"><EgyptFlag />{tc("made_in_egypt")}</span></div></header>
    <h2 className="store-title mb-3 mt-6">{t("games_count", { count: studioGames.length })}</h2><ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{studioGames.map((game) => <li key={game.id}><GameCard game={game} locale={locale} /></li>)}</ul>
  </div></div>;
}
