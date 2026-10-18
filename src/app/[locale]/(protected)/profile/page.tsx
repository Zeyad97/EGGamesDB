import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/auth/ProfileClient";
import { PlayerProfileClient, type PlayerReview, type WishlistItem } from "@/components/profile/PlayerProfileClient";
import { hasAccountTypeColumn, isSchemaMissingError, resolveAccountType } from "@/lib/account";
import type { Game } from "@/types";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export const metadata = { title: "My Profile | EGGameDB" };

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect(`/${locale}/login`);

  if (resolveAccountType(profile) === "studio") {
    const { data: myGames } = await supabase
      .from("games")
      .select("*")
      .eq("developer_id", user.id)
      .order("created_at", { ascending: false });

    return (
      <ProfileClient
        profile={profile}
        games={myGames ?? []}
        locale={locale}
      />
    );
  }

  // Player profile. Rows for games that are no longer approved come back with a
  // null game (RLS hides them), so they are dropped here.
  const [wishlistResult, reviewsResult] = await Promise.all([
    supabase
      .from("wishlists")
      .select("created_at, game:games(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("game_reviews")
      .select("id, rating, content, is_recommended, created_at, game:games(id, slug, title, title_ar, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // Before migration 009 the wishlists table is missing: show a coming-soon notice, not an error.
  const wishlistAvailable = !isSchemaMissingError(wishlistResult.error);
  const wishlist: WishlistItem[] = wishlistAvailable
    ? (wishlistResult.data ?? []).flatMap((row) => {
        const game = row.game as unknown as Game | null;
        return game && game.status === "approved" ? [{ added_at: row.created_at, game }] : [];
      })
    : [];

  const reviews: PlayerReview[] = (reviewsResult.data ?? []).flatMap((row) => {
    const game = row.game as unknown as (PlayerReview["game"] & { status: string }) | null;
    if (!game || game.status !== "approved") return [];
    return [{
      id: row.id,
      rating: row.rating,
      content: row.content,
      is_recommended: row.is_recommended,
      created_at: row.created_at,
      game: { id: game.id, slug: game.slug, title: game.title, title_ar: game.title_ar },
    }];
  });

  return (
    <PlayerProfileClient
      profile={profile}
      wishlist={wishlist}
      wishlistAvailable={wishlistAvailable}
      reviews={reviews}
      accountTypeAvailable={hasAccountTypeColumn(profile)}
      locale={locale}
    />
  );
}
