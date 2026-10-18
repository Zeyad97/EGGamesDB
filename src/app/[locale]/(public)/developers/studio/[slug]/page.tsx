import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AtSign, Briefcase, Camera, Gamepad2, Globe, MessageCircle, Play, ThumbsUp, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { GameCard } from "@/components/games/GameCard";
import { StudioLogo } from "@/components/studios/StudioLogo";
import { EgyptFlag } from "@/components/layout/Brand";
import { SITE_URL, absoluteLocaleUrl, buildAlternates } from "@/lib/site";
import { getStudioBySlug } from "@/lib/studios";
import { STUDIO_LINK_KEYS, type StudioLinkKey } from "@/lib/validators/studio";

export const dynamic = "force-dynamic";
type StudioPageProps = { params: Promise<{ locale: string; slug: string }> };

const LINK_META: Record<StudioLinkKey, { Icon: LucideIcon; label: string }> = {
  website_url: { Icon: Globe, label: "website" },
  steam_url: { Icon: Gamepad2, label: "link_steam" },
  x_url: { Icon: AtSign, label: "link_x" },
  instagram_url: { Icon: Camera, label: "link_instagram" },
  facebook_url: { Icon: ThumbsUp, label: "link_facebook" },
  youtube_url: { Icon: Play, label: "link_youtube" },
  discord_url: { Icon: MessageCircle, label: "link_discord" },
  linkedin_url: { Icon: Briefcase, label: "link_linkedin" },
};

export async function generateMetadata({ params }: StudioPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();
  const name = locale === "ar" && studio.name_ar ? studio.name_ar : studio.name;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("developer_title", { name }), description: t("developer_description", { name }), alternates: buildAlternates(locale, `/developers/studio/${studio.slug}`) };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { locale, slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();

  const t = await getTranslations({ locale, namespace: "developers" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const name = locale === "ar" && studio.name_ar ? studio.name_ar : studio.name;
  // Arabic copy when available, otherwise the English about text.
  const about = locale === "ar" ? studio.about_ar || studio.about : studio.about;
  const links = STUDIO_LINK_KEYS.flatMap((key) => (studio.links[key] ? [{ key, href: studio.links[key] }] : []));
  const logoUrl = studio.logo_url?.startsWith("/") ? `${SITE_URL}${studio.logo_url}` : studio.logo_url;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: studio.name,
    alternateName: studio.name_ar ?? undefined,
    url: studio.links.website_url ?? absoluteLocaleUrl(locale, `/developers/studio/${studio.slug}`),
    logo: logoUrl ?? undefined,
    sameAs: links.filter((link) => link.key !== "website_url").map((link) => link.href),
    foundingDate: studio.founded_year ? String(studio.founded_year) : undefined,
    address: { "@type": "PostalAddress", addressCountry: "EG", addressLocality: studio.city ?? undefined },
  };

  return <div className="pb-4"><div className="store-container pt-5">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }} />
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-eg-muted"><Link href="/" className="hover:text-eg-blue">EGGameDB</Link><span aria-hidden="true">/</span><Link href="/developers" className="hover:text-eg-blue">{t("all_developers")}</Link><span aria-hidden="true">/</span><span className="text-eg-text-sub">{name}</span></nav>

    <header className="border border-eg-border bg-eg-card p-4 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <StudioLogo name={studio.name} logoUrl={studio.logo_url} className="h-28 w-28 shrink-0 sm:h-40 sm:w-40" sizes="160px" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-eg-gold">{t("studios_title")}</p>
          <h1 className="mt-2 text-2xl font-black text-eg-heading sm:text-3xl">{name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-eg-muted">
            <span className="inline-flex items-center gap-1.5 text-eg-gold"><EgyptFlag />{tc("made_in_egypt")}</span>
            {studio.city && <span className="text-eg-text-sub">{studio.city}</span>}
            {studio.founded_year && <span>{t("founded", { year: studio.founded_year })}</span>}
            <span className="text-eg-text-sub">{t("games_count", { count: studio.games.length })}</span>
          </div>
        </div>
      </div>
    </header>

    <section className="mt-6 border border-eg-border bg-eg-card p-4 sm:p-5">
      <h2 className="store-title mb-3">{t("about_title")}</h2>
      {about ? <p className="whitespace-pre-line text-sm leading-relaxed text-eg-text-sub">{about}</p> : <p className="text-sm text-eg-muted">{t("no_about")}</p>}
    </section>

    {links.length > 0 && <section className="mt-6">
      <h2 className="store-title mb-3">{t("links_title")}</h2>
      <ul className="flex flex-wrap gap-2">{links.map(({ key, href }) => {
        const { Icon, label } = LINK_META[key];
        return <li key={key}><a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 border border-eg-border bg-eg-surface px-2.5 text-xs text-eg-text transition-colors hover:border-eg-border-strong hover:text-eg-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-eg-gold"><Icon size={14} aria-hidden="true" />{t(label)}</a></li>;
      })}</ul>
    </section>}

    <h2 className="store-title mb-3 mt-6">{t("games_heading")}</h2>
    {studio.games.length > 0 ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{studio.games.map((game) => <li key={game.id}><GameCard game={game} locale={locale} /></li>)}</ul>
      : <p className="border border-eg-border bg-eg-card px-4 py-8 text-center text-xs text-eg-muted">{t("no_games")}</p>}
  </div></div>;
}
