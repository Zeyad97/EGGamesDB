import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/auth/ProfileClient";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export const metadata = { title: "My Profile — EGGameDB" };

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
