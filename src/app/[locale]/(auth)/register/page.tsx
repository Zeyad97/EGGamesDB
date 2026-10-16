"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { AtSign, Lock, Mail, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

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
