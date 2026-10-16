"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

interface GameSubmissionFormProps {
  locale: string;
  initialData?: Partial<GameSubmissionInput> & { header_image?: string };
  gameId?: string;
}

const GENRES = ["Action", "Adventure", "RPG", "Strategy", "Puzzle", "Horror", "Simulation", "Sports", "Indie", "Casual", "Platformer", "Racing", "Fighting", "Educational"];

export function GameSubmissionForm({ locale, initialData, gameId }: GameSubmissionFormProps) {
  const t = useTranslations("submission");
  const router = useRouter();
  const [steamInput, setSteamInput] = useState("");
  const [fetchingSteam, setFetchingSteam] = useState(false);
  const [headerImage, setHeaderImage] = useState(initialData?.header_image ?? "");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GameSubmissionInput>({
    resolver: zodResolver(gameSubmissionSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      short_description: initialData?.short_description ?? "",
      long_description: initialData?.long_description ?? "",
      tags: initialData?.tags ?? [],
      genres: initialData?.genres ?? [],
      developer_name: initialData?.developer_name ?? "",
      is_free: initialData?.is_free ?? false,
    },
  });

  const tags = watch("tags") ?? [];
  const genres = watch("genres") ?? [];
  const isFree = watch("is_free");

  const handleSteamFetch = async () => {
    const appId = extractSteamAppId(steamInput);
    if (!appId) { toast.error("Enter a valid Steam App ID or URL"); return; }
    setFetchingSteam(true);
    try {
      const res = await fetch(`/api/steam?id=${appId}`);
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Steam fetch failed"); return; }
      const d = json.data;
      setValue("title", d.title);
      setValue("short_description", d.short_description.replace(/<[^>]+>/g, ""));
      setValue("long_description", d.long_description);
      setValue("steam_app_id", d.steam_app_id);
      setValue("steam_url", d.steam_url);
      setValue("genres", d.genres.slice(0, 5));
      setValue("tags", d.tags.slice(0, 10));
      setValue("developer_name", d.developer_name);
      setValue("publisher", d.publisher ?? "");
      setValue("is_free", d.is_free);
      if (!d.is_free && d.price_usd) setValue("price_usd", d.price_usd);
      setValue("release_date", d.release_date ?? "");
      if (d.header_image) setHeaderImage(d.header_image);
      if (d.screenshots) setScreenshots(d.screenshots.slice(0, 6).map((s: { path_thumbnail: string }) => s.path_thumbnail));
      toast.success(t("import_success"));
    } catch {
      toast.error(t("import_error"));
    } finally {
      setFetchingSteam(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      setValue("tags", [...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setValue("tags", tags.filter((t) => t !== tag));
  const toggleGenre = (g: string) => {
    if (genres.includes(g)) setValue("genres", genres.filter((x) => x !== g));
    else if (genres.length < 5) setValue("genres", [...genres, g]);
  };

  const onSubmit = async (data: GameSubmissionInput, draft = false) => {
    setSubmitting(true);
    try {
      const res = await fetch(gameId ? `/api/games/${gameId}` : "/api/games", {
        method: gameId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      toast.success(draft ? t("draft_saved") : t("submitted"));
      if (!draft) router.push(`/games/${json.game.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-eg-heading mb-2">{t("title")}</h1>
        <p className="text-eg-text-sub">Fill in the details about your game or import from Steam.</p>
      </div>

      {/* Steam Import */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-eg-border bg-eg-card rounded-2xl p-5 mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-eg-gold" />
          <h2 className="font-semibold text-eg-heading">{t("steam_import")}</h2>
        </div>
        <div className="flex gap-2">
          <Input
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
            placeholder={t("steam_id_placeholder")}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSteamFetch()}
          />
          <Button onClick={handleSteamFetch} loading={fetchingSteam} className="flex-shrink-0">
            {t("fetch_steam")}
          </Button>
        </div>
        <p className="text-xs text-eg-muted mt-2">{t("steam_id_label")}</p>
      </motion.div>

      {/* Preview */}
      {headerImage && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
          <Image src={headerImage} alt="Header" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      {screenshots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {screenshots.map((s, i) => (
            <div key={i} className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image src={s} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => onSubmit(data as unknown as GameSubmissionInput, false))}
        className="space-y-6"
      >
        {/* Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t("game_title")} (EN) *`}
            error={errors.title?.message}
            {...register("title")}
          />
          <Input
            label={`${t("game_title")} (AR)`}
            dir="rtl"
            {...register("title_ar")}
          />
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label={`${t("short_desc")} (EN) *`}
            rows={3}
            error={errors.short_description?.message}
            {...register("short_description")}
          />
          <Textarea
            label={`${t("short_desc")} (AR)`}
            rows={3}
            dir="rtl"
            {...register("short_description_ar")}
          />
        </div>

        <Textarea
          label={`${t("long_desc")} (EN) *`}
          rows={8}
          error={errors.long_description?.message}
          {...register("long_description")}
        />

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium text-eg-text-sub mb-2">{t("genres")}</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  genres.includes(g) ? "bg-eg-gold text-black" : "bg-eg-surface text-eg-text-sub hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-eg-text-sub mb-2">{t("tags")}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <button key={tag} type="button" onClick={() => removeTag(tag)}>
                <Badge variant="gold" className="gap-1 cursor-pointer">
                  {tag} <X size={10} />
                </Badge>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
              className="flex-1"
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => addTag(tagInput)}>
              <PlusCircle size={14} />
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input label={t("developer_name") + " *"} error={errors.developer_name?.message} {...register("developer_name")} />
          <Input label={t("publisher")} {...register("publisher")} />
          <Input label={t("release_date")} type="date" {...register("release_date")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label={t("steam_id_label")} placeholder="1234567" {...register("steam_app_id")} />
          <Input label="Steam URL" placeholder="https://store.steampowered.com/app/..." type="url" {...register("steam_url")} />
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-eg-gold" {...register("is_free")} />
            <span className="text-sm text-eg-text-sub">{t("is_free")}</span>
          </label>
          {!isFree && (
            <Input label={t("price") + " (USD)"} type="number" step="0.01" min="0" className="max-w-32" {...register("price_usd", { valueAsNumber: true })} />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-eg-border">
          <Button
            type="button"
            variant="secondary"
            loading={submitting}
            onClick={handleSubmit((d) => onSubmit(d as GameSubmissionInput, true))}
            className="gap-2"
          >
            <Save size={16} /> {t("save_draft")}
          </Button>
          <Button type="submit" loading={submitting} size="lg" className="flex-1 gap-2">
            <Send size={16} /> {gameId ? t("update") : t("submit_review")}
          </Button>
        </div>
      </form>
    </div>
  );
}
