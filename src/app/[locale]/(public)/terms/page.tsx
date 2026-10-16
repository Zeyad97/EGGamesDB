import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

const sectionKeys = [
  "acceptance",
  "accounts",
  "content",
  "contributors",
  "intellectual_property",
  "conduct",
  "disclaimer",
  "changes",
] as const;

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return { title: t("meta_title") };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

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
