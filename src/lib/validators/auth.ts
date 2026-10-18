import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("email_invalid"),
  password: z
    .string()
    .min(8, "password_min")
    .regex(/[A-Z]/, "password_uppercase")
    .regex(/[0-9]/, "password_number"),
  username: z
    .string()
    .min(3, "username_min")
    .max(30, "username_max")
    .regex(/^[a-zA-Z0-9_-]+$/, "username_format"),
  display_name: z.string().min(1, "display_name_required").max(60, "display_name_max").optional(),
  // Stores the message key; the register form translates it.
  account_type: z.enum(["studio", "player"], { error: "account_type_required" }),
});

export const loginSchema = z.object({
  email: z.string().email("email_invalid"),
  password: z.string().min(1, "password_required"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "password_min")
      .regex(/[A-Z]/, "password_uppercase")
      .regex(/[0-9]/, "password_number"),
    confirmPassword: z.string().min(1, "password_confirm_required"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "password_mismatch",
  });

export const profileUpdateSchema = z.object({
  display_name: z.string().max(60, "display_name_max").optional(),
  bio: z.string().max(500, "bio_max").optional(),
  website: z.string().url("website_invalid").optional().or(z.literal("")),
  twitter: z.string().max(50, "twitter_max").optional(),
  github: z.string().max(50, "github_max").optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
