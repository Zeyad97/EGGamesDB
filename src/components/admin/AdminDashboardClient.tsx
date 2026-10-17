"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/useCarousel";
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  BarChart3,
  Star,
  Mail,
  MessageSquare,
  Rocket,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AdminStats, ContactMessage, Game, GameReview, Profile } from "@/types";

interface AdminDashboardClientProps {
  stats: AdminStats;
  pendingGames: (Game & { profiles?: Profile })[];
  recentUsers: Profile[];
  approvedGames: Game[];
  spotlightGame: Game | null;
  contactMessages: ContactMessage[];
  developerApplications: Profile[];
  allReviews: (GameReview & { profiles?: Profile; games?: Partial<Game> })[];
  isSuperAdmin: boolean;
  currentUserId: string;
  locale: string;
}

type AdminTab = "overview" | "games" | "users" | "messages" | "reviews" | "applications";

const statCards = (stats: AdminStats, t: (key: string) => string) => [
  { icon: Gamepad2, label: t("total_games"), value: stats.total_games },
  { icon: Clock, label: t("pending_review"), value: stats.pending_games, accent: "text-eg-gold" },
  { icon: CheckCircle, label: t("approved"), value: stats.approved_games, accent: "text-eg-green" },
  { icon: Users, label: t("total_users"), value: stats.total_users },
  { icon: BarChart3, label: t("reviews"), value: stats.total_reviews },
  { icon: AlertTriangle, label: t("open_reports"), value: stats.open_reports, accent: "text-eg-red" },
];

export function AdminDashboardClient({
  stats,
  pendingGames,
  recentUsers,
  approvedGames,
  spotlightGame: initialSpotlight,
  contactMessages: initialMessages,
  developerApplications: initialApplications,
  allReviews: initialReviews,
  isSuperAdmin,
  currentUserId,
  locale,
}: AdminDashboardClientProps) {
  const t = useTranslations("admin");
  const supabase = createClient();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [rejectModal, setRejectModal] = useState({ open: false, gameId: "", gameTitle: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [games, setGames] = useState(pendingGames);
  const [spotlightGame, setSpotlightGame] = useState<Game | null>(initialSpotlight);
  const [messages, setMessages] = useState(initialMessages);
  const [applications, setApplications] = useState(initialApplications);
  const [reviews, setReviews] = useState(initialReviews);

  const handleMessageStatus = async (msgId: string, status: string) => {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", msgId);
    if (error) { toast.error(error.message); return; }
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: status as ContactMessage["status"] } : m)));
    toast.success(t("toast_message_updated"));
  };

  const handleDeleteMessage = async (msgId: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", msgId);
    if (error) { toast.error(error.message); return; }
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    toast.success(t("toast_message_deleted"));
  };

  const handleApproveDeveloper = async (userId: string) => {
    setProcessing(`dev-${userId}`);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "contributor", developer_status: "approved" })
      .eq("id", userId);
    setProcessing(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_developer_approved"));
    setApplications((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRejectDeveloper = async (userId: string) => {
    setProcessing(`dev-${userId}`);
    const { error } = await supabase
      .from("profiles")
      .update({ developer_status: "rejected" })
      .eq("id", userId);
    setProcessing(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_application_rejected"));
    setApplications((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t("confirm_delete_review"))) return;
    const { error } = await supabase.from("game_reviews").delete().eq("id", reviewId);
    if (error) { toast.error(error.message); return; }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    toast.success(t("toast_review_deleted"));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("confirm_delete_user"))) return;
    setProcessing(`deluser-${userId}`);
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    setProcessing(null);
    if (!response.ok) { toast.error("Unable to delete user"); return; }
    toast.success(t("toast_user_deleted"));
  };

  const handleDemote = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ role: "contributor" }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_demoted"));
  };

  const handleSetSpotlight = async (gameId: string) => {
    setProcessing(`spotlight-${gameId}`);
    const { error: clearErr } = await supabase
      .from("games")
      .update({ spotlight_at: null })
      .not("spotlight_at", "is", null);
    if (!clearErr) {
      const { data, error } = await supabase
        .from("games")
        .update({ spotlight_at: new Date().toISOString() })
        .eq("id", gameId)
        .select()
        .single();
      if (error) { toast.error(error.message); setProcessing(null); return; }
      setSpotlightGame(data);
      toast.success(t("toast_spotlight_set"));
    } else {
      toast.error(clearErr.message);
    }
    setProcessing(null);
  };

  const handleRemoveSpotlight = async () => {
    if (!spotlightGame) return;
    setProcessing("spotlight-remove");
    const { error } = await supabase
      .from("games")
      .update({ spotlight_at: null })
      .eq("id", spotlightGame.id);
    setProcessing(null);
    if (error) { toast.error(error.message); return; }
    setSpotlightGame(null);
    toast.success(t("toast_spotlight_removed"));
  };

  const handleApprove = async (gameId: string) => {
    setProcessing(gameId);
    const { error } = await supabase
      .from("games")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", gameId);
    setProcessing(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_game_approved"));
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { toast.error(t("reason_required")); return; }
    setProcessing(rejectModal.gameId);
    const { error } = await supabase
      .from("games")
      .update({ status: "rejected", rejection_reason: rejectionReason, reviewed_at: new Date().toISOString() })
      .eq("id", rejectModal.gameId);
    setProcessing(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_game_rejected"));
    setGames((prev) => prev.filter((g) => g.id !== rejectModal.gameId));
    setRejectModal({ open: false, gameId: "", gameTitle: "" });
    setRejectionReason("");
  };

  const handlePromote = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_promoted", { role: roleLabel(newRole) }));
  };

  const roleLabel = (role: string) => {
    if (role === "super_admin") return t("roles.super_admin");
    if (role === "admin") return t("roles.admin");
    if (role === "contributor") return t("roles.contributor");
    return t("roles.user");
  };

  const tabs = [
    { key: "overview" as const, icon: LayoutDashboard, label: t("tabs.overview") },
    { key: "games" as const, icon: Gamepad2, label: t("tabs.games", { count: stats.pending_games }) },
    { key: "applications" as const, icon: Rocket, label: t("tabs.applications", { count: applications.length }) },
    { key: "reviews" as const, icon: MessageSquare, label: t("tabs.reviews", { count: stats.total_reviews }) },
    { key: "messages" as const, icon: Mail, label: t("tabs.messages", { count: messages.length }) },
    { key: "users" as const, icon: Users, label: t("tabs.users") },
  ];

  const entryMotion = prefersReducedMotion ? { initial: false } : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen">
      <div className="store-container py-6 sm:py-8">
        <header className="border-b border-eg-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">{t("eyebrow")}</p>
              <h1 className="mt-1 text-2xl font-black text-eg-heading sm:text-3xl">{t("dashboard")}</h1>
              <p className="mt-1 text-sm text-eg-text-sub">{isSuperAdmin ? t("role_super_admin") : t("role_admin")} · {t("panel_suffix")}</p>
            </div>
            <Shield size={22} className="mt-1 text-eg-gold" aria-hidden="true" />
          </div>
        </header>

        <div className="grid grid-cols-2 border-x border-b border-eg-border sm:grid-cols-3 lg:grid-cols-6">
          {statCards(stats, (key) => t(key)).map((stat, index) => (
            <motion.div
              key={stat.label}
              {...entryMotion}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.04, duration: 0.25 }}
              className="border-e border-b border-eg-border px-3 py-3 last:border-e-0 sm:px-4 lg:border-b-0"
            >
              <div className="flex items-center justify-between gap-2">
                <stat.icon size={14} className={stat.accent || "text-eg-muted"} aria-hidden="true" />
                <span className="text-xl font-bold text-eg-heading">{stat.value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-eg-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <nav aria-label={t("navigation_label")} className="mt-5 overflow-x-auto border-y border-eg-border">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-current={activeTab === tab.key ? "page" : undefined}
                onClick={() => setActiveTab(tab.key)}
                className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-eg-gold sm:px-4 ${
                  activeTab === tab.key ? "border-eg-gold text-eg-gold" : "border-transparent text-eg-text-sub hover:text-eg-heading"
                }`}
              >
                <tab.icon size={14} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="mt-5">
          {activeTab === "overview" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="border border-eg-border bg-eg-card p-4 sm:p-5">
                <div className="flex items-end justify-between border-b border-eg-border pb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("queue_label")}</p>
                    <h2 className="mt-1 font-bold text-eg-heading">{t("recent_pending")}</h2>
                  </div>
                  <button type="button" onClick={() => setActiveTab("games")} className="text-xs text-eg-gold hover:text-eg-accent-hover">{t("view_queue")}</button>
                </div>
                <div className="divide-y divide-eg-border">
                  {games.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex items-center gap-3 py-3">
                      <div className="h-8 w-12 shrink-0 overflow-hidden bg-eg-surface">
                        {game.header_image && <Image src={game.header_image} alt="" width={48} height={32} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-eg-heading">{game.title}</p>
                        <p className="truncate text-xs text-eg-muted">{game.developer_name}</p>
                      </div>
                      <Badge variant="gold">{t("status.pending")}</Badge>
                    </div>
                  ))}
                  {games.length === 0 && <p className="py-7 text-sm text-eg-muted">{t("no_pending")}</p>}
                </div>
              </section>

              <section className="border border-eg-border bg-eg-card p-4 sm:p-5">
                <div className="border-b border-eg-border pb-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("people_label")}</p>
                  <h2 className="mt-1 font-bold text-eg-heading">{t("recent_users")}</h2>
                </div>
                <div className="divide-y divide-eg-border">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3 py-3">
                      <Avatar src={user.avatar_url} name={user.display_name || user.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-eg-heading">{user.display_name || user.username}</p>
                        <p className="text-xs text-eg-muted">{formatDate(user.created_at, locale)}</p>
                      </div>
                      <Badge variant={user.role === "contributor" ? "gold" : user.role.includes("admin") ? "green" : "default"}>{roleLabel(user.role)}</Badge>
                    </div>
                  ))}
                  {recentUsers.length === 0 && <p className="py-7 text-sm text-eg-muted">{t("no_users")}</p>}
                </div>
              </section>
            </div>
          )}

          {activeTab === "games" && (
            <div className="space-y-5">
              <section className="border border-eg-gold/40 bg-eg-card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 border-b border-eg-border pb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-eg-gold">{t("priority_label")}</p>
                    <h2 className="mt-1 font-bold text-eg-heading">{t("spotlight_title")}</h2>
                  </div>
                  <Badge variant="gold">{t("spotlight_badge")}</Badge>
                </div>
                {spotlightGame ? (
                  <div className="flex flex-wrap items-center gap-4 py-4">
                    {spotlightGame.header_image && <div className="relative h-16 w-28 shrink-0 overflow-hidden bg-eg-surface"><Image src={spotlightGame.header_image} alt={spotlightGame.title} fill className="object-cover" /></div>}
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-eg-heading">{spotlightGame.title}</p><p className="text-xs text-eg-muted">{spotlightGame.developer_name}</p></div>
                    <Button size="sm" variant="secondary" loading={processing === "spotlight-remove"} onClick={handleRemoveSpotlight}>{t("remove_spotlight")}</Button>
                  </div>
                ) : <p className="py-4 text-sm text-eg-muted">{t("no_spotlight")}</p>}
                <div className="border-t border-eg-border pt-4">
                  <p className="mb-2 text-xs font-semibold text-eg-text-sub">{t("choose_approved")}</p>
                  <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                    {approvedGames.map((game) => (
                      <button key={game.id} type="button" onClick={() => handleSetSpotlight(game.id)} disabled={processing === `spotlight-${game.id}`} className={`flex min-h-10 items-center gap-3 border p-2 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-eg-gold disabled:opacity-50 ${spotlightGame?.id === game.id ? "border-eg-gold/60 bg-eg-gold/10" : "border-eg-border hover:border-eg-gold/40"}`}>
                        <span className="relative h-7 w-12 shrink-0 overflow-hidden bg-eg-surface">{game.header_image && <Image src={game.header_image} alt="" fill className="object-cover" />}</span>
                        <span className="truncate text-xs font-medium text-eg-text">{game.title}</span>
                        {spotlightGame?.id === game.id && <Star size={12} className="ms-auto shrink-0 text-eg-gold" aria-hidden="true" />}
                      </button>
                    ))}
                    {approvedGames.length === 0 && <p className="text-sm text-eg-muted">{t("no_approved")}</p>}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("queue_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("pending_heading", { count: games.length })}</h2></div>
                </div>
                {games.length === 0 && <div className="border border-eg-border py-12 text-center text-eg-muted"><CheckCircle size={28} className="mx-auto mb-2 text-eg-green" aria-hidden="true" /><p>{t("all_caught_up")}</p></div>}
                <div className="space-y-3">
                  {games.map((game) => (
                    <motion.article key={game.id} {...entryMotion} className="border border-eg-border bg-eg-card p-4 sm:p-5">
                      <div className="flex flex-wrap gap-4">
                        {game.header_image && <div className="relative h-20 w-32 shrink-0 overflow-hidden bg-eg-surface sm:h-24 sm:w-40"><Image src={game.header_image} alt={game.title} fill className="object-cover" /></div>}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div><h3 className="font-bold text-eg-heading">{game.title}</h3><p className="text-sm text-eg-text-sub">{t("submitted_by")} <span className="text-eg-gold">{game.profiles?.display_name || game.developer_name}</span> · {formatDate(game.created_at, locale)}</p>{game.steam_app_id && <a href={game.steam_url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-xs text-eg-blue hover:underline">{t("steam_app", { id: game.steam_app_id })}</a>}</div>
                            <div className="flex flex-wrap gap-2"><Link href={`/games/${game.slug}`}><Button variant="ghost" size="sm" className="gap-1"><Eye size={14} aria-hidden="true" />{t("preview")}</Button></Link><Button size="sm" variant="success" loading={processing === game.id} onClick={() => handleApprove(game.id)}><CheckCircle size={14} aria-hidden="true" />{t("approve")}</Button><Button size="sm" variant="danger" onClick={() => setRejectModal({ open: true, gameId: game.id, gameTitle: game.title })}><XCircle size={14} aria-hidden="true" />{t("reject")}</Button></div>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-eg-text-sub">{game.short_description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">{game.genres.slice(0, 4).map((genre) => <Badge key={genre} variant="outline">{genre}</Badge>)}</div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "applications" && <section className="border border-eg-border bg-eg-card p-4 sm:p-5"><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("priority_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("applications_title")}</h2><p className="mt-1 text-xs text-eg-muted">{t("applications_desc")}</p>{applications.length === 0 ? <p className="py-8 text-center text-sm text-eg-muted">{t("no_applications")}</p> : <div className="mt-4 divide-y divide-eg-border">{applications.map((dev) => <div key={dev.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0"><Avatar src={dev.avatar_url} name={dev.display_name || dev.username} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-eg-heading">{dev.display_name || dev.username}</p><p className="text-xs text-eg-muted">@{dev.username} · {t("applied", { date: formatDate(dev.created_at, locale) })}</p></div><div className="flex gap-2"><Button size="sm" variant="success" loading={processing === `dev-${dev.id}`} onClick={() => handleApproveDeveloper(dev.id)}><CheckCircle size={14} aria-hidden="true" />{t("approve")}</Button><Button size="sm" variant="danger" loading={processing === `dev-${dev.id}`} onClick={() => handleRejectDeveloper(dev.id)}><XCircle size={14} aria-hidden="true" />{t("reject")}</Button></div></div>)}</div>}</section>}

          {activeTab === "reviews" && <section className="border border-eg-border bg-eg-card p-4 sm:p-5"><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("moderation_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("reviews_title")}</h2><p className="mt-1 text-xs text-eg-muted">{t("reviews_desc")}</p>{reviews.length === 0 ? <p className="py-8 text-center text-sm text-eg-muted">{t("no_reviews")}</p> : <div className="mt-4 divide-y divide-eg-border">{reviews.map((review) => <article key={review.id} className="py-3 first:pt-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-eg-heading">{review.profiles?.display_name || review.profiles?.username || t("unknown_user")}</span><span className="text-xs text-eg-muted">{t("on")}</span>{review.games?.title && <Link href={`/games/${review.games.slug}`} className="text-xs text-eg-gold hover:underline">{review.games.title}</Link>}<span className="flex items-center gap-0.5" aria-label={t("rating_aria", { rating: review.rating })}>{Array.from({ length: 10 }, (_, index) => <Star key={index} size={10} className={index < review.rating ? "text-eg-gold fill-eg-gold" : "text-eg-muted"} aria-hidden="true" />)}</span><span className="ms-auto text-xs text-eg-muted">{formatDate(review.created_at, locale)}</span><Button variant="ghost" size="sm" className="gap-1 text-red-400 hover:text-red-300" onClick={() => handleDeleteReview(review.id)}><Trash2 size={13} aria-hidden="true" />{t("remove")}</Button></div>{review.content && <p className="mt-1 text-xs leading-relaxed text-eg-text-sub">{review.content}</p>}</article>)}</div>}</section>}

          {activeTab === "messages" && <section className="border border-eg-border bg-eg-card p-4 sm:p-5"><p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("inbox_label")}</p><h2 className="mt-1 font-bold text-eg-heading">{t("messages_title")}</h2><p className="mt-1 text-xs text-eg-muted">{t("messages_desc")}</p>{messages.length === 0 ? <p className="py-8 text-center text-sm text-eg-muted">{t("no_messages")}</p> : <div className="mt-4 space-y-3">{messages.map((message) => <article key={message.id} className={`border p-3 ${message.status === "new" ? "border-eg-gold/40 bg-eg-gold/5" : "border-eg-border"}`}><div className="flex flex-wrap items-center gap-2"><Badge variant={message.status === "new" ? "gold" : message.status === "read" ? "outline" : "green"}>{t(`message_status.${message.status}`)}</Badge><span className="text-sm font-medium text-eg-heading">{message.name}</span><span className="text-xs text-eg-muted">{message.email}</span><span className="ms-auto text-xs text-eg-muted">{formatDate(message.created_at, locale)}</span></div><p className="mt-2 text-sm font-semibold text-eg-text">{message.subject}</p><p className="mt-1 text-xs leading-relaxed text-eg-text-sub">{message.message}</p><div className="mt-3 flex flex-wrap gap-2">{message.status === "new" && <Button size="sm" variant="secondary" onClick={() => handleMessageStatus(message.id, "read")}>{t("mark_read")}</Button>}<Button size="sm" variant="secondary" onClick={() => handleMessageStatus(message.id, "resolved")}>{t("mark_resolved")}</Button><Button size="sm" variant="ghost" className="gap-1 text-red-400 hover:text-red-300" onClick={() => handleDeleteMessage(message.id)}><Trash2 size={13} aria-hidden="true" />{t("delete")}</Button></div></article>)}</div>}</section>}

          {activeTab === "users" && <section className="overflow-hidden border border-eg-border bg-eg-card"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="border-b border-eg-border"><tr><th className="px-4 py-3 text-start text-xs font-medium text-eg-text-sub">{t("user")}</th><th className="px-4 py-3 text-start text-xs font-medium text-eg-text-sub">{t("role")}</th><th className="px-4 py-3 text-start text-xs font-medium text-eg-text-sub">{t("joined")}</th>{isSuperAdmin && <th className="px-4 py-3 text-start text-xs font-medium text-eg-text-sub">{t("actions")}</th>}</tr></thead><tbody className="divide-y divide-eg-border">{recentUsers.map((user) => <tr key={user.id} className="hover:bg-white/[0.03]"><td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar src={user.avatar_url} name={user.display_name || user.username} size="xs" /><div><p className="font-medium text-eg-heading">{user.display_name || user.username}</p><p className="text-xs text-eg-muted">@{user.username}</p></div></div></td><td className="px-4 py-3"><Badge variant={user.role.includes("admin") ? "green" : user.role === "contributor" ? "gold" : "default"}>{roleLabel(user.role)}</Badge></td><td className="px-4 py-3 text-eg-text-sub">{formatDate(user.created_at, locale)}</td>{isSuperAdmin && <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{user.role === "user" && <Button size="sm" variant="secondary" onClick={() => handlePromote(user.id, "contributor")}>{t("to_contributor")}</Button>}{user.role === "contributor" && <Button size="sm" variant="secondary" onClick={() => handlePromote(user.id, "admin")}>{t("to_admin")}</Button>}{user.role === "admin" && user.id !== currentUserId && <Button size="sm" variant="secondary" onClick={() => handleDemote(user.id)}>{t("to_contributor")}</Button>}{user.id !== currentUserId && <Button size="sm" variant="ghost" className="gap-1 text-red-400 hover:text-red-300" loading={processing === `deluser-${user.id}`} onClick={() => handleDeleteUser(user.id)}><Trash2 size={12} aria-hidden="true" />{t("delete")}</Button>}</div></td>}</tr>)}</tbody></table></div></section>}
        </main>
      </div>

      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, gameId: "", gameTitle: "" })} title={t("reject_title", { title: rejectModal.gameTitle })}>
        <div className="space-y-4">
          <Textarea label={t("rejection_reason")} rows={4} placeholder={t("rejection_placeholder")} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row"><Button variant="danger" onClick={handleReject} loading={processing === rejectModal.gameId} className="flex-1">{t("reject_game")}</Button><Button variant="ghost" onClick={() => setRejectModal({ open: false, gameId: "", gameTitle: "" })} className="flex-1">{t("cancel")}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
