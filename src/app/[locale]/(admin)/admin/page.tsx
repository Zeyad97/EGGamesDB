import { createClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { redirect } from "next/navigation";
import { studioKey, type StudioRow } from "@/lib/validators/studio";

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

  const { data: reportRows, error: reportsError } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const reportUsers = [...new Set((reportRows ?? []).map((report) => report.reporter_id))];
  const reportGameIds = [...new Set((reportRows ?? []).filter((report) => report.target_type === "game").map((report) => report.target_id))];
  const [{ data: reporterProfiles }, { data: reportGames }] = await Promise.all([
    reportUsers.length ? supabase.from("profiles").select("id, username, display_name").in("id", reportUsers) : Promise.resolve({ data: [] }),
    reportGameIds.length ? supabase.from("games").select("id, slug, title, title_ar").in("id", reportGameIds) : Promise.resolve({ data: [] }),
  ]);
  const reportersById = new Map((reporterProfiles ?? []).map((reporter) => [reporter.id, reporter]));
  const gamesById = new Map((reportGames ?? []).map((game) => [game.id, game]));
  const reports = (reportRows ?? []).map((report) => ({
    ...report,
    profiles: reportersById.get(report.reporter_id),
    games: gamesById.get(report.target_id) ?? null,
  }));

  // Studios (migration 008). A missing table is reported as a notice in the panel.
  const { data: studioRows, error: studioError } = await supabase.from("studios").select("*").order("name");
  const { data: approvedDevelopers } = await supabase.from("games").select("developer_name").eq("status", "approved");
  const registeredKeys = new Set(((studioRows ?? []) as StudioRow[]).map((row) => studioKey(row.name)));
  const studioGameCounts: Record<string, number> = {};
  const unregistered = new Map<string, { name: string; count: number }>();
  for (const game of (approvedDevelopers ?? []) as { developer_name: string | null }[]) {
    const name = game.developer_name?.trim();
    if (!name) continue;
    const key = studioKey(name);
    studioGameCounts[key] = (studioGameCounts[key] ?? 0) + 1;
    if (!registeredKeys.has(key)) {
      const entry = unregistered.get(key) ?? { name, count: 0 };
      entry.count += 1;
      unregistered.set(key, entry);
    }
  }
  const studioSuggestions = [...unregistered.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((entry) => entry.name);

  return (
    <AdminDashboardClient
      studios={(studioRows ?? []) as StudioRow[]}
      studiosTableMissing={!!studioError}
      studioGameCounts={studioGameCounts}
      studioSuggestions={studioSuggestions}
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
      reports={reports}
      reportsTableMissing={!!reportsError}
      isSuperAdmin={profile.role === "super_admin"}
      currentUserId={user.id}
      locale={locale}
    />
  );
}
