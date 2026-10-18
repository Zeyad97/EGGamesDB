"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/useCarousel";
import { Gamepad2, PlusCircle, Rocket, Clock, CheckCircle, XCircle, Trash2, PenLine, Star } from "lucide-react";
import toast from "react-hot-toast";
import type { Game, Profile } from "@/types";

interface DeveloperDashboardClientProps {
  profile: Profile;
  games: Game[];
  isDeveloper: boolean;
  locale: string;
}

export function DeveloperDashboardClient({ profile, games, isDeveloper, locale }: DeveloperDashboardClientProps) {
  const t = useTranslations("developer");
  const supabase = createClient();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [gameList, setGameList] = useState(games);

  const applyToBeDeveloper = async () => {
    setApplying(true);
    const { error } = await supabase
      .from("profiles")
      .update({ developer_status: "pending" })
      .eq("id", profile.id);
    setApplying(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_application_submitted"));
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm(t("confirm_delete"))) return;
    setDeleting(gameId);
    const { error } = await supabase.from("games").delete().eq("id", gameId);
    setDeleting(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_game_deleted"));
    setGameList((prev) => prev.filter((g) => g.id !== gameId));
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge variant="green"><CheckCircle size={10} aria-hidden="true" /> {t("status.approved")}</Badge>;
    if (status === "pending") return <Badge variant="gold"><Clock size={10} aria-hidden="true" /> {t("status.pending")}</Badge>;
    if (status === "rejected") return <Badge variant="red"><XCircle size={10} aria-hidden="true" /> {t("status.rejected")}</Badge>;
    return <Badge variant="outline">{t("status.draft")}</Badge>;
  };

  const counts = {
    total: gameList.length,
    approved: gameList.filter((game) => game.status === "approved").length,
    pending: gameList.filter((game) => game.status === "pending").length,
    review: gameList.filter((game) => game.status === "rejected" || game.status === "draft").length,
  };
  const roleKey = profile.role === "super_admin" ? "roles.super_admin" : profile.role === "admin" ? "roles.admin" : profile.role === "contributor" ? "roles.contributor" : "roles.user";
  const statusKey = profile.developer_status === "approved" ? "account_status.approved" : profile.developer_status === "pending" ? "account_status.pending" : profile.developer_status === "rejected" ? "account_status.rejected" : "account_status.none";
  const entryMotion = { initial: false, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen">
      <div className="store-container py-6 sm:py-8">
        <header className="border-b border-eg-border pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">{t("eyebrow")}</p>
              <h1 className="mt-1 text-2xl font-black text-eg-heading sm:text-3xl">{t("title")}</h1>
              <p className="mt-1 text-sm text-eg-text-sub">{t("welcome", { name: profile.display_name || profile.username })}</p>
            </div>
            {isDeveloper && <Link href="/submit"><Button size="lg" className="gap-2"><PlusCircle size={16} aria-hidden="true" />{t("submit_game")}</Button></Link>}
          </div>
        </header>

        <section className="mt-5 border border-eg-border bg-eg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-eg-border pb-3">
            <div><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("identity_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{profile.display_name || profile.username}</h2><p className="text-xs text-eg-muted">@{profile.username}</p></div>
            <div className="flex flex-wrap gap-2"><Badge variant={isDeveloper ? "gold" : "default"}>{t(roleKey)}</Badge><Badge variant={profile.developer_status === "rejected" ? "red" : profile.developer_status === "approved" ? "green" : "outline"}>{t(statusKey)}</Badge></div>
          </div>
          {isDeveloper && <div className="grid grid-cols-2 divide-x divide-eg-border rtl:divide-x-reverse sm:grid-cols-4"><div className="pt-4 sm:px-3 sm:first:ps-0"><p className="text-xl font-bold text-eg-heading">{counts.total}</p><p className="text-[11px] text-eg-muted">{t("metrics.total")}</p></div><div className="pt-4 sm:px-3"><p className="text-xl font-bold text-eg-heading">{counts.approved}</p><p className="text-[11px] text-eg-muted">{t("metrics.approved")}</p></div><div className="border-t border-eg-border pt-4 sm:border-t-0 sm:px-3"><p className="text-xl font-bold text-eg-gold">{counts.pending}</p><p className="text-[11px] text-eg-muted">{t("metrics.pending")}</p></div><div className="border-t border-eg-border pt-4 sm:border-t-0 sm:px-3"><p className="text-xl font-bold text-eg-text-sub">{counts.review}</p><p className="text-[11px] text-eg-muted">{t("metrics.review")}</p></div></div>}
        </section>

        {!isDeveloper ? (
          <section className="mt-5 border-s-4 border-eg-gold border-e border-y border-eg-border bg-eg-card p-5 sm:p-7">
            <div className="flex items-start gap-4"><Rocket size={24} className="mt-1 shrink-0 text-eg-gold" aria-hidden="true" /><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-eg-gold">{t("invitation_label")}</p><h2 className="mt-1 text-xl font-black text-eg-heading">{t("become_developer")}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-eg-text-sub">{t("invitation_body")}</p><div className="mt-5">{profile.developer_status === "pending" && <div className="inline-flex items-center gap-2 border border-eg-gold/40 bg-eg-gold/10 px-3 py-2 text-sm text-eg-gold"><Clock size={14} aria-hidden="true" />{t("application_pending")}</div>}{profile.developer_status === "rejected" && <div className="mb-3 inline-flex items-center gap-2 border border-eg-red/40 bg-eg-red/10 px-3 py-2 text-sm text-red-300"><XCircle size={14} aria-hidden="true" />{t("application_rejected")}</div>}{profile.developer_status === "none" && <Button size="lg" onClick={applyToBeDeveloper} loading={applying}>{t("apply")}</Button>}</div></div></div>
          </section>
        ) : (
          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("archive_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("submissions_title")}</h2></div><span className="text-xs text-eg-muted">{t("updated_from_account")}</span></div>
            {gameList.length === 0 ? <div className="border border-eg-border bg-eg-card px-5 py-12 text-center"><Gamepad2 size={32} className="mx-auto mb-3 text-eg-muted" aria-hidden="true" /><p className="text-sm text-eg-muted">{t("empty_games")}</p><Link href="/submit" className="mt-4 inline-flex"><Button className="gap-2"><PlusCircle size={16} aria-hidden="true" />{t("submit_first")}</Button></Link></div> : <div className="space-y-2">{gameList.map((game, index) => <motion.article key={game.id} {...entryMotion} transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.04, duration: 0.25 }} className="border border-eg-border bg-eg-card p-3 sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative h-20 w-full shrink-0 overflow-hidden bg-eg-surface sm:h-16 sm:w-28">{game.header_image ? <Image src={game.header_image} alt={game.title} fill className="object-cover" /> : <Gamepad2 size={22} className="absolute inset-0 m-auto text-eg-muted" aria-hidden="true" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-eg-heading">{game.title}</h3>{statusBadge(game.status)}</div><p className="mt-1 line-clamp-1 text-xs text-eg-muted">{game.short_description}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-eg-muted">{game.average_rating > 0 && <span className="flex items-center gap-1"><Star size={11} className="fill-eg-gold text-eg-gold" aria-hidden="true" />{game.average_rating.toFixed(1)}</span>}{game.view_count > 0 && <span>{t("views", { count: game.view_count })}</span>}{game.steam_url && <span className="text-eg-text-sub">Steam</span>}<span>{formatDate(game.created_at, locale)}</span></div></div><div className="flex flex-wrap gap-2 sm:shrink-0"><Link href={`/games/${game.slug}`}><Button variant="ghost" size="sm">{t("view")}</Button></Link><Link href={`/submit?edit=${game.slug}`}><Button variant="secondary" size="sm" className="gap-1"><PenLine size={13} aria-hidden="true" />{t("edit")}</Button></Link><Button variant="ghost" size="sm" className="gap-1 text-red-400 hover:text-red-300" loading={deleting === game.id} onClick={() => deleteGame(game.id)}><Trash2 size={13} aria-hidden="true" />{t("delete")}</Button></div></div></motion.article>)}</div>}
          </section>
        )}
      </div>
    </div>
  );
}
