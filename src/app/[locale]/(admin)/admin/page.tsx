import { createClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { redirect } from "next/navigation";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) redirect(`/${locale}`);

  const [
    { count: totalGames },
    { count: pendingGames },
    { count: approvedGames },
    { count: totalUsers },
    { count: totalReviews },
    { count: openReports },
    { data: pendingGamesList },
    { data: recentUsers },
    { data: approvedGamesList },
    { data: spotlightGame },
    { data: contactMessages },
    { data: developerApplications },
    { data: allReviews },
  ] = await Promise.all([
    supabase.from("games").select("*", { count: "exact", head: true }),
    supabase.from("games").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("games").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("game_reviews").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("games").select("*, profiles!games_developer_id_fkey(username, display_name)").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("games").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(50),
    supabase.from("games").select("*").eq("status", "approved").not("spotlight_at", "is", null).order("spotlight_at", { ascending: false }).limit(1).single(),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("*").eq("developer_status", "pending").order("created_at", { ascending: false }).limit(20),
    supabase.from("game_reviews").select("*, profiles!game_reviews_user_id_fkey(username, display_name), games!game_reviews_game_id_fkey(title, slug)").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdminDashboardClient
      stats={{
        total_games: totalGames ?? 0,
        pending_games: pendingGames ?? 0,
        approved_games: approvedGames ?? 0,
        total_users: totalUsers ?? 0,
        total_reviews: totalReviews ?? 0,
        open_reports: openReports ?? 0,
      }}
      pendingGames={pendingGamesList ?? []}
      recentUsers={recentUsers ?? []}
      approvedGames={approvedGamesList ?? []}
      spotlightGame={spotlightGame ?? null}
      contactMessages={contactMessages ?? []}
      developerApplications={developerApplications ?? []}
      allReviews={allReviews ?? []}
      isSuperAdmin={profile.role === "super_admin"}
      currentUserId={user.id}
      locale={locale}
    />
  );
}
