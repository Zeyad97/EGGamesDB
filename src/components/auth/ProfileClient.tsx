"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { GameCard } from "@/components/games/GameCard";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators/auth";
import { formatDate } from "@/lib/utils";
import { Gamepad2, Settings, Calendar, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import type { Profile, Game } from "@/types";

interface ProfileClientProps {
  profile: Profile;
  games: Game[];
  locale: string;
}

export function ProfileClient({ profile, games, locale }: ProfileClientProps) {
  const t = useTranslations("profile");
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"games" | "settings">("games");
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: profile.display_name ?? "",
      bio: profile.bio ?? "",
      website: profile.website ?? "",
      twitter: profile.twitter ?? "",
      github: profile.github ?? "",
    },
  });

  const saveProfile = async (data: ProfileUpdateInput) => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(data).eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_updated"));
  };

  const roleKey = profile.role === "super_admin" ? "roles.super_admin" : profile.role === "admin" ? "roles.admin" : profile.role === "contributor" ? "roles.contributor" : "roles.user";
  const counts = {
    total: games.length,
    approved: games.filter((game) => game.status === "approved").length,
    pending: games.filter((game) => game.status === "pending").length,
  };
  const tabs = [
    { key: "games" as const, icon: Gamepad2, label: t("tabs.games", { count: games.length }) },
    { key: "settings" as const, icon: Settings, label: t("tabs.settings") },
  ];

  return (
    <div className="min-h-screen">
      <div className="store-container py-6 sm:py-8">
        <header className="border border-eg-border bg-eg-card p-4 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">{t("eyebrow")}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-eg-heading">{profile.display_name || profile.username}</h1><Badge variant={profile.role.includes("admin") ? "green" : profile.role === "contributor" ? "gold" : "default"}>{t(roleKey)}</Badge></div>
              <p className="mt-1 text-sm text-eg-text-sub">@{profile.username}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-eg-muted"><Calendar size={12} aria-hidden="true" />{t("joined", { date: formatDate(profile.created_at, locale) })}</p>
              {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-eg-text-sub">{profile.bio}</p>}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 border-t border-eg-border pt-4"><div><p className="text-xl font-bold text-eg-heading">{counts.total}</p><p className="text-[11px] text-eg-muted">{t("metrics.total")}</p></div><div className="border-s border-eg-border ps-3"><p className="text-xl font-bold text-eg-green">{counts.approved}</p><p className="text-[11px] text-eg-muted">{t("metrics.approved")}</p></div><div className="border-s border-eg-border ps-3"><p className="text-xl font-bold text-eg-gold">{counts.pending}</p><p className="text-[11px] text-eg-muted">{t("metrics.pending")}</p></div></div>
        </header>

        <nav aria-label={t("tabs_label")} className="mt-5 overflow-x-auto border-y border-eg-border"><div className="flex min-w-max">{tabs.map((tab) => <button key={tab.key} type="button" aria-current={activeTab === tab.key ? "page" : undefined} onClick={() => setActiveTab(tab.key)} className={`flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-eg-gold ${activeTab === tab.key ? "border-eg-gold text-eg-gold" : "border-transparent text-eg-text-sub hover:text-eg-heading"}`}><tab.icon size={15} aria-hidden="true" />{tab.label}</button>)}</div></nav>

        {activeTab === "games" && <section className="mt-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("archive_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("submissions_title")}</h2></div>{["contributor", "admin", "super_admin"].includes(profile.role) && <Link href="/submit"><Button size="sm" className="gap-2"><PlusCircle size={14} aria-hidden="true" />{t("submit_game")}</Button></Link>}</div>{games.length === 0 ? <div className="border border-eg-border py-12 text-center"><Gamepad2 size={32} className="mx-auto mb-3 text-eg-muted" aria-hidden="true" /><p className="text-sm text-eg-muted">{t("empty_games")}</p>{profile.role === "user" && <p className="mx-auto mt-2 max-w-sm text-xs text-eg-muted">{t("contributor_hint")}</p>}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{games.map((game) => <GameCard key={game.id} game={game} locale={locale} />)}</div>}</section>}

        {activeTab === "settings" && <section className="mt-5 max-w-2xl border border-eg-border bg-eg-card p-4 sm:p-5"><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("settings_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("settings_title")}</h2><p className="mt-1 text-xs text-eg-muted">{t("settings_desc")}</p><form onSubmit={handleSubmit(saveProfile)} className="mt-5 space-y-5"><div className="border-b border-eg-border pb-5"><p className="mb-3 text-xs font-semibold text-eg-text-sub">{t("identity_group")}</p><div className="space-y-4"><Input label={t("display_name")} error={errors.display_name?.message} {...register("display_name")} /><Textarea label={t("bio")} rows={3} error={errors.bio?.message} {...register("bio")} /></div></div><div className="border-b border-eg-border pb-5"><p className="mb-3 text-xs font-semibold text-eg-text-sub">{t("links_group")}</p><div className="space-y-4"><Input label={t("website")} type="url" placeholder="https://..." error={errors.website?.message} {...register("website")} /><div className="grid gap-4 sm:grid-cols-2"><Input label={t("twitter")} placeholder={t("twitter_placeholder")} {...register("twitter")} /><Input label={t("github")} {...register("github")} /></div></div></div><Button type="submit" loading={saving}>{t("save")}</Button></form></section>}
      </div>
    </div>
  );
}
