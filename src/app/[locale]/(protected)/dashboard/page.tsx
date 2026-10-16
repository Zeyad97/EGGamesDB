import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeveloperDashboardClient } from "@/components/admin/DeveloperDashboardClient";
import type { Game } from "@/types";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect(`/${locale}/login`);

  const isDeveloper = ["contributor", "admin", "super_admin"].includes(profile.role);

  let games: Game[] = [];
  if (isDeveloper) {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("developer_id", profile.id)
      .order("created_at", { ascending: false });
    games = (data ?? []) as Game[];
  }

  return (
    <DeveloperDashboardClient
      profile={profile}
      games={games}
      isDeveloper={isDeveloper}
      locale={locale}
    />
  );
}
