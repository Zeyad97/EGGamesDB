import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { GameSubmissionForm } from "@/components/games/GameSubmissionForm";

interface SubmitPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SubmitPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submission" });
  return { title: t("title") };
}

export default async function SubmitPage({ params }: SubmitPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submission" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, developer_status").eq("id", user.id).single()
    : { data: null };
  const canSubmit = !!profile && ["contributor", "admin", "super_admin"].includes(profile.role);
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {canSubmit ? <GameSubmissionForm locale={locale} /> : (
          <section className="border border-eg-border bg-eg-card p-6">
            <h1 className="text-2xl font-black text-eg-heading">{t("developer_only")}</h1>
            <p className="mt-2 text-eg-text-sub">{t("application_status", { status: t(`application_${profile?.developer_status ?? "none"}`) })}</p>
            <Link href="/dashboard" className="mt-5 inline-flex rounded bg-eg-gold px-4 py-2 font-semibold text-black">{t("go_dashboard")}</Link>
          </section>
        )}
      </div>
    </div>
  );
}
