import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface ContactLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("meta_title"), description: t("subtitle") };
}

/** Metadata-only wrapper: the contact form itself is a client component. */
export default function ContactLayout({ children }: ContactLayoutProps) {
  return <>{children}</>;
}
