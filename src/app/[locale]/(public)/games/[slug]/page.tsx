import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { GameDetailClient } from "@/components/games/GameDetailClient";
import { DEMO_GAMES, findDemoGame } from "@/lib/demo-games";
import type { Game, GameReview } from "@/types";

interface GamePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: GamePageProps) {
  const { slug } = await params;
  try {
    const supabase = createPublicClient();
    const { data: game } = await supabase
      .from("games")
      .select("title, short_description, header_image")
      .eq("slug", slug)
      .single();

    if (game) {
      return {
        title: game.title,
        description: game.short_description,
        openGraph: {
          title: `${game.title} | EGGameDB`,
          description: game.short_description,
          images: game.header_image ? [{ url: game.header_image }] : [],
        },
      };
    }
  } catch {
    // Fall through to the demo lookup below.
  }

  // Metadata must work for demo slugs too. Real rows always win.
  const demo = findDemoGame(slug);
  if (!demo) return {};
  return {
    title: demo.title,
    description: demo.short_description,
    openGraph: {
      title: `${demo.title} | EGGameDB`,
      description: demo.short_description,
      images: demo.header_image ? [{ url: demo.header_image }] : [],
    },
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

  return (
    <GameDetailClient
      game={game as Game}
      reviews={reviews ?? []}
      relatedGames={relatedGames}
      locale={locale}
    />
  );
}
