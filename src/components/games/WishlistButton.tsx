"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Check, Heart } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { isSchemaMissingError } from "@/lib/account";
import { useAuthStore } from "@/store/auth";

interface WishlistButtonProps {
  gameId: string;
}

/**
 * Steam-style wishlist toggle. Optimistic: the UI flips first and rolls back
 * with a toast if the write fails. Writes go through the browser Supabase client,
 * so RLS decides what a user may add or remove. Renders nothing until migration
 * 009 is applied (the wishlists table or wishlist_count RPC is missing).
 */
export function WishlistButton({ gameId }: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading } = useAuthStore();
  const userId = profile?.id ?? null;

  const [available, setAvailable] = useState(true);
  const [membershipReady, setMembershipReady] = useState(false);
  const [added, setAdded] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("wishlist_count", { game_id: gameId }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        if (isSchemaMissingError(error)) setAvailable(false);
        return;
      }
      setCount(typeof data === "number" ? data : 0);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, gameId]);

  useEffect(() => {
    // Logged-out visitors need no lookup; their state is derived below.
    if (loading || !userId) return;
    let cancelled = false;
    supabase
      .from("wishlists")
      .select("game_id")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          if (isSchemaMissingError(error)) setAvailable(false);
          return;
        }
        setAdded(!!data);
        setMembershipReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, gameId, userId, loading]);

  if (!available) return null;

  const isAdded = !!userId && added;
  const isReady = userId ? membershipReady : !loading;

  const bump = (delta: number) =>
    setCount((current) => (current === null ? null : Math.max(0, current + delta)));

  const toggle = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (pending || !membershipReady) return;

    const next = !added;
    setAdded(next);
    bump(next ? 1 : -1);
    setPending(true);

    const { error } = next
      ? await supabase.from("wishlists").insert({ user_id: userId, game_id: gameId })
      : await supabase.from("wishlists").delete().eq("user_id", userId).eq("game_id", gameId);

    setPending(false);

    // A duplicate insert means the row is already saved: treat it as success.
    if (error && !(next && error.code === "23505")) {
      setAdded(!next);
      bump(next ? -1 : 1);
      if (isSchemaMissingError(error)) setAvailable(false);
      toast.error(t("error"));
      return;
    }
    toast.success(next ? t("added_toast") : t("removed_toast"));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-pressed={isAdded}
        onClick={toggle}
        disabled={!isReady || pending}
        className={`gap-1.5 ${isAdded ? "border-eg-gold text-eg-gold hover:text-eg-gold" : ""}`}
      >
        {isAdded ? <Check size={13} aria-hidden="true" /> : <Heart size={13} aria-hidden="true" />}
        {isAdded ? t("added") : t("add")}
      </Button>
      {count !== null && (
        <span className="text-xs text-eg-muted">{t("count", { count })}</span>
      )}
    </div>
  );
}
