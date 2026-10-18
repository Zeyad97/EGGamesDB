"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { AtSign, Check, Gamepad2, Lock, Mail, Rocket, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

const ACCOUNT_OPTIONS = [
  {
    value: "studio",
    icon: Rocket,
    title: "account_type_studio_title",
    desc: "account_type_studio_desc",
  },
  {
    value: "player",
    icon: Gamepad2,
    title: "account_type_player_title",
    desc: "account_type_player_desc",
  },
] as const;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.display_name || data.username,
          // Read by handle_new_user (migration 009); ignored until it is applied.
          account_type: data.account_type,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("register_success"));
    router.push("/verify-email");
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-lg font-semibold text-eg-heading">{t("register")}</h1>
        <p className="mt-1 text-xs text-eg-muted">{t("register_subtitle")}</p>

        <div className="mt-4 border border-eg-border bg-eg-card p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <fieldset
              className="space-y-2"
              aria-describedby={errors.account_type ? "account-type-error" : "account-type-hint"}
            >
              <legend className="mb-1 text-xs font-medium text-eg-text-sub">
                {t("account_type_legend")}
              </legend>
              <p id="account-type-hint" className="text-[11px] leading-5 text-eg-muted">
                {t("account_type_hint")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ACCOUNT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className="group relative flex min-h-28 cursor-pointer flex-col gap-2 border border-eg-border bg-eg-darker p-4 text-start transition-colors hover:border-eg-border-strong has-[:checked]:border-eg-gold has-[:checked]:bg-eg-gold/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-eg-gold"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        className="peer sr-only"
                        {...register("account_type")}
                      />
                      <span className="flex h-9 w-9 items-center justify-center border border-eg-border bg-eg-surface text-eg-text-sub peer-checked:border-eg-gold peer-checked:text-eg-gold">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-bold text-eg-heading">{t(option.title)}</span>
                      <span className="text-xs leading-5 text-eg-text-sub">{t(option.desc)}</span>
                      <span
                        aria-hidden="true"
                        className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border border-eg-border text-transparent peer-checked:border-eg-gold peer-checked:bg-eg-gold peer-checked:text-eg-darker"
                      >
                        <Check size={12} />
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.account_type && (
                <p id="account-type-error" role="alert" className="text-xs text-red-400">
                  {t("account_type_required")}
                </p>
              )}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t("username")}
                placeholder={t("username_placeholder")}
                prefix={<AtSign size={14} />}
                error={errors.username?.message}
                {...register("username")}
              />
              <Input
                label={t("display_name")}
                placeholder={t("display_name_placeholder")}
                prefix={<User size={14} />}
                error={errors.display_name?.message}
                {...register("display_name")}
              />
            </div>

            <Input
              label={t("email")}
              type="email"
              placeholder={t("email_placeholder")}
              prefix={<Mail size={14} />}
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label={t("password")}
              type="password"
              placeholder={t("password_hint")}
              prefix={<Lock size={14} />}
              error={errors.password?.message}
              {...register("password")}
            />

            <p className="border border-eg-border bg-eg-surface p-2.5 text-[11px] leading-5 text-eg-text-sub">
              {t("register_notice")}
            </p>

            <Button type="submit" loading={loading} className="w-full">
              {t("register")}
            </Button>
          </form>

          <p className="mt-4 border-t border-eg-border pt-3 text-xs text-eg-muted">
            {t("have_account")}{" "}
            <Link href="/login" className="text-eg-blue transition-colors hover:text-white">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
