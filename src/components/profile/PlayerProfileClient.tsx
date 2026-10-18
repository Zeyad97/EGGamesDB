"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Calendar, Gamepad2, Heart, Rocket, Settings, Star, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { GameCard } from "@/components/games/GameCard";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSchemaMissingError } from "@/lib/account";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators/auth";
import { formatDate } from "@/lib/utils";
import type { Game, Profile } from "@/types";

export interface WishlistItem {
  added_at: string;
  game: Game;
}

export interface PlayerReview {
  id: string;
  rating: number;
  content: string | null;
  is_recommended: boolean;
  created_at: string;
  game: Pick<Game, "id" | "slug" | "title" | "title_ar">;
}

interface PlayerProfileClientProps {
  profile: Profile;
  wishlist: WishlistItem[];
  /** False until migration 009 (wishlists table) is applied. */
  wishlistAvailable: boolean;
  reviews: PlayerReview[];
  /** False until migration 009 (account_type column) is applied. */
  accountTypeAvailable: boolean;
  locale: string;
}

type TabKey = "wishlist" | "reviews" | "settings";

export function PlayerProfileClient({
  profile,
  wishlist: initialWishlist,
  wishlistAvailable,
  reviews,
  accountTypeAvailable,
  locale,
}: PlayerProfileClientProps) {
  const tp = useTranslations("profile");
  const tv = useTranslations("validation");
  const validationError = (message?: string) =>
    message && tv.has(message) ? tv(message as never) : message;
  const ta = useTranslations("account");
  const tw = useTranslations("wishlist");
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabKey>("wishlist");
  const [items, setItems] = useState<WishlistItem[]>(initialWishlist);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  const titleOf = (game: Pick<Game, "title" | "title_ar">) =>
    locale === "ar" && game.title_ar ? game.title_ar : game.title;

  const removeFromWishlist = async (gameId: string) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.game.id !== gameId));
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", profile.id)
      .eq("game_id", gameId);
    if (error) {
      setItems(previous);
      toast.error(tw("error"));
      return;
    }
    toast.success(tw("removed_toast"));
  };

  const saveProfile = async (data: ProfileUpdateInput) => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(data).eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(tp("toast_updated"));
  };

  const switchToStudio = async () => {
    setSwitching(true);
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: "studio" })
      .eq("id", profile.id);
    setSwitching(false);
    if (error) {
      toast.error(isSchemaMissingError(error) ? ta("account_type_unavailable") : ta("error"));
      return;
    }
    toast.success(ta("account_type_switch_done"));
    // The server page re-reads account_type and renders the studio profile.
    router.refresh();
  };

  const tabs: { key: TabKey; icon: typeof Heart; label: string }[] = [
    { key: "wishlist", icon: Heart, label: ta("tabs.wishlist", { count: wishlistAvailable ? items.length : 0 }) },
    { key: "reviews", icon: Star, label: ta("tabs.reviews", { count: reviews.length }) },
    { key: "settings", icon: Settings, label: ta("tabs.settings") },
  ];

  return (
    <div className="min-h-screen">
      <div className="store-container py-6 sm:py-8">
        <header className="border border-eg-border bg-eg-card p-4 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">{ta("player_eyebrow")}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-eg-heading">{profile.display_name || profile.username}</h1>
                <Badge variant="blue">{ta("badge_player")}</Badge>
              </div>
              <p className="mt-1 text-sm text-eg-text-sub">@{profile.username}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-eg-muted">
                <Calendar size={12} aria-hidden="true" />
                {tp("joined", { date: formatDate(profile.created_at, locale) })}
              </p>
              {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-eg-text-sub">{profile.bio}</p>}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 border-t border-eg-border pt-4 sm:max-w-md">
            <div>
              <p className="text-xl font-bold text-eg-heading">{wishlistAvailable ? items.length : "—"}</p>
              <p className="text-[11px] text-eg-muted">{ta("metrics.wishlist")}</p>
            </div>
            <div className="border-s border-eg-border ps-3">
              <p className="text-xl font-bold text-eg-heading">{reviews.length}</p>
              <p className="text-[11px] text-eg-muted">{ta("metrics.reviews")}</p>
            </div>
          </div>
        </header>

        <nav aria-label={ta("tabs_label")} className="mt-5 overflow-x-auto border-y border-eg-border">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-current={activeTab === tab.key ? "page" : undefined}
                onClick={() => setActiveTab(tab.key)}
                className={`flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-eg-gold ${activeTab === tab.key ? "border-eg-gold text-eg-gold" : "border-transparent text-eg-text-sub hover:text-eg-heading"}`}
              >
                <tab.icon size={15} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === "wishlist" && (
          <section className="mt-5">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{tw("section_label")}</p>
              <h2 className="mt-1 font-bold text-eg-heading">{tw("section_title")}</h2>
            </div>

            {!wishlistAvailable ? (
              <div className="flex flex-col items-center border border-eg-border px-4 py-12 text-center">
                <Heart size={32} className="mb-3 text-eg-muted" aria-hidden="true" />
                <p className="font-semibold text-eg-heading">{tw("coming_soon_title")}</p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-eg-muted">{tw("coming_soon_desc")}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center border border-eg-border px-4 py-12 text-center">
                <Heart size={32} className="mb-3 text-eg-muted" aria-hidden="true" />
                <p className="font-semibold text-eg-heading">{tw("empty_title")}</p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-eg-muted">{tw("empty_desc")}</p>
                <Link href="/store" className="mt-5">
                  <Button size="sm">{tw("browse_store")}</Button>
                </Link>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <li key={item.game.id} className="relative">
                    <GameCard game={item.game} locale={locale} />
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(item.game.id)}
                      aria-label={tw("remove_label", { title: titleOf(item.game) })}
                      className="absolute end-2 top-2 z-10 inline-flex min-h-8 items-center gap-1 border border-eg-border bg-eg-darker/90 px-2 text-[11px] text-eg-text-sub transition-colors hover:border-red-400/60 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-eg-gold"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                      {tw("remove")}
                    </button>
                    <p className="mt-1 text-[11px] text-eg-muted">
                      {tw("added_on", { date: formatDate(item.added_at, locale) })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "reviews" && (
          <section className="mt-5">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{ta("tabs.reviews", { count: reviews.length })}</p>
              <h2 className="mt-1 font-bold text-eg-heading">{ta("reviews_title")}</h2>
              <p className="mt-1 text-xs text-eg-muted">{ta("reviews_desc")}</p>
            </div>

            {reviews.length === 0 ? (
              <div className="flex flex-col items-center border border-eg-border px-4 py-12 text-center">
                <Star size={32} className="mb-3 text-eg-muted" aria-hidden="true" />
                <p className="text-sm text-eg-muted">{ta("reviews_empty")}</p>
                <Link href="/games" className="mt-5">
                  <Button size="sm" variant="secondary">{ta("reviews_empty_cta")}</Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="border border-eg-border bg-eg-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/games/${review.game.slug}`}
                        className="font-semibold text-eg-heading transition-colors hover:text-eg-gold"
                      >
                        {titleOf(review.game)}
                      </Link>
                      <Badge variant={review.is_recommended ? "green" : "red"}>
                        {review.is_recommended ? ta("recommended") : ta("not_recommended")}
                      </Badge>
                      <span className="ms-auto flex items-center gap-1 text-xs font-semibold text-eg-gold">
                        <Star size={12} aria-hidden="true" />
                        {ta("rating", { rating: review.rating })}
                      </span>
                    </div>
                    {review.content && (
                      <p className="mt-2 text-sm leading-6 text-eg-text-sub">{review.content}</p>
                    )}
                    <p className="mt-2 text-[11px] text-eg-muted">
                      {ta("reviewed_on", { date: formatDate(review.created_at, locale) })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <section className="mt-5 max-w-2xl space-y-6">
            <div className="border border-eg-border bg-eg-card p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{tp("settings_label")}</p>
              <h2 className="mt-1 font-bold text-eg-heading">{tp("settings_title")}</h2>
              <p className="mt-1 text-xs text-eg-muted">{tp("settings_desc")}</p>
              <form onSubmit={handleSubmit(saveProfile)} className="mt-5 space-y-5">
                <div className="border-b border-eg-border pb-5">
                  <p className="mb-3 text-xs font-semibold text-eg-text-sub">{tp("identity_group")}</p>
                  <div className="space-y-4">
                    <Input label={tp("display_name")} error={validationError(errors.display_name?.message)} {...register("display_name")} />
                    <Textarea label={tp("bio")} rows={3} error={validationError(errors.bio?.message)} {...register("bio")} />
                  </div>
                </div>
                <div className="border-b border-eg-border pb-5">
                  <p className="mb-3 text-xs font-semibold text-eg-text-sub">{tp("links_group")}</p>
                  <div className="space-y-4">
                    <Input label={tp("website")} type="url" placeholder="https://..." error={validationError(errors.website?.message)} {...register("website")} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label={tp("twitter")} placeholder={tp("twitter_placeholder")} error={validationError(errors.twitter?.message)} {...register("twitter")} />
                      <Input label={tp("github")} error={validationError(errors.github?.message)} {...register("github")} />
                    </div>
                  </div>
                </div>
                <Button type="submit" loading={saving}>{tp("save")}</Button>
              </form>
            </div>

            <div className="border border-eg-border bg-eg-card p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{ta("account_type_title")}</p>
              {!accountTypeAvailable ? (
                <p className="mt-2 text-sm text-eg-text-sub">{ta("account_type_unavailable")}</p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-eg-text-sub">{ta("account_type_player_current")}</p>
                  <div className="mt-4 flex flex-col gap-3 border border-eg-border bg-eg-darker p-4 sm:flex-row sm:items-start">
                    <Rocket size={22} className="mt-0.5 shrink-0 text-eg-gold" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eg-heading">{ta("account_type_switch_title")}</p>
                      <p className="mt-1 text-xs leading-5 text-eg-text-sub">{ta("account_type_switch_desc")}</p>
                    </div>
                    <Button type="button" variant="secondary" size="sm" loading={switching} onClick={switchToStudio} className="shrink-0 gap-1.5">
                      <Gamepad2 size={13} aria-hidden="true" />
                      {ta("account_type_switch_cta")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
