import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface LoginLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LoginLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("login") };
}

/** Metadata-only wrapper: the sign-in form itself is a client component. */
export default function LoginLayout({ children }: LoginLayoutProps) {
  return <>{children}</>;
}
