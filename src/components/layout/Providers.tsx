"use client";

import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SetupBanner } from "@/components/layout/SetupBanner";
import type { AbstractIntlMessages } from "next-intl";

interface ProvidersProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale} timeZone="Africa/Cairo">
        <AuthProvider>
          <SetupBanner />
          <Navbar locale={locale} />
          <main className="store-shell min-h-screen">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#18242f",
                color: "#c7d5e0",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: "2px",
                fontSize: "13px",
              },
              success: { iconTheme: { primary: "#66c0f4", secondary: "#10151a" } },
            }}
          />
        </AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
