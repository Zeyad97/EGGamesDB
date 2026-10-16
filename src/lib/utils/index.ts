import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string | Date, locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatNumber(n: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(n);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function truncate(str: string, len: number): string {
  return str.length <= len ? str : str.slice(0, len).trimEnd() + "…";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function extractSteamAppId(input: string): string | null {
  // Direct number
  if (/^\d+$/.test(input.trim())) return input.trim();
  // Steam URL patterns
  const match = input.match(/store\.steampowered\.com\/app\/(\d+)/);
  return match ? match[1] : null;
}

export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/);
  return match ? match[1] : null;
}

export function ratingToColor(rating: number): string {
  if (rating >= 8) return "text-green-400";
  if (rating >= 6) return "text-yellow-400";
  if (rating >= 4) return "text-orange-400";
  return "text-red-400";
}

export function ratingLabel(rating: number): string {
  if (rating >= 9) return "Outstanding";
  if (rating >= 8) return "Great";
  if (rating >= 7) return "Good";
  if (rating >= 6) return "Decent";
  if (rating >= 5) return "Average";
  if (rating >= 4) return "Below Average";
  return "Poor";
}
