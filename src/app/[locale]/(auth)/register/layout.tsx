import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface RegisterLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RegisterLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("register") };
}

/** Metadata-only wrapper: the sign-up form itself is a client component. */
export default function RegisterLayout({ children }: RegisterLayoutProps) {
  return <>{children}</>;
}
