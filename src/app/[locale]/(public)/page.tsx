import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { DEMO_GAMES } from "@/lib/demo-games";
import { LandingExperience, type LandingGame } from "@/components/home/LandingExperience";
import type { Game } from "@/types";

interface LandingPageProps {
  params: Promise<{ locale: string }>;
}

function localizedTitle(game: Game, locale: string) {
  return locale === "ar" && game.title_ar ? game.title_ar : game.title;
}

function mediaForGame(game: Game) {
  return [
    game.header_image,
    ...(game.screenshots ?? []).map((screenshot) => screenshot.path_full),
    game.capsule_image,
  ].filter((source): source is string => Boolean(source));
}

function serializeGame(game: Game, locale: string): LandingGame {
  return {
    id: game.id,
    title: localizedTitle(game, locale),
    developer: game.profiles?.display_name || game.developer_name,
    year: game.release_date ? new Date(game.release_date).getFullYear() : null,
    media: [...new Set(mediaForGame(game))],
  };
}

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: t("metadata_title"),
    description: t("metadata_description"),
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;

  let games: Game[] = [];
  let usingDemo = false;

  try {
    const { data, error } = await createPublicClient()
      .from("games")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;
    games = (data ?? []) as Game[];
    if (games.length === 0) usingDemo = true;
  } catch {
    usingDemo = true;
  }

  if (usingDemo) {
    games = [...DEMO_GAMES].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 4);
  }

  const latest = games[0] ? serializeGame(games[0], locale) : null;
  const previews = games.slice(1, 4).map((game) => serializeGame(game, locale));

  return <LandingExperience locale={locale} latest={latest} previews={previews} usingDemo={usingDemo} />;
}
