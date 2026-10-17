import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import Image from "next/image";
import { buildAlternates } from "@/lib/site";
import { slugify } from "@/lib/utils";
import { DEMO_GAMES } from "@/lib/demo-games";
import type { Game, Profile } from "@/types";

export const dynamic = "force-dynamic";

interface DevelopersPageProps { params: Promise<{ locale: string }> }
type Studio = { name: string; games: Game[]; profile?: Profile | null };
type Contributor = Profile & { gameCount: number };

export async function generateMetadata({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("developers_title"), description: t("developers_description"), alternates: buildAlternates(locale, "/developers") };
}

export default async function DevelopersPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "developers" });
  let approvedGames: Game[] = [];
  let profiles: Profile[] = [];
  try {
    const client = createPublicClient();
    const [{ data: games }, { data: contributors }] = await Promise.all([
      client.from("games").select("*").eq("status", "approved"),
      client.from("profiles").select("*").eq("role", "contributor"),
    ]);
    approvedGames = (games ?? []) as Game[];
    profiles = (contributors ?? []) as Profile[];
  } catch {}
  if (approvedGames.length === 0 && profiles.length === 0) approvedGames = DEMO_GAMES;

  const studioMap = new Map<string, Studio>();
  for (const game of approvedGames) {
    const name = game.developer_name?.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    const studio = studioMap.get(key) ?? { name, games: [], profile: null };
    studio.games.push(game);
    studioMap.set(key, studio);
  }
  const contributors: Contributor[] = profiles.flatMap((profile) => {
    const games = approvedGames.filter((game) => game.developer_id === profile.id);
    if (!games.length) return [];
    const profileName = (profile.display_name || "").trim().toLocaleLowerCase();
    const matchingStudio = profileName ? studioMap.get(profileName) : undefined;
    if (matchingStudio) {
      matchingStudio.profile = profile;
      return [];
    }
    return [{ ...profile, gameCount: games.length }];
  });
  const studios = [...studioMap.values()].map((studio) => ({
    ...studio,
    games: studio.games.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
  })).sort((a, b) => b.games.length - a.games.length || a.name.localeCompare(b.name));
  contributors.sort((a, b) => b.gameCount - a.gameCount || (a.display_name || a.username).localeCompare(b.display_name || b.username));

  return <div className="pb-4"><div className="store-container pt-5">
    <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[11px] text-eg-muted"><Link href="/" className="transition-colors hover:text-eg-blue">EGGameDB</Link><span aria-hidden="true">/</span><span className="text-eg-text-sub">{t("title")}</span></nav>
    <div className="mb-5 border-b border-eg-border pb-3"><h1 className="text-xl font-semibold text-eg-heading">{t("title")}</h1><p className="mt-1 text-xs text-eg-muted">{t("subtitle")}</p></div>
    {studios.length || contributors.length ? <>
      {studios.length > 0 && <><h2 className="store-title mb-3">{t("studios_title")}</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{studios.map((studio) => { const image = studio.games[0]?.header_image || studio.games[0]?.capsule_image; return <li key={studio.name}><Link href={`/developers/studio/${slugify(studio.name)}`} className="group block h-full border border-eg-border bg-eg-card transition-colors hover:border-eg-border-strong"><div className="relative aspect-[460/150] overflow-hidden bg-eg-surface">{image && <Image src={image} alt="" fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />}</div><div className="p-3"><p className="truncate text-[13px] font-semibold text-eg-heading group-hover:text-eg-gold">{studio.name}</p><p className="mt-1 text-[11px] text-eg-muted">{t("games_count", { count: studio.games.length })}</p>{studio.profile && <span className="mt-2 inline-block text-[11px] text-eg-blue">{t("contributor_profile", { name: studio.profile.display_name || studio.profile.username })}</span>}</div></Link></li> })}</ul></>}
      {contributors.length > 0 && <><h2 className="store-title mb-3 mt-7">{t("contributors_title")}</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{contributors.map((contributor) => <li key={contributor.id}><Link href={`/developers/${contributor.username}`} className="flex h-full items-center gap-3 border border-eg-border bg-eg-card p-3 transition-colors hover:border-eg-border-strong"><Avatar src={contributor.avatar_url} name={contributor.display_name || contributor.username} size="md" /><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-eg-heading">{contributor.display_name || contributor.username}</p><p className="truncate text-[11px] text-eg-muted">@{contributor.username} · {t("games_count", { count: contributor.gameCount })}</p></div></Link></li>)}</ul></>}
    </> : <p className="border border-eg-border bg-eg-card px-4 py-8 text-center text-xs text-eg-muted">{t("empty")}</p>}
  </div></div>;
}
