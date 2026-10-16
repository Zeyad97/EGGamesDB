"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Calendar,
  ExternalLink,
  Eye,
  Flag,
  Globe,
  Share2,
  ShoppingCart,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/games/GameCard";
import { DemoNotice } from "@/components/games/DemoNotice";
import { GamePrice, GameRating } from "@/components/games/GamePrice";
import { GameScreenshots } from "@/components/games/GameScreenshots";
import { GameVideos } from "@/components/games/GameVideos";
import { SystemRequirements } from "@/components/games/SystemRequirements";
import { createClient } from "@/lib/supabase/client";
import { isDemoGame } from "@/lib/demo-games";
import { useAuthStore } from "@/store/auth";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Game, GameReview, Profile } from "@/types";

interface GameDetailClientProps {
  game: Game;
  reviews: GameReview[];
  relatedGames: Partial<Game>[];
  locale: string;
}

export function GameDetailClient({ game, reviews, relatedGames, locale }: GameDetailClientProps) {
  const t = useTranslations("games");
  const th = useTranslations("home");
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"about" | "requirements" | "reviews">("about");

  const title = locale === "ar" && game.title_ar ? game.title_ar : game.title;
  const shortDescription =
    locale === "ar" && game.short_description_ar ? game.short_description_ar : game.short_description;
  const longDescription =
    locale === "ar" && game.long_description_ar ? game.long_description_ar : game.long_description;

  const positive = reviews.filter((review) => review.is_recommended).length;
  const reviewPct = reviews.length ? Math.round((positive / reviews.length) * 100) : null;
  const capsule = game.capsule_image || game.header_image;
  const developerName = game.profiles?.display_name || game.developer_name;
  const developerHref = game.profiles?.username ? `/developers/${game.profiles.username}` : null;
  // Demo listings are static: no view/review/report database writes for them.
  const demo = isDemoGame(game);

  const genreLabel = (genre: string) => {
    const key = `genre_${genre.toLowerCase()}`;
    return th.has(key) ? th(key) : genre;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(`${t("copy_link")} ✓`);
  };

  const tabs = [
    { key: "about" as const, label: t("about") },
    { key: "requirements" as const, label: t("requirements_tab") },
    { key: "reviews" as const, label: t("reviews_count", { count: reviews.length }) },
  ];

  return (
    <div className="pb-6">
      <div className="store-container pt-5">
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-eg-muted">
          <Link href="/" className="transition-colors hover:text-eg-blue">
            EGGameDB
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/games" className="transition-colors hover:text-eg-blue">
            {t("all_games")}
          </Link>
          {game.genres[0] && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/games?genre=${encodeURIComponent(game.genres[0])}`}
                className="transition-colors hover:text-eg-blue"
              >
                {genreLabel(game.genres[0])}
              </Link>
            </>
          )}
        </nav>

        <h1 className="text-xl font-semibold text-eg-heading sm:text-2xl">{title}</h1>
        {demo && <DemoNotice className="mt-2" />}
        {game.status !== "approved" && (
          <div className="mt-2">
            <Badge variant={game.status === "pending" ? "blue" : "red"}>{game.status}</Badge>
          </div>
        )}

        {/* Gallery + product summary */}
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <GameScreenshots
              screenshots={game.screenshots ?? []}
              title={title}
              fallbackImage={game.header_image || game.capsule_image}
            />

            {game.videos?.length > 0 && <GameVideos videos={game.videos} title={title} />}
          </div>

          <aside aria-label={t("about")}>
            <div className="border border-eg-border bg-eg-card p-3">
              {capsule && (
                <div className="relative mb-3 aspect-[460/215] overflow-hidden bg-eg-surface">
                  <Image src={capsule} alt="" fill sizes="320px" className="object-cover" />
                </div>
              )}

              <p className="text-[13px] leading-6 text-eg-text-sub">{shortDescription}</p>

              <div className="mt-3 border-t border-eg-border pt-3">
                {reviewPct !== null ? (
                  <p className="text-[13px]">
                    <span className={reviewPct >= 70 ? "text-eg-green" : "text-eg-gold"}>
                      {reviewPct}%
                    </span>{" "}
                    <span className="text-eg-muted">
                      {t("positive")} · {t("reviews_count", { count: reviews.length })}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-eg-muted">{t("no_reviews")}</p>
                )}
                <GameRating game={game} locale={locale} className="mt-1.5" />
              </div>

              {(game.genres.length > 0 || game.tags.length > 0) && (
                <div className="mt-3 border-t border-eg-border pt-3">
                  <p className="mb-1.5 text-[11px] text-eg-muted">{t("tags")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres.map((genre) => (
                      <Link key={genre} href={`/games?genre=${encodeURIComponent(genre)}`}>
                        <Badge variant="outline">{genreLabel(genre)}</Badge>
                      </Link>
                    ))}
                    {game.tags.slice(0, 8).map((tag) => (
                      <Link key={tag} href={`/games?tag=${encodeURIComponent(tag)}`}>
                        <Badge>{tag}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Purchase / action strip */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border border-eg-border bg-eg-surface px-3 py-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-eg-muted">{t("price")}</span>
            <GamePrice game={game} className="text-base font-semibold" />
          </div>

          {game.steam_url && (
            <a href={game.steam_url} target="_blank" rel="noopener noreferrer">
              <Button variant="success" className="gap-1.5">
                <ShoppingCart size={15} aria-hidden="true" />
                {game.is_free ? t("view_on_steam") : t("buy_on_steam")}
                <ExternalLink size={13} aria-hidden="true" />
              </Button>
            </a>
          )}

          <div className="ms-auto flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={copyLink} className="gap-1.5">
              <Share2 size={13} aria-hidden="true" />
              {t("share")}
            </Button>
            {profile && !demo && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-red-300">
                <Flag size={13} aria-hidden="true" />
                {t("report_game")}
              </Button>
            )}
          </div>
        </div>

        {/* Long-form content and metadata */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div role="tablist" aria-label={title} className="flex gap-1 border-b border-eg-border">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-selected={activeTab === tab.key}
                  aria-controls={`panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    "border-b-2 px-3 py-2 text-[13px] transition-colors " +
                    (activeTab === tab.key
                      ? "border-eg-blue text-white"
                      : "border-transparent text-eg-text-sub hover:text-white")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="pt-4"
            >
              {activeTab === "about" && (
                <div className="prose-game" dangerouslySetInnerHTML={{ __html: longDescription }} />
              )}
              {activeTab === "requirements" && (
                <SystemRequirements
                  windows={game.windows_requirements}
                  mac={game.mac_requirements}
                  linux={game.linux_requirements}
                />
              )}
              {activeTab === "reviews" && (
                <ReviewsSection reviews={reviews} gameId={game.id} profile={profile} demo={demo} />
              )}
            </div>
          </div>

          <aside aria-label={t("developer")} className="space-y-4">
            <div className="border border-eg-border bg-eg-card p-3">
              <h2 className="mb-2 border-b border-eg-border pb-2 text-[13px] font-semibold text-eg-heading">
                {t("about")}
              </h2>
              <dl className="space-y-1.5 text-xs">
                <MetaRow
                  icon={<User size={12} aria-hidden="true" />}
                  label={t("developer")}
                  value={
                    developerHref ? (
                      <Link href={developerHref} className="text-eg-text-sub hover:text-eg-blue">
                        {developerName}
                      </Link>
                    ) : (
                      <span className="text-eg-text-sub">{developerName}</span>
                    )
                  }
                />
                {game.publisher && (
                  <MetaRow label={t("publisher")} value={<span className="text-eg-text-sub">{game.publisher}</span>} />
                )}
                {game.release_date && (
                  <MetaRow
                    icon={<Calendar size={12} aria-hidden="true" />}
                    label={t("release_date")}
                    value={<span className="text-eg-text-sub">{formatDate(game.release_date, locale)}</span>}
                  />
                )}
                {reviewPct !== null && (
                  <MetaRow
                    label={t("user_score")}
                    value={
                      <span className={reviewPct >= 70 ? "text-eg-green" : "text-eg-gold"}>
                        {reviewPct}% {t("positive")}
                      </span>
                    }
                  />
                )}
                <MetaRow
                  icon={<Eye size={12} aria-hidden="true" />}
                  label={t("views")}
                  value={<span className="text-eg-text-sub">{formatNumber(game.view_count, locale)}</span>}
                />
                {game.profiles?.website && (
                  <MetaRow
                    icon={<Globe size={12} aria-hidden="true" />}
                    label={t("website")}
                    value={
                      <a
                        href={game.profiles.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-eg-text-sub hover:text-eg-blue"
                      >
                        {game.profiles.website.replace(/^https?:\/\//, "")}
                      </a>
                    }
                  />
                )}
              </dl>
            </div>

            {game.genres.length > 0 && (
              <div className="border border-eg-border bg-eg-card p-3">
                <h2 className="mb-2 border-b border-eg-border pb-2 text-[13px] font-semibold text-eg-heading">
                  {t("genres")}
                </h2>
                <ul className="space-y-1">
                  {game.genres.map((genre) => (
                    <li key={genre}>
                      <Link
                        href={`/games?genre=${encodeURIComponent(genre)}`}
                        className="text-xs text-eg-text-sub transition-colors hover:text-eg-blue"
                      >
                        {genreLabel(genre)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {relatedGames.length > 0 && (
        <section className="store-section mt-6 py-5">
          <div className="store-container">
            <h2 className="store-title mb-3">{t("related")}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {relatedGames.slice(0, 6).map((related) => (
                <GameCard key={related.id} game={related as Game} locale={locale} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-eg-muted">
        {icon}
        {label}
      </dt>
      <dd className="max-w-40 truncate text-end">{value}</dd>
    </div>
  );
}

function ReviewsSection({
  reviews,
  gameId,
  profile,
  demo,
}: {
  reviews: GameReview[];
  gameId: string;
  profile: Profile | null;
  demo: boolean;
}) {
  const t = useTranslations("games");
  const td = useTranslations("demo");
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isRecommended, setIsRecommended] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewList, setReviewList] = useState(reviews);

  const alreadyReviewed = Boolean(
    profile && reviewList.some((review) => review.user_id === profile.id)
  );
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  const submitReview = async () => {
    if (!profile) {
      toast.error(t("login_review"));
      return;
    }
    if (rating < 1) {
      toast.error(t("rating_validation"));
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("game_reviews")
      .insert({
        game_id: gameId,
        user_id: profile.id,
        rating,
        content: content.trim() || null,
        is_recommended: isRecommended,
      })
      .select("*, profiles(username, display_name, avatar_url)")
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("submit_review_action"));
    setReviewList((previous) => [data, ...previous]);
    setRating(0);
    setContent("");
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase.from("game_reviews").delete().eq("id", reviewId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("remove"));
    setReviewList((previous) => previous.filter((review) => review.id !== reviewId));
  };

  return (
    <div>
      {demo ? (
        <div className="mb-4 border-s-2 border-eg-gold bg-eg-card px-2.5 py-1.5">
          <p className="text-[11px] leading-5 text-eg-text-sub">{td("reviews_disabled")}</p>
        </div>
      ) : profile ? (
        <div className="mb-4 border border-eg-border bg-eg-card p-3">
          {alreadyReviewed ? (
            <p className="text-xs text-eg-text-sub">{t("already_reviewed")}</p>
          ) : (
            <>
              <p className="mb-3 text-[13px] font-semibold text-eg-heading">{t("write_review")}</p>

              <div className="mb-3 flex items-center gap-0.5" role="group" aria-label="Rating from 1 to 10">
                {Array.from({ length: 10 }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRating(index + 1)}
                    aria-pressed={index < rating}
                    aria-label={`${index + 1}/10`}
                    className={
                      "transition-colors " +
                      (index < rating ? "text-eg-blue" : "text-eg-muted hover:text-eg-text-sub")
                    }
                  >
                    <Star size={16} className={index < rating ? "fill-current" : ""} aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecommended(true)}
                  aria-pressed={isRecommended}
                  className={
                    "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] transition-colors " +
                    (isRecommended
                      ? "border-eg-green/40 bg-eg-green/10 text-eg-green"
                      : "border-eg-border text-eg-muted hover:text-white")
                  }
                >
                  <ThumbsUp size={11} aria-hidden="true" />
                  {t("recommended_yes")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecommended(false)}
                  aria-pressed={!isRecommended}
                  className={
                    "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] transition-colors " +
                    (!isRecommended
                      ? "border-eg-red/40 bg-eg-red/10 text-red-300"
                      : "border-eg-border text-eg-muted hover:text-eg-heading")
                  }
                >
                  <ThumbsDown size={11} aria-hidden="true" />
                  {t("recommended_no")}
                </button>
              </div>

              <Textarea
                rows={3}
                placeholder={t("review_placeholder")}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="mb-3"
              />

              <Button size="sm" onClick={submitReview} loading={submitting}>
                {t("submit_review_action")}
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="mb-4 border border-eg-border bg-eg-card p-3">
          <p className="text-[13px] font-semibold text-eg-heading">{t("write_review")}</p>
          <p className="mt-1 text-xs text-eg-muted">{t("login_to_review")}</p>
          <Link
            href="/login"
            className="mt-3 inline-flex h-8 items-center rounded-sm bg-eg-blue px-3 text-xs font-medium text-eg-darker transition-colors hover:bg-eg-accent-hover"
          >
            {t("login_review")}
          </Link>
        </div>
      )}

      {reviewList.length === 0 ? (
        <p className="border border-eg-border bg-eg-card px-4 py-8 text-center text-xs text-eg-muted">
          {t("no_reviews")}
        </p>
      ) : (
        <ul className="divide-y divide-eg-border border-y border-eg-border">
          {reviewList.map((review) => (
            <li key={review.id} className="py-3">
              <div className="flex items-start gap-3">
                <Avatar
                  src={review.profiles?.avatar_url}
                  name={review.profiles?.display_name || review.profiles?.username}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-white">
                      {review.profiles?.display_name || review.profiles?.username}
                    </span>
                    <Badge variant={review.is_recommended ? "green" : "red"}>
                      {review.is_recommended ? (
                        <>
                          <ThumbsUp size={9} aria-hidden="true" />
                          {t("recommended_yes")}
                        </>
                      ) : (
                        <>
                          <ThumbsDown size={9} aria-hidden="true" />
                          {t("recommended_no")}
                        </>
                      )}
                    </Badge>
                    <span className="flex" aria-label={`${review.rating}/10`}>
                      {Array.from({ length: 10 }, (_, index) => (
                        <Star
                          key={index}
                          size={9}
                          aria-hidden="true"
                          className={index < review.rating ? "fill-eg-blue text-eg-blue" : "text-eg-muted/50"}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] text-eg-muted">
                      {formatDate(review.created_at)}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteReview(review.id)}
                        className="ms-auto text-[11px] text-red-300 transition-colors hover:text-red-200"
                      >
                        {t("remove")}
                      </button>
                    )}
                  </div>
                  {review.content && (
                    <p className="mt-2 text-[13px] leading-6 text-eg-text-sub">{review.content}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
