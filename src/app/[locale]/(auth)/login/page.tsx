"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export default function LoginPage() {
  const t = useTranslations("auth");
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
      toast.error(error.message);
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

        <div className="mt-4 border border-eg-border bg-eg-card p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
              placeholder={t("password_placeholder")}
              prefix={<Lock size={14} />}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex justify-end">
              <a href="#" className="text-[11px] text-eg-blue transition-colors hover:text-white">
                {t("forgot_password")}
              </a>
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
