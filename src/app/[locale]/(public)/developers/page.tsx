import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { StudioLogo } from "@/components/studios/StudioLogo";
import Image from "next/image";
import { buildAlternates } from "@/lib/site";
import { getStudioCatalog, type StudioEntry } from "@/lib/studios";
import type { Game, Profile } from "@/types";

export const dynamic = "force-dynamic";

interface DevelopersPageProps { params: Promise<{ locale: string }> }
type Contributor = Profile & { gameCount: number };

export async function generateMetadata({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("developers_title"), description: t("developers_description"), alternates: buildAlternates(locale, "/developers") };
}

export default async function DevelopersPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "developers" });
  const catalog = await getStudioCatalog();
  const approvedGames: Game[] = catalog.games;

  let profiles: Profile[] = [];
  try {
    const { data } = await createPublicClient().from("profiles").select("*").eq("role", "contributor");
    profiles = (data ?? []) as Profile[];
  } catch {
    profiles = [];
  }

  // Contributor profiles whose display name matches a studio are shown as a badge on
  // that studio card. Other contributors get their own card. Admins never appear here.
  const studioByName = new Map<string, StudioEntry>(catalog.studios.map((studio) => [studio.name.trim().toLocaleLowerCase(), studio]));
  const studioProfile = new Map<string, Profile>();
  const contributors: Contributor[] = profiles.flatMap((profile) => {
    const gameCount = approvedGames.filter((game) => game.developer_id === profile.id).length;
    if (!gameCount) return [];
    const matchingStudio = studioByName.get((profile.display_name || "").trim().toLocaleLowerCase());
    if (matchingStudio) {
      studioProfile.set(matchingStudio.slug, profile);
      return [];
    }
    return [{ ...profile, gameCount }];
  });
  contributors.sort((a, b) => b.gameCount - a.gameCount || (a.display_name || a.username).localeCompare(b.display_name || b.username));

  const studios = catalog.studios;

  return <div className="pb-4"><div className="store-container pt-5">
    <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[11px] text-eg-muted"><Link href="/" className="transition-colors hover:text-eg-blue">EGGameDB</Link><span aria-hidden="true">/</span><span className="text-eg-text-sub">{t("title")}</span></nav>
    <div className="mb-5 border-b border-eg-border pb-3"><h1 className="text-xl font-semibold text-eg-heading">{t("title")}</h1><p className="mt-1 text-xs text-eg-muted">{t("subtitle")}</p></div>
    {studios.length || contributors.length ? <>
      {studios.length > 0 && <><h2 className="store-title mb-3">{t("studios_title")}</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{studios.map((studio) => {
        const displayName = locale === "ar" && studio.name_ar ? studio.name_ar : studio.name;
        const meta = [studio.city, studio.founded_year ? t("founded", { year: studio.founded_year }) : null].filter(Boolean).join(" · ");
        const capsules = studio.games.slice(0, 3);
        const profile = studioProfile.get(studio.slug);
        return <li key={studio.slug}><Link href={`/developers/studio/${studio.slug}`} className="group flex h-full flex-col border border-eg-border bg-eg-card p-3 transition-colors hover:border-eg-border-strong">
          <div className="flex items-start gap-3">
            <StudioLogo name={studio.name} logoUrl={studio.logo_url} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" sizes="80px" />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-[13px] font-semibold text-eg-heading group-hover:text-eg-gold">{displayName}</p>
              {meta && <p className="mt-0.5 truncate text-[11px] text-eg-text-sub">{meta}</p>}
              <p className="mt-0.5 text-[11px] text-eg-muted">{t("games_count", { count: studio.games.length })}</p>
              {profile && <span className="mt-1 inline-block truncate text-[11px] text-eg-blue">{t("contributor_profile", { name: profile.display_name || profile.username })}</span>}
            </div>
          </div>
          {capsules.length > 0 && <div className="mt-3 grid grid-cols-3 gap-1.5">{capsules.map((game) => {
            const image = game.capsule_image || game.header_image;
            return <div key={game.id} className="relative aspect-[460/215] overflow-hidden bg-eg-surface">{image && <Image src={image} alt="" fill sizes="120px" className="object-cover" />}</div>;
          })}</div>}
        </Link></li>;
      })}</ul></>}
      {contributors.length > 0 && <><h2 className="store-title mb-3 mt-7">{t("contributors_title")}</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{contributors.map((contributor) => <li key={contributor.id}><Link href={`/developers/${contributor.username}`} className="flex h-full items-center gap-3 border border-eg-border bg-eg-card p-3 transition-colors hover:border-eg-border-strong"><Avatar src={contributor.avatar_url} name={contributor.display_name || contributor.username} size="md" /><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-eg-heading">{contributor.display_name || contributor.username}</p><p className="truncate text-[11px] text-eg-muted">@{contributor.username} · {t("games_count", { count: contributor.gameCount })}</p></div></Link></li>)}</ul></>}
    </> : <p className="border border-eg-border bg-eg-card px-4 py-8 text-center text-xs text-eg-muted">{t("empty")}</p>}
  </div></div>;
}
