import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

interface VerifyEmailPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: VerifyEmailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("verify_email") };
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex justify-center px-4 py-12">
      <div className="w-full max-w-md border border-eg-border bg-eg-card p-5 text-center">
        <Mail size={20} className="mx-auto mb-3 text-eg-green" aria-hidden="true" />
        <h1 className="text-base font-semibold text-eg-heading">{t("verify_email")}</h1>
        <p className="mt-2 text-xs leading-5 text-eg-text-sub">{t("verify_desc")}</p>
        <Link
          href="/login"
          className="mt-4 inline-flex h-8 items-center rounded-sm border border-eg-border bg-eg-surface px-3 text-xs text-eg-text transition-colors hover:border-eg-border-strong hover:text-white"
        >
          {t("back_to_login")}
        </Link>
      </div>
    </div>
  );
}
