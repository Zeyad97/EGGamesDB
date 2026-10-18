import type { Metadata, Viewport } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { Providers } from "@/components/layout/Providers";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: {
      default: t("default_title"),
      template: "%s | EGGameDB",
    },
    description: t("default_description"),
    metadataBase: new URL(SITE_URL),
    applicationName: "EGGameDB",
    keywords: locale === "ar"
      ? ["ألعاب مصرية", "العاب مصرية", "ألعاب", "ألعاب مطورين مصريين", "الألعاب المصرية", "ألعاب مستقلة مصرية"]
      : ["Egyptian games", "games made in Egypt", "Egyptian indie games", "Egyptian game developers", "Egyptian games database"],
    authors: [{ name: "EGGameDB" }],
    creator: "EGGameDB",
    category: "games",
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_EG"],
      siteName: "EGGameDB",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "ar")) notFound();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
