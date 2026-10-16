import { z } from "zod";

export const gameSubmissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  title_ar: z.string().max(200).optional(),
  short_description: z.string().min(10, "At least 10 characters").max(500),
  short_description_ar: z.string().max(500).optional(),
  long_description: z.string().min(50, "At least 50 characters"),
  long_description_ar: z.string().optional(),
  steam_app_id: z.string().regex(/^\d+$/, "Must be a valid Steam App ID").optional().or(z.literal("")),
  steam_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  tags: z.array(z.string()).max(20),
  genres: z.array(z.string()).max(10),
  release_date: z.string().optional(),
  developer_name: z.string().min(1).max(100),
  publisher: z.string().max(100).optional(),
  is_free: z.boolean(),
  price_usd: z.number().min(0).optional(),
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
