"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";

export function AuthRedirectHandler() {
  const handled = useRef(false);
  const router = useRouter();
  const t = useTranslations("auth");
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    if (handled.current) return;

    const location = window.location;
    if (location.pathname.startsWith("/api/")) return;

    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const fragment = new URLSearchParams(location.hash.slice(1));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const hasExpiredError = fragment.has("error") && fragment.get("error_code") === "otp_expired";
    const hashType = fragment.get("type");
    const hasSessionHash = Boolean(accessToken && refreshToken && ["signup", "recovery", "magiclink", "email_change"].includes(hashType ?? ""));

    if (!code && !hasSessionHash && !hasExpiredError) return;

    handled.current = true;
    const clearHash = () => {
      window.history.replaceState(window.history.state, "", `${location.pathname}${location.search}`);
    };
    const go = (path: "/profile" | "/reset-password" | "/login") => {
      router.replace(path);
      router.refresh();
    };

    if (hasExpiredError) {
      clearHash();
      const recovery = hashType === "recovery";
      router.replace(recovery ? "/forgot-password?error=link_expired" : "/login?error=confirm_failed");
      return;
    }

    const supabase = createClient();
    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        const cleanUrl = new URL(window.location.href);
        window.history.replaceState(window.history.state, "", cleanUrl.pathname);
        if (error) {
          setProfile(null);
          setLoading(false);
          toast(t("email_confirmed_login"));
          // Preserve the confirmed notice without forwarding any callback data.
          router.replace("/login?confirmed=1");
          router.refresh();
          return;
        }
        toast.success(t("email_confirmed"));
        go("/profile");
      }).catch(() => {
        const cleanUrl = new URL(window.location.href);
        window.history.replaceState(window.history.state, "", cleanUrl.pathname);
        toast(t("email_confirmed_login"));
        router.replace("/login?confirmed=1");
      });
      return;
    }

    clearHash();
    void supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! }).then(({ error }) => {
      if (error) {
        toast(t("email_confirmed_login"));
        router.replace("/login?confirmed=1");
        return;
      }
      if (hashType === "recovery") {
        go("/reset-password");
        return;
      }
      toast.success(t("email_confirmed"));
      go("/profile");
    }).catch(() => {
      toast(t("email_confirmed_login"));
      router.replace("/login?confirmed=1");
    });
  }, [router, setLoading, setProfile, t]);

  return null;
}
