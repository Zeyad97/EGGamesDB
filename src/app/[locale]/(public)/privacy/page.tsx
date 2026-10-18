import type { Metadata } from "next";
import { buildAlternates } from "@/lib/site";
import { getTranslations } from "next-intl/server";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

const sectionKeys = [
  "collect",
  "use",
  "storage",
  "network",
  "third_party",
  "cookies",
  "rights",
  "contact",
] as const;

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("privacy_title"), description: t("privacy_description"), alternates: buildAlternates(locale, "/privacy") };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <div className="pb-4">
      <div className="store-container pt-5">
        <h1 className="text-xl font-semibold text-eg-heading">{t("title")}</h1>
        <p className="mt-1 text-xs text-eg-muted">
          {t("last_updated", { date: t("last_updated_date") })}
        </p>

        <div className="mt-5 max-w-3xl space-y-5">
          {sectionKeys.map((key) => (
            <section key={key}>
              <h2 className="text-[13px] font-semibold text-eg-heading">
                {t(`sections.${key}.title`)}
              </h2>
              <p className="mt-1 text-[13px] leading-6 text-eg-text-sub">
                {t(`sections.${key}.content`)}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
