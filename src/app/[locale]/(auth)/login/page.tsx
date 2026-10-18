"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const validationError = (message?: string) =>
    message && tv.has(message) ? tv(message as never) : message;
  const searchParams = useSearchParams();
  const confirmFailed = searchParams.get("error") === "confirm_failed";
  const emailConfirmed = searchParams.get("confirmed") === "1";
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(data);
    setLoading(false);

    if (error) {
      toast.error(t("auth_error"));
      return;
    }

    toast.success(t("login_success"));
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-eg-heading">{t("login")}</h1>
        <p className="mt-1 text-xs text-eg-muted">{t("login_subtitle")}</p>
        {confirmFailed && (
          <p role="alert" className="mt-3 border border-red-400/40 bg-red-400/10 p-3 text-xs leading-5 text-red-200">
            {t("confirm_failed")}
          </p>
        )}
        {emailConfirmed && (
          <p role="status" className="mt-3 border border-eg-blue/40 bg-eg-blue/10 p-3 text-xs leading-5 text-eg-text-sub">
            {t("email_confirmed_login")}
          </p>
        )}

        <div className="mt-4 border border-eg-border bg-eg-card p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input
              label={t("email")}
              type="email"
              placeholder={t("email_placeholder")}
              prefix={<Mail size={14} />}
              error={validationError(errors.email?.message)}
              {...register("email")}
            />
            <Input
              label={t("password")}
              type="password"
              placeholder={t("password_placeholder")}
              prefix={<Lock size={14} />}
              error={validationError(errors.password?.message)}
              {...register("password")}
            />

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[11px] text-eg-blue transition-colors hover:text-white">
                {t("forgot_password")}
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {t("login")}
            </Button>
          </form>

          <p className="mt-4 border-t border-eg-border pt-3 text-xs text-eg-muted">
            {t("no_account")}{" "}
            <Link href="/register" className="text-eg-blue transition-colors hover:text-white">
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
