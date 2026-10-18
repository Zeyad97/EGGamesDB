"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validators/auth";

type ForgotPasswordInput = { email: string };

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const validationError = (message?: string) =>
    message && tv.has(message) ? tv(message as never) : message;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(loginSchema.pick({ email: true })) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async ({ email }: ForgotPasswordInput) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}&next=/reset-password`,
      });

      if (error) {
        if (error.status === 429 || error.code === "over_email_send_rate_limit") {
          toast.error(t("reset_rate_limited"));
        } else {
          toast.error(t("reset_request_error"));
        }
        return;
      }

      toast.success(t("reset_request_success"));
      setCooldown(60);
    } catch {
      toast.error(t("reset_request_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-eg-heading">{t("forgot_password")}</h1>
        <p className="mt-1 text-xs leading-5 text-eg-muted">{t("forgot_password_subtitle")}</p>
        {searchParams.get("error") === "link_expired" && (
          <p role="alert" className="mt-3 border border-red-400/40 bg-red-400/10 p-3 text-xs leading-5 text-red-200">
            {t("reset_link_expired")}
          </p>
        )}

        <div className="mt-4 border border-eg-border bg-eg-card p-4">
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input
              label={t("email")}
              type="email"
              autoComplete="email"
              placeholder={t("email_placeholder")}
              prefix={<Mail size={14} />}
              error={validationError(errors.email?.message)}
              {...register("email")}
            />
            <Button type="submit" loading={loading} disabled={cooldown > 0} className="w-full">
              {cooldown > 0 ? t("resend_countdown", { seconds: cooldown }) : t("send_reset_link")}
            </Button>
          </form>
          <p className="mt-4 border-t border-eg-border pt-3 text-xs text-eg-muted">
            <Link href="/login" className="text-eg-blue transition-colors hover:text-white">
              {t("back_to_login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
