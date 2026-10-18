import { z } from "zod";

const optionalText = z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().optional());
const steamImageUrl = z.string().url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["cdn.akamai.steamstatic.com", "shared.akamai.steamstatic.com", "steamcdn-a.akamaihd.net", "store.steampowered.com"].includes(url.hostname);
  } catch {
    return false;
  }
}, "Must be a secure Steam image URL");

export const gameSubmissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  title_ar: z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().max(200).optional()),
  short_description: z.string().min(10, "At least 10 characters").max(500),
  short_description_ar: z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().max(500).optional()),
  long_description: z.string().min(50, "At least 50 characters").max(100_000),
  long_description_ar: z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().max(100_000).optional()),
  steam_app_id: z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().regex(/^\d+$/, "Must be a valid Steam App ID").optional()),
  steam_url: z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().url("Invalid URL").optional()),
  tags: z.array(z.string()).max(20),
  genres: z.array(z.string()).max(10),
  release_date: optionalText,
  developer_name: z.string().min(1).max(100),
  publisher: z.preprocess((value) => value == null || value === "" ? undefined : value, z.string().max(100).optional()),
  is_free: z.boolean(),
  price_usd: z.preprocess((value) => (typeof value === "number" && Number.isNaN(value)) || value === "" || value == null ? undefined : value, z.number().min(0).optional()),
  header_image: z.preprocess((value) => value == null || value === "" ? undefined : value, steamImageUrl.optional()),
  capsule_image: z.preprocess((value) => value == null || value === "" ? undefined : value, steamImageUrl.optional()),
  screenshots: z.array(z.object({ id: z.string().optional(), path_thumbnail: steamImageUrl, path_full: steamImageUrl })).max(20).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(10),
  content: z.string().max(2000).optional(),
  is_recommended: z.boolean(),
});

export const reportSchema = z.object({
  target_type: z.enum(["game", "review", "user"]),
  target_id: z.string().uuid(),
  reason: z.string().min(5).max(200),
  details: z.string().max(1000).optional(),
});

export type GameSubmissionInput = z.infer<typeof gameSubmissionSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
