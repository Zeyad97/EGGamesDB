import { z } from "zod";

// Shared by the server data layer and the admin client form.

export const STUDIO_LINK_KEYS = [
  "website_url",
  "steam_url",
  "x_url",
  "instagram_url",
  "facebook_url",
  "youtube_url",
  "discord_url",
  "linkedin_url",
] as const;

export type StudioLinkKey = (typeof STUDIO_LINK_KEYS)[number];
export type StudioLinks = Record<StudioLinkKey, string | null>;

export interface StudioRow extends StudioLinks {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  about: string | null;
  about_ar: string | null;
  founded_year: number | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export const STUDIO_SLUG_PATTERN = /^[a-z0-9-]+$/;
export const STUDIO_LOCAL_LOGO_PATTERN = /^\/studios\/[a-z0-9-]+\.(png|jpg|webp)$/;
export const STUDIO_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const STUDIO_LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Case-insensitive key used to match a studio name with games.developer_name. */
export function studioKey(name: string): string {
  return name.trim().toLocaleLowerCase();
}

/** True when PostgREST reports that the studios table (migration 008) is not there yet. */
export function isMissingStudiosTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (["42P01", "PGRST205", "PGRST200"].includes(error.code ?? "")) return true;
  return /studios/i.test(error.message ?? "") && /does not exist|could not find|schema cache/i.test(error.message ?? "");
}

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || (/^https:\/\/\S+$/.test(value) && URL.canParse(value)), "invalid_url");

export const studioFormSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(STUDIO_SLUG_PATTERN, "invalid_slug"),
  name: z.string().trim().min(1).max(120),
  name_ar: z.string().trim().max(120),
  logo_url: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) => value === "" || (/^https:\/\/\S+$/.test(value) && URL.canParse(value)) || STUDIO_LOCAL_LOGO_PATTERN.test(value),
      "invalid_logo"
    ),
  about: z.string().trim().max(3000),
  about_ar: z.string().trim().max(3000),
  founded_year: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1970 && Number(value) <= 2100), "invalid_year"),
  city: z.string().trim().max(80),
  website_url: httpsUrl,
  steam_url: httpsUrl,
  x_url: httpsUrl,
  instagram_url: httpsUrl,
  facebook_url: httpsUrl,
  youtube_url: httpsUrl,
  discord_url: httpsUrl,
  linkedin_url: httpsUrl,
});

export type StudioFormValues = z.input<typeof studioFormSchema>;

export const EMPTY_STUDIO_FORM: StudioFormValues = {
  slug: "",
  name: "",
  name_ar: "",
  logo_url: "",
  about: "",
  about_ar: "",
  founded_year: "",
  city: "",
  website_url: "",
  steam_url: "",
  x_url: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  discord_url: "",
  linkedin_url: "",
};

/** Converts validated form values into the row shape stored in public.studios. */
export function toStudioPayload(values: z.output<typeof studioFormSchema>) {
  const orNull = (value: string) => (value === "" ? null : value);
  const links = Object.fromEntries(STUDIO_LINK_KEYS.map((key) => [key, orNull(values[key])])) as StudioLinks;
  return {
    slug: values.slug,
    name: values.name,
    name_ar: orNull(values.name_ar),
    logo_url: orNull(values.logo_url),
    about: orNull(values.about),
    about_ar: orNull(values.about_ar),
    founded_year: values.founded_year === "" ? null : Number(values.founded_year),
    city: orNull(values.city),
    ...links,
  };
}

/** Maps a stored row back to form strings for editing. */
export function studioToForm(row: StudioRow): StudioFormValues {
  const str = (value: string | null | undefined) => value ?? "";
  return {
    slug: row.slug,
    name: row.name,
    name_ar: str(row.name_ar),
    logo_url: str(row.logo_url),
    about: str(row.about),
    about_ar: str(row.about_ar),
    founded_year: row.founded_year ? String(row.founded_year) : "",
    city: str(row.city),
    website_url: str(row.website_url),
    steam_url: str(row.steam_url),
    x_url: str(row.x_url),
    instagram_url: str(row.instagram_url),
    facebook_url: str(row.facebook_url),
    youtube_url: str(row.youtube_url),
    discord_url: str(row.discord_url),
    linkedin_url: str(row.linkedin_url),
  };
}
