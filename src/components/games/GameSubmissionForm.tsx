"use client";
import { useState } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { extractSteamAppId } from "@/lib/utils";
import { gameSubmissionSchema, type GameSubmissionInput } from "@/lib/validators/game";
import { Sparkles, X, PlusCircle, Send, Save } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import type { Screenshot } from "@/types";

interface GameSubmissionFormProps {
  locale: string;
  initialData?: Partial<GameSubmissionInput> & { header_image?: string; capsule_image?: string; screenshots?: Screenshot[] };
  gameId?: string;
}

const GENRES = ["Action", "Adventure", "RPG", "Strategy", "Puzzle", "Horror", "Simulation", "Sports", "Indie", "Casual", "Platformer", "Racing", "Fighting", "Educational"];

export function GameSubmissionForm({ locale, initialData, gameId }: GameSubmissionFormProps) {
  const t = useTranslations("submission");
  const router = useRouter();
  const [steamInput, setSteamInput] = useState("");
  const [fetchingSteam, setFetchingSteam] = useState(false);
  const [headerImage, setHeaderImage] = useState(initialData?.header_image ?? "");
  const [capsuleImage, setCapsuleImage] = useState(initialData?.capsule_image ?? "");
  const [screenshots, setScreenshots] = useState<Screenshot[]>(initialData?.screenshots ?? []);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, setError, setFocus, watch, formState: { errors } } = useForm<GameSubmissionInput>({
    resolver: zodResolver(gameSubmissionSchema) as Resolver<GameSubmissionInput>,
    defaultValues: {
      title: initialData?.title ?? "", title_ar: initialData?.title_ar ?? "",
      short_description: initialData?.short_description ?? "", short_description_ar: initialData?.short_description_ar ?? "",
      long_description: initialData?.long_description ?? "", long_description_ar: initialData?.long_description_ar ?? "",
      steam_app_id: initialData?.steam_app_id ?? "", steam_url: initialData?.steam_url ?? "",
      tags: initialData?.tags ?? [], genres: initialData?.genres ?? [], developer_name: initialData?.developer_name ?? "",
      publisher: initialData?.publisher ?? "", release_date: initialData?.release_date ?? "",
      is_free: initialData?.is_free ?? false, price_usd: initialData?.price_usd ?? undefined,
    },
  });

  const tags = watch("tags") ?? [];
  const genres = watch("genres") ?? [];
  const isFree = watch("is_free");
  const fieldError = (name: keyof GameSubmissionInput) => errors[name]?.message as string | undefined;

  const onInvalid = (invalid: FieldErrors<GameSubmissionInput>) => {
    toast.error(t("fix_fields"));
    const first = Object.keys(invalid)[0] as keyof GameSubmissionInput | undefined;
    if (first) {
      const field = document.querySelector<HTMLElement>(`[name="${String(first)}"]`);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (field && first !== "genres" && first !== "tags") setFocus(first);
      else field?.focus();
    }
  };

  const handleSteamFetch = async () => {
    const appId = extractSteamAppId(steamInput);
    if (!appId) { toast.error(t("invalid_steam")); return; }
    setFetchingSteam(true);
    try {
      const res = await fetch(`/api/steam?id=${appId}`);
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? t("import_error")); return; }
      const d = json.data;
      setValue("title", d.title); setValue("short_description", d.short_description.replace(/<[^>]+>/g, ""));
      setValue("long_description", d.long_description); setValue("steam_app_id", d.steam_app_id); setValue("steam_url", d.steam_url);
      setValue("genres", d.genres.slice(0, 5)); setValue("tags", d.tags.slice(0, 10)); setValue("developer_name", d.developer_name);
      setValue("publisher", d.publisher ?? ""); setValue("is_free", d.is_free);
      setValue("price_usd", !d.is_free && d.price_usd != null ? d.price_usd : undefined);
      setValue("release_date", d.release_date ?? "");
      setHeaderImage(d.header_image ?? ""); setCapsuleImage(d.capsule_image ?? "");
      setScreenshots((d.screenshots ?? []).slice(0, 20));
      toast.success(t("import_success"));
    } catch { toast.error(t("import_error")); }
    finally { setFetchingSteam(false); }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) { setValue("tags", [...tags, trimmed], { shouldValidate: true }); setTagInput(""); }
  };
  const removeTag = (tag: string) => setValue("tags", tags.filter((t) => t !== tag), { shouldValidate: true });
  const toggleGenre = (g: string) => setValue("genres", genres.includes(g) ? genres.filter((x) => x !== g) : genres.length < 10 ? [...genres, g] : genres, { shouldValidate: true });

  const onSubmit = async (data: GameSubmissionInput, draft = false) => {
    setSubmitting(true);
    try {
      const res = await fetch(gameId ? `/api/games/${gameId}` : "/api/games", {
        method: gameId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, header_image: headerImage || undefined, capsule_image: capsuleImage || undefined, screenshots, draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) { toast.error(t("login_required")); router.push("/login"); return; }
        if (res.status === 403) { toast.error(t("developer_required")); return; }
        if (res.status === 429) { toast.error(t("rate_limited")); return; }
        if (res.status === 400 && json.error?.fieldErrors) {
          for (const [name, messages] of Object.entries(json.error.fieldErrors as Record<string, string[]>)) {
            if (messages?.[0]) setError(name as keyof GameSubmissionInput, { type: "server", message: messages[0] });
          }
          toast.error(t("fix_fields"));
          onInvalid(json.error.fieldErrors as FieldErrors<GameSubmissionInput>);
          return;
        }
        throw new Error(typeof json.error === "string" ? json.error : t("submit_error"));
      }
      toast.success(draft ? t("draft_saved") : t("submitted"));
      if (!draft) router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof TypeError ? t("network_error") : err instanceof Error ? err.message : t("submit_error"));
    } finally { setSubmitting(false); }
  };

  const errorsList = Object.entries(errors).filter(([key]) => key !== "root").map(([key, value]) => <li key={key}>{String(value?.message ?? "")}</li>);
  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mb-8"><h1 className="text-3xl font-black text-eg-heading mb-2">{t("title")}</h1><p className="text-eg-text-sub">{t("intro")}</p></div>
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="border border-eg-border bg-eg-card rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-eg-gold" /><h2 className="font-semibold text-eg-heading">{t("steam_import")}</h2></div>
        <div className="flex gap-2"><Input value={steamInput} onChange={(e) => setSteamInput(e.target.value)} placeholder={t("steam_id_placeholder")} className="flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void handleSteamFetch())} /><Button type="button" onClick={handleSteamFetch} loading={fetchingSteam} className="flex-shrink-0">{t("fetch_steam")}</Button></div>
        <p className="text-xs text-eg-muted mt-2">{t("steam_id_label")}</p>
      </motion.div>
      {headerImage && <div className="relative aspect-video rounded-xl overflow-hidden mb-6"><Image src={headerImage} alt={t("header_preview")} fill className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /></div>}
      {capsuleImage && <div className="relative h-28 w-48 rounded-xl overflow-hidden mb-6"><Image src={capsuleImage} alt={t("capsule_preview")} fill className="object-cover" /></div>}
      {screenshots.length > 0 && <div className="flex gap-2 overflow-x-auto pb-2 mb-6">{screenshots.map((s, i) => <div key={s.id ?? i} className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden"><Image src={s.path_thumbnail} alt={t("screenshot_preview", { index: i + 1 })} fill className="object-cover" /></div>)}</div>}
      <form onSubmit={handleSubmit((data) => onSubmit(data, false), onInvalid)} className="space-y-6">
        {errorsList.length > 0 && <div role="alert" className="border border-eg-red bg-eg-red/10 p-3 text-sm text-red-300"><ul className="list-disc ps-5">{errorsList}</ul></div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label={`${t("game_title")} (EN) *`} error={fieldError("title")} {...register("title")} /><Input label={`${t("game_title")} (AR)`} dir="rtl" error={fieldError("title_ar")} {...register("title_ar")} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Textarea label={`${t("short_desc")} (EN) *`} rows={3} error={fieldError("short_description")} {...register("short_description")} /><Textarea label={`${t("short_desc")} (AR)`} rows={3} dir="rtl" error={fieldError("short_description_ar")} {...register("short_description_ar")} /></div>
        <Textarea label={`${t("long_desc")} (EN) *`} rows={8} error={fieldError("long_description")} {...register("long_description")} /><p className="-mt-5 text-xs text-eg-muted">{t("long_desc_hint")}</p>
        <Textarea label={`${t("long_desc")} (AR)`} rows={6} dir="rtl" error={fieldError("long_description_ar")} {...register("long_description_ar")} />
        <div><label className="block text-sm font-medium text-eg-text-sub mb-2">{t("genres")}</label><div className="flex flex-wrap gap-2">{GENRES.map((g) => <button key={g} type="button" aria-pressed={genres.includes(g)} onClick={() => toggleGenre(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${genres.includes(g) ? "bg-eg-gold text-black" : "bg-eg-surface text-eg-text-sub hover:bg-black/5 dark:hover:bg-white/5"}`}>{g}</button>)}</div>{fieldError("genres") && <p className="mt-1 text-xs text-eg-red">{fieldError("genres")}</p>}</div>
        <div><label className="block text-sm font-medium text-eg-text-sub mb-2">{t("tags")}</label><div className="flex flex-wrap gap-2 mb-2">{tags.map((tag) => <button key={tag} type="button" onClick={() => removeTag(tag)}><Badge variant="gold" className="gap-1 cursor-pointer">{tag} <X size={10} /></Badge></button>)}</div><div className="flex gap-2"><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={t("tag_placeholder")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }} className="flex-1" aria-label={t("tag_placeholder")} /><Button type="button" variant="secondary" size="sm" onClick={() => addTag(tagInput)} aria-label={t("add_tag")}><PlusCircle size={14} /></Button></div>{fieldError("tags") && <p className="mt-1 text-xs text-eg-red">{fieldError("tags")}</p>}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><Input label={`${t("developer_name")} *`} error={fieldError("developer_name")} {...register("developer_name")} /><Input label={t("publisher")} error={fieldError("publisher")} {...register("publisher")} /><Input label={t("release_date")} type="date" error={fieldError("release_date")} {...register("release_date")} /></div>
        <div className="grid grid-cols-2 gap-4"><Input label={t("steam_id_label")} placeholder="1234567" error={fieldError("steam_app_id")} {...register("steam_app_id")} /><Input label={t("steam_url")} placeholder={t("steam_url_placeholder")} type="url" error={fieldError("steam_url")} {...register("steam_url")} /></div>
        <div className="flex items-center gap-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-eg-gold" {...register("is_free")} /><span className="text-sm text-eg-text-sub">{t("is_free")}</span></label>{!isFree && <Input label={`${t("price")} (USD)`} type="number" step="0.01" min="0" className="max-w-32" error={fieldError("price_usd")} {...register("price_usd", { valueAsNumber: true })} />}</div>
        <div className="flex gap-3 pt-4 border-t border-eg-border"><Button type="button" variant="secondary" loading={submitting} disabled={submitting} onClick={handleSubmit((d) => onSubmit(d, true), onInvalid)} className="gap-2"><Save size={16} /> {t("save_draft")}</Button><Button type="submit" loading={submitting} disabled={submitting} size="lg" className="flex-1 gap-2"><Send size={16} /> {gameId ? t("update") : t("submit_review")}</Button></div>
      </form>
    </div>
  );
}
