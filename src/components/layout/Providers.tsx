"use client";

import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SetupBanner } from "@/components/layout/SetupBanner";
import { usePathname } from "@/i18n/navigation";
import type { AbstractIntlMessages } from "next-intl";

interface ProvidersProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

function AppShell({ children, locale }: Pick<ProvidersProps, "children" | "locale">) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <AuthProvider>
      <AuthRedirectHandler />
      {!isLanding && <SetupBanner />}
      <Navbar locale={locale} />
      <main className="store-shell min-h-screen">{children}</main>
      {!isLanding && <Footer />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#211d17",
            color: "#e7dfd0",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "2px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#d6b15a", secondary: "#12100d" } },
          error: { iconTheme: { primary: "#ce3041", secondary: "#12100d" } },
        }}
      />
    </AuthProvider>
  );
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale} timeZone="Africa/Cairo">
        <AppShell locale={locale}>{children}</AppShell>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
