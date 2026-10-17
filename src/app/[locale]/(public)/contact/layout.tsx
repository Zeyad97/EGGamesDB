import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/site";

interface ContactLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("contact_title"), description: t("contact_description"), alternates: buildAlternates(locale, "/contact") };
}

/** Metadata-only wrapper: the contact form itself is a client component. */
export default function ContactLayout({ children }: ContactLayoutProps) {
  return <>{children}</>;
}
