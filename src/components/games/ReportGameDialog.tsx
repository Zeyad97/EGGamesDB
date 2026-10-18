"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const REASONS = [
  ["inaccurate", "Inaccurate information"],
  ["not_egyptian", "Not an Egyptian game"],
  ["spam", "Spam or fake listing"],
  ["inappropriate", "Inappropriate content"],
  ["copyright", "Copyright or ownership claim"],
  ["other", "Other"],
] as const;

export function ReportGameDialog({ gameId, profile, isDemo }: { gameId: string; profile: Profile | null; isDemo: boolean }) {
  const t = useTranslations("reports");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("inaccurate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (isDemo || !profile) return;
    let cancelled = false;
    supabase.from("reports").select("id").eq("reporter_id", profile.id).eq("target_type", "game").eq("target_id", gameId).eq("status", "open").maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setReported(true); });
    return () => { cancelled = true; };
  }, [gameId, isDemo, profile, supabase]);

  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    const focusable = () => root?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]');
    const first = focusable()?.[0];
    first?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab") return;
      const elements = Array.from(focusable() ?? []);
      if (!elements.length) return;
      const current = document.activeElement;
      if (event.shiftKey && (current === elements[0] || !root?.contains(current))) {
        event.preventDefault(); elements.at(-1)?.focus();
      } else if (!event.shiftKey && (current === elements.at(-1) || !root?.contains(current))) {
        event.preventDefault(); elements[0]?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const submit = async () => {
    if (!profile) { router.push("/login"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      target_type: "game",
      target_id: gameId,
      reporter_id: profile.id,
      reason: t(`reason_values.${reason}`),
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error(t("duplicate"));
      else if (/rate limit/i.test(error.message)) toast.error(t("rate_limit"));
      else if (["PGRST205", "PGRST204", "42P01", "42703"].includes(error.code ?? "") || /schema cache|does not exist|could not find/i.test(error.message)) toast.error(t("migration_missing"));
      else toast.error(t("submit_error"));
      return;
    }
    setReported(true);
    setOpen(false);
    toast.success(t("success"));
  };

  if (isDemo) return null;
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-red-300" disabled={reported} onClick={() => { if (reported) return; if (!profile) { router.push("/login"); return; } setOpen(true); }}>
        <Flag size={13} aria-hidden="true" />{reported ? t("reported") : t("button")}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("title")}>
        <div ref={dialogRef} className="space-y-4">
          {!profile ? (
            <div>
              <p className="text-sm text-eg-text-sub">{t("login_required")}</p>
              <Button className="mt-4" onClick={() => router.push("/login")}>{t("login")}</Button>
            </div>
          ) : (
            <>
              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-eg-text-sub">{t("reason_label")}</legend>
                <div className="grid gap-2">
                  {REASONS.map(([key]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-eg-text-sub">
                      <input type="radio" name="report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} className="accent-eg-gold" />
                      {t(`reasons.${key}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <Textarea label={t("details_label")} rows={4} maxLength={1000} value={details} onChange={(event) => setDetails(event.target.value)} />
                <p className="mt-1 text-end text-[11px] text-eg-muted" aria-live="polite">{details.length}/1000</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button onClick={submit} loading={submitting}>{t("submit")}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
