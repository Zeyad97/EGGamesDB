import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedGames } from "@/components/home/FeaturedGames";
import { LatestGames } from "@/components/home/LatestGames";
import { DemoNotice } from "@/components/games/DemoNotice";
import { DEMO_GAMES } from "@/lib/demo-games";
import type { Game } from "@/types";
import { SITE_URL, buildAlternates } from "@/lib/site";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("store_title"), description: t("store_description"), alternates: buildAlternates(locale, "/store") };
}

export default async function HomePage({ params }: HomeProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tg = await getTranslations({ locale, namespace: "games" });

  let spotlightGame: Game | null = null;
  let topRatedGames: Game[] = [];
  let latestGames: Game[] = [];
  let usingDemo = false;

  try {
    const supabase = createPublicClient();
    const [{ data: spotlight }, { data: topRated }, { data: latest }] = await Promise.all([
      supabase
        .from("games")
        .select("*, profiles!games_developer_id_fkey(*)")
        .eq("status", "approved")
        .not("spotlight_at", "is", null)
        .order("spotlight_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("games")
        .select("*")
        .eq("status", "approved")
        .order("average_rating", { ascending: false })
        .limit(8),
      supabase
        .from("games")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    spotlightGame = (spotlight as Game | null) ?? null;
    topRatedGames = (topRated ?? []) as Game[];
    latestGames = (latest ?? []) as Game[];

    // Demo fallback: only when the approved catalog is completely empty.
    // Never appended alongside real games.
    if (!spotlightGame && topRatedGames.length === 0 && latestGames.length === 0) {
      usingDemo = true;
    }
  } catch {
    // Supabase unreachable: show the static demo catalog instead of an error.
    usingDemo = true;
  }

  if (usingDemo) {
    topRatedGames = [...DEMO_GAMES].sort((a, b) => b.average_rating - a.average_rating);
    latestGames = [...DEMO_GAMES].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    spotlightGame = null;
  }

  // Spotlight first, otherwise the top rated game features above the fold.
  const feature = spotlightGame ?? topRatedGames[0] ?? null;
  const shelfGames = spotlightGame
    ? topRatedGames
    : topRatedGames.filter((game) => game.id !== feature?.id);

  const webSiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "EGGameDB", url: `${SITE_URL}/${locale}`, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/${locale}/games?search={search_term_string}`, "query-input": "required name=search_term_string" } };
  const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "EGGameDB", url: SITE_URL, logo: `${SITE_URL}/icon`, sameAs: ["https://github.com/Zeyad97/EGGamesDB"] };

  return (
    <div className="pb-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }} />
      <h1 className="store-container pt-2 text-base font-semibold text-eg-heading">{t("hero_title")}</h1>
      {feature ? (
        <HeroSection game={feature} locale={locale} />
      ) : (
        <section className="border-b border-eg-border bg-eg-darker py-8">
          <div className="store-container">
            <h1 className="text-base font-semibold text-eg-heading">{t("empty_home")}</h1>
            <p className="mt-1 text-xs text-eg-text-sub">{t("empty_home_hint")}</p>
            <Link
              href="/games"
              className="mt-3 inline-flex h-8 items-center rounded-sm bg-eg-blue px-3 text-xs font-medium text-eg-darker transition-colors hover:bg-eg-accent-hover"
            >
              {tg("explore_title")}
            </Link>
          </div>
        </section>
      )}

      {usingDemo && (
        <div className="store-container pt-4">
          <DemoNotice />
        </div>
      )}

      <FeaturedGames games={shelfGames} locale={locale} />
      <LatestGames games={latestGames} locale={locale} />
    </div>
  );
}
