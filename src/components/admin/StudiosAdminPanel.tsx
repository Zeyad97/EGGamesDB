"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { StudioLogo } from "@/components/studios/StudioLogo";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import {
  EMPTY_STUDIO_FORM,
  STUDIO_LINK_KEYS,
  STUDIO_LOGO_MAX_BYTES,
  STUDIO_LOGO_MIME_TYPES,
  studioFormSchema,
  studioKey,
  studioToForm,
  toStudioPayload,
  type StudioFormValues,
  type StudioRow,
} from "@/lib/validators/studio";

const LOGO_BUCKET = "studio-logos";
const LOGO_EXTENSIONS: Record<(typeof STUDIO_LOGO_MIME_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const STORAGE_MARKER = `/storage/v1/object/public/${LOGO_BUCKET}/`;

type FormErrors = Partial<Record<keyof StudioFormValues, string>>;
type EditState = { mode: "new" } | { mode: "edit"; row: StudioRow } | null;

interface StudiosAdminPanelProps {
  initialStudios: StudioRow[];
  tableMissing: boolean;
  initialGameCounts: Record<string, number>;
  initialSuggestions: string[];
  locale: string;
}

export function StudiosAdminPanel({ initialStudios, tableMissing, initialGameCounts, initialSuggestions, locale }: StudiosAdminPanelProps) {
  const t = useTranslations("admin");
  const supabase = createClient();
  const [studios, setStudios] = useState<StudioRow[]>(initialStudios);
  const [gameCounts] = useState<Record<string, number>>(initialGameCounts);
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
  const [editing, setEditing] = useState<EditState>(null);
  const [form, setForm] = useState<StudioFormValues>(EMPTY_STUDIO_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (tableMissing) {
    return (
      <section className="border border-eg-gold/40 bg-eg-card p-4 sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-eg-gold">{t("studios.title")}</p>
        <h2 className="mt-1 font-bold text-eg-heading">{t("studios.table_missing_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-eg-text-sub">{t("studios.table_missing_desc")}</p>
      </section>
    );
  }

  const openNew = (prefill = "") => {
    setEditing({ mode: "new" });
    setForm({ ...EMPTY_STUDIO_FORM, name: prefill, slug: prefill ? slugify(prefill) : "" });
    setSlugTouched(false);
    setErrors({});
  };

  const openEdit = (row: StudioRow) => {
    setEditing({ mode: "edit", row });
    setForm(studioToForm(row));
    setSlugTouched(true);
    setErrors({});
  };

  const closeForm = () => {
    setEditing(null);
    setErrors({});
  };

  const setField = (key: keyof StudioFormValues, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched && editing?.mode === "new") next.slug = slugify(value);
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(STUDIO_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) { toast.error(t("studios.logo_type_error")); return; }
    if (file.size > STUDIO_LOGO_MAX_BYTES) { toast.error(t("studios.logo_size_error")); return; }
    const slugCheck = studioFormSchema.shape.slug.safeParse(form.slug);
    if (!slugCheck.success) { toast.error(t("studios.logo_slug_error")); return; }

    const extension = LOGO_EXTENSIONS[file.type as keyof typeof LOGO_EXTENSIONS];
    const path = `${slugCheck.data}/${Date.now()}.${extension}`;
    setUploading(true);
    const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (error) {
      setUploading(false);
      toast.error(t("studios.logo_upload_failed", { message: error.message }));
      return;
    }
    const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
    setForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
    setErrors((prev) => ({ ...prev, logo_url: undefined }));
    setUploading(false);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const parsed = studioFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key as keyof StudioFormValues]) next[key as keyof StudioFormValues] = t("studios.field_invalid");
      }
      setErrors(next);
      toast.error(t("studios.form_invalid"));
      return;
    }

    const payload = toStudioPayload(parsed.data);
    setSaving(true);
    const query = editing.mode === "new"
      ? supabase.from("studios").insert(payload).select("*").single()
      : supabase.from("studios").update(payload).eq("id", editing.row.id).select("*").single();
    const { data, error } = await query;
    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        setErrors((prev) => ({ ...prev, slug: t("studios.duplicate_slug") }));
        toast.error(t("studios.duplicate_slug"));
      } else {
        toast.error(error.message);
      }
      return;
    }

    const saved = data as StudioRow;
    if (editing.mode === "edit") {
      const previous = editing.row.logo_url;
      if (previous && previous !== saved.logo_url && previous.includes(STORAGE_MARKER)) {
        // Best effort: remove the replaced upload from the bucket.
        const oldPath = decodeURIComponent(previous.split(STORAGE_MARKER)[1] ?? "");
        if (oldPath) void supabase.storage.from(LOGO_BUCKET).remove([oldPath]);
      }
      setStudios((prev) => prev.map((row) => (row.id === saved.id ? saved : row)).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setStudios((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSuggestions((prev) => prev.filter((name) => studioKey(name) !== studioKey(saved.name)));
    }
    toast.success(t("studios.saved"));
    closeForm();
  };

  const handleDelete = async (row: StudioRow) => {
    if (!confirm(t("studios.confirm_delete"))) return;
    setDeletingId(row.id);
    const { error } = await supabase.from("studios").delete().eq("id", row.id);
    setDeletingId(null);
    if (error) { toast.error(error.message); return; }
    setStudios((prev) => prev.filter((item) => item.id !== row.id));
    if (editing?.mode === "edit" && editing.row.id === row.id) closeForm();
    toast.success(t("studios.deleted"));
  };

  const fieldProps = (key: keyof StudioFormValues) => ({
    id: `studio-${key}`,
    value: form[key],
    error: errors[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(key, event.target.value),
  });

  const sectionClass = "border border-eg-border bg-eg-card p-4 sm:p-5";
  const sectionTitleClass = "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-eg-muted";

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-eg-border pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("studios.title")}</p>
            <h2 className="mt-1 font-bold text-eg-heading">{t("studios.title")}</h2>
            <p className="mt-1 text-xs text-eg-muted">{t("studios.desc")}</p>
          </div>
          {!editing && <Button size="sm" variant="secondary" className="gap-1" onClick={() => openNew()}><Plus size={14} aria-hidden="true" />{t("studios.add")}</Button>}
        </div>

        {editing && (
          <form onSubmit={handleSave} noValidate className="mt-4 space-y-5 border border-eg-gold/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-eg-heading">{editing.mode === "new" ? t("studios.creating") : t("studios.editing", { name: editing.row.name })}</h3>
              <button type="button" onClick={closeForm} className="text-eg-muted hover:text-eg-heading" aria-label={t("studios.cancel")}><X size={16} aria-hidden="true" /></button>
            </div>

            <div>
              <p className={sectionTitleClass}>{t("studios.section_identity")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={t("studios.fields.name")} maxLength={120} {...fieldProps("name")} />
                <Input label={t("studios.fields.name_ar")} maxLength={120} dir="rtl" {...fieldProps("name_ar")} />
                <div>
                  <Input label={t("studios.fields.slug")} maxLength={80} dir="ltr" {...fieldProps("slug")} onChange={(event) => { setSlugTouched(true); setField("slug", event.target.value); }} />
                  {!errors.slug && <p className="mt-1 text-[11px] text-eg-muted">{t("studios.slug_hint")}</p>}
                </div>
                <Input label={t("studios.fields.city")} maxLength={80} {...fieldProps("city")} />
                <Input label={t("studios.fields.founded_year")} inputMode="numeric" maxLength={4} placeholder="2018" dir="ltr" {...fieldProps("founded_year")} />
              </div>
            </div>

            <div>
              <p className={sectionTitleClass}>{t("studios.section_logo")}</p>
              <div className="flex flex-wrap items-start gap-4">
                <StudioLogo name={form.name || form.slug || "?"} logoUrl={form.logo_url || null} className="h-24 w-24 shrink-0" sizes="96px" />
                <div className="min-w-0 flex-1 space-y-2">
                  <label className={`inline-flex h-9 cursor-pointer items-center gap-2 border border-eg-border bg-eg-surface px-3 text-[13px] text-eg-text transition-colors hover:border-eg-border-strong ${uploading ? "opacity-60" : ""}`}>
                    <Upload size={14} aria-hidden="true" />
                    {uploading ? t("studios.uploading") : t("studios.upload_logo")}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={handleLogoFile} />
                  </label>
                  <p className="text-[11px] text-eg-muted">{t("studios.logo_hint")}</p>
                  <Input label={t("studios.fields.logo_url")} dir="ltr" placeholder="https://… or /studios/slug.png" {...fieldProps("logo_url")} />
                  {form.logo_url && <button type="button" onClick={() => setField("logo_url", "")} className="text-xs text-red-400 hover:text-red-300">{t("studios.remove_logo")}</button>}
                </div>
              </div>
            </div>

            <div>
              <p className={sectionTitleClass}>{t("studios.section_about")}</p>
              <div className="grid gap-3 lg:grid-cols-2">
                <Textarea label={t("studios.fields.about")} rows={5} maxLength={3000} {...fieldProps("about")} />
                <Textarea label={t("studios.fields.about_ar")} rows={5} maxLength={3000} dir="rtl" {...fieldProps("about_ar")} />
              </div>
            </div>

            <div>
              <p className={sectionTitleClass}>{t("studios.section_links")}</p>
              <p className="mb-3 text-[11px] text-eg-muted">{t("studios.https_hint")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {STUDIO_LINK_KEYS.map((key) => (
                  <Input key={key} label={t(`studios.fields.${key}`)} type="url" inputMode="url" dir="ltr" placeholder="https://" {...fieldProps(key)} />
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={closeForm}>{t("studios.cancel")}</Button>
              <Button type="submit" loading={saving} disabled={uploading}>{t("studios.save")}</Button>
            </div>
          </form>
        )}

        <div className="mt-4 divide-y divide-eg-border">
          {studios.length === 0 && <p className="py-8 text-center text-sm text-eg-muted">{t("studios.empty")}</p>}
          {studios.map((row) => {
            const count = gameCounts[studioKey(row.name)] ?? 0;
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                <StudioLogo name={row.name} logoUrl={row.logo_url} className="h-12 w-12 shrink-0" sizes="48px" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-eg-heading">{locale === "ar" && row.name_ar ? row.name_ar : row.name}</p>
                  <p className="truncate text-xs text-eg-muted" dir="ltr">/{row.slug} · {t("studios.games_count", { count })}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/developers/studio/${row.slug}`}><Button variant="ghost" size="sm" className="gap-1"><Eye size={13} aria-hidden="true" />{t("studios.view")}</Button></Link>
                  <Button variant="secondary" size="sm" className="gap-1" onClick={() => openEdit(row)}><Pencil size={13} aria-hidden="true" />{t("studios.edit")}</Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-red-400 hover:text-red-300" loading={deletingId === row.id} onClick={() => handleDelete(row)}><Trash2 size={13} aria-hidden="true" />{t("studios.delete")}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={sectionClass}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("studios.suggestions_title")}</p>
        <p className="mt-1 text-xs text-eg-muted">{t("studios.suggestions_desc")}</p>
        {suggestions.length === 0 ? <p className="py-5 text-sm text-eg-muted">{t("studios.no_suggestions")}</p> : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <li key={name}>
                <button type="button" onClick={() => openNew(name)} className="inline-flex h-8 items-center gap-1.5 border border-eg-border bg-eg-surface px-2.5 text-xs text-eg-text transition-colors hover:border-eg-gold/50 hover:text-eg-heading">
                  <Plus size={12} aria-hidden="true" />
                  <span>{name}</span>
                  <span className="text-eg-gold">{t("studios.suggestion_add")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
