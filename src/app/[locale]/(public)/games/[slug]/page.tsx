import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { GameDetailClient } from "@/components/games/GameDetailClient";
import { DEMO_GAMES, findDemoGame } from "@/lib/demo-games";
import type { Game, GameReview } from "@/types";
import { buildAlternates, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

interface GamePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: GamePageProps) {
  const { slug, locale } = await params;
  try {
    const supabase = createPublicClient();
    const { data: game } = await supabase
      .from("games")
      .select("title, title_ar, short_description, short_description_ar, header_image")
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    if (game) {
      const title = locale === "ar" && game.title_ar ? game.title_ar : game.title;
      const description = locale === "ar" && game.short_description_ar ? game.short_description_ar : game.short_description;
      const image = game.header_image ? [{ url: game.header_image, alt: title }] : [];
      return {
        title,
        description,
        alternates: buildAlternates(locale, `/games/${slug}`),
        openGraph: { title, description, images: image },
        twitter: { card: "summary_large_image", title, description, images: image.map((item) => item.url) },
      };
    }
  } catch {
    // Fall through to the demo lookup below.
  }

  const demo = findDemoGame(slug);
  if (!demo) return {};
  const title = locale === "ar" && demo.title_ar ? demo.title_ar : demo.title;
  const description = locale === "ar" && demo.short_description_ar ? demo.short_description_ar : demo.short_description;
  const image = demo.header_image ? [{ url: demo.header_image, alt: title }] : [];
  return {
    title,
    description,
    alternates: buildAlternates(locale, `/games/${slug}`),
    robots: { index: false, follow: false },
    openGraph: { title, description, images: image },
    twitter: { card: "summary_large_image", title, description, images: image.map((item) => item.url) },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug, locale } = await params;

  // Real rows always win: query Supabase first.
  let game: Game | null = null;
  let supabase: ReturnType<typeof createPublicClient> | null = null;
  try {
    supabase = createPublicClient();
    const { data } = await supabase
      .from("games")
      .select("*, profiles!games_developer_id_fkey(*)")
      .eq("slug", slug)
      .eq("status", "approved")
      .single();
    game = (data as Game | null) ?? null;
  } catch {
    game = null;
  }

  if (!game) {
    // Demo fallback: render the static listing with the other demos as
    // related games. No review/view database writes for demos.
    const demo = findDemoGame(slug);
    if (!demo) notFound();
    const relatedGames = DEMO_GAMES.filter((other) => other.slug !== slug);
    return (
      <GameDetailClient
        game={demo}
        reviews={[]}
        relatedGames={relatedGames as Partial<Game>[]}
        locale={locale}
      />
    );
  }

  if (!supabase) notFound();

  let reviews: GameReview[] = [];
  let relatedGames: Partial<Game>[] = [];
  try {
    const [{ data: reviewRows }, { data: relatedRows }] = await Promise.all([
      supabase
        .from("game_reviews")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("game_id", game.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("games")
        .select(
          "id, slug, title, title_ar, header_image, capsule_image, short_description, developer_name, average_rating, rating_count, genres, tags, is_free, price_usd, status"
        )
        .eq("status", "approved")
        .neq("slug", slug)
        .limit(6),
    ]);
    reviews = (reviewRows ?? []) as GameReview[];
    relatedGames = (relatedRows ?? []) as Partial<Game>[];
  } catch {
    // Reviews/related are non-critical: render the game without them.
  }

  // Increment view count (fire-and-forget)
  supabase.rpc("increment_view_count", { game_id: game.id }).then(
    () => {},
    () => {}
  );

  const localizedName = locale === "ar" && game.title_ar ? game.title_ar : game.title;
  const localizedDescription = locale === "ar" && game.short_description_ar ? game.short_description_ar : game.short_description;
  const gameUrl = `${SITE_URL}/${locale}/games/${game.slug}`;
  const videoGameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: localizedName,
    ...(game.title_ar ? { alternateName: game.title_ar } : {}),
    description: localizedDescription,
    ...(game.header_image ? { image: game.header_image } : {}),
    url: gameUrl,
    ...(game.genres?.length ? { genre: game.genres } : {}),
    gamePlatform: "PC",
    operatingSystem: [game.windows_requirements && "Windows", game.mac_requirements && "macOS", game.linux_requirements && "Linux"].filter(Boolean).join(", ") || "Windows",
    ...(game.release_date ? { datePublished: game.release_date } : {}),
    author: { "@type": "Organization", name: game.developer_name },
    ...(game.publisher ? { publisher: { "@type": "Organization", name: game.publisher } } : {}),
    countryOfOrigin: { "@type": "Country", name: "Egypt" },
    inLanguage: locale === "ar" ? ["ar", "en"] : ["en", "ar"],
    ...(game.is_free || game.price_usd !== null ? { offers: { "@type": "Offer", price: game.is_free ? 0 : game.price_usd, priceCurrency: "USD", availability: "https://schema.org/InStock", url: game.steam_url || gameUrl } } : {}),
    ...(game.rating_count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: game.average_rating, ratingCount: game.rating_count, bestRating: 10, worstRating: 1 } } : {}),
    ...(game.steam_url ? { sameAs: game.steam_url } : {}),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "EGGameDB", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: locale === "ar" ? "الألعاب" : "Games", item: `${SITE_URL}/${locale}/games` },
      { "@type": "ListItem", position: 3, name: localizedName, item: gameUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />
      <GameDetailClient game={game as Game} reviews={reviews ?? []} relatedGames={relatedGames} locale={locale} />
    </>
  );
}
