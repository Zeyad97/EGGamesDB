import { getTranslations } from "next-intl/server";
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
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <GameSubmissionForm locale={locale} />
      </div>
    </div>
  );
}
