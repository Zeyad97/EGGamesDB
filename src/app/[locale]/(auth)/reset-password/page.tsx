"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators/auth";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const validationError = (message?: string) =>
    message && tv.has(message) ? tv(message as never) : message;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data, error } = await createClient().auth.getUser();
      if (active) {
        setHasSession(Boolean(data.user) && !error);
        setCheckingSession(false);
      }
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async ({ password }: ResetPasswordInput) => {
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(
        error.message.toLowerCase().includes("new password should be different from the old password")
          ? t("reset_same_password")
          : t("reset_update_error")
      );
      return;
    }

    toast.success(t("reset_update_success"));
    router.push("/profile");
  };

  if (checkingSession) {
    return <div className="flex justify-center px-4 py-10"><p className="text-xs text-eg-muted">{t("checking_reset_link")}</p></div>;
  }

  if (!hasSession) {
    return (
      <div className="flex justify-center px-4 py-12">
        <div className="w-full max-w-md border border-eg-border bg-eg-card p-5 text-center">
          <h1 className="text-base font-semibold text-eg-heading">{t("reset_link_invalid_title")}</h1>
          <p role="alert" className="mt-2 text-xs leading-5 text-eg-text-sub">{t("reset_link_invalid")}</p>
          <Link href="/forgot-password" className="mt-4 inline-flex h-8 items-center rounded-sm border border-eg-border bg-eg-surface px-3 text-xs text-eg-text transition-colors hover:border-eg-border-strong hover:text-white">
            {t("request_new_reset_link")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-eg-heading">{t("reset_password")}</h1>
        <p className="mt-1 text-xs leading-5 text-eg-muted">{t("reset_password_subtitle")}</p>
        <div className="mt-4 border border-eg-border bg-eg-card p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input label={t("new_password")} type="password" autoComplete="new-password" placeholder={t("password_hint")} prefix={<Lock size={14} />} error={validationError(errors.password?.message)} {...register("password")} />
            <Input label={t("confirm_password")} type="password" autoComplete="new-password" placeholder={t("password_placeholder")} prefix={<Lock size={14} />} error={validationError(errors.confirmPassword?.message)} {...register("confirmPassword")} />
            <Button type="submit" loading={loading} className="w-full">{t("save_new_password")}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
