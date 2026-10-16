export type UserRole = "user" | "contributor" | "admin" | "super_admin";
export type GameStatus = "pending" | "approved" | "rejected" | "draft";
export type Locale = "en" | "ar";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  developer_status: "none" | "pending" | "approved" | "rejected";
  website: string | null;
  twitter: string | null;
  github: string | null;
  steam_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  short_description: string;
  short_description_ar: string | null;
  long_description: string;
  long_description_ar: string | null;
  steam_app_id: string | null;
  steam_url: string | null;
  header_image: string | null;
  capsule_image: string | null;
  screenshots: Screenshot[];
  videos: Video[];
  tags: string[];
  genres: string[];
  release_date: string | null;
  developer_id: string;
  developer_name: string;
  publisher: string | null;
  status: GameStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  spotlight_at: string | null;
  windows_requirements: SystemRequirements | null;
  mac_requirements: SystemRequirements | null;
  linux_requirements: SystemRequirements | null;
  is_free: boolean;
  price_usd: number | null;
  metacritic_score: number | null;
  rating_count: number;
  average_rating: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Screenshot {
  id: string;
  path_full: string;
  path_thumbnail: string;
}

export interface Video {
  id: string;
  name: string;
  youtube_id: string | null;
  vimeo_id: string | null;
  mp4_url: string | null;
  webm_url: string | null;
  thumbnail: string | null;
}

export interface SystemRequirements {
  minimum: string;
  recommended: string;
}

export interface GameReview {
  id: string;
  game_id: string;
  user_id: string;
  rating: number;
  content: string;
  is_recommended: boolean;
  helpful_count: number;
  created_at: string;
  profiles?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "game" | "review" | "user";
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  resolved_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "resolved";
  created_at: string;
}

export interface SteamGameData {
  steam_appid: number;
  name: string;
  short_description: string;
  detailed_description: string;
  header_image: string;
  capsule_image: string;
  screenshots: Array<{
    id: number;
    path_thumbnail: string;
    path_full: string;
  }>;
  movies?: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm?: { 480: string; max: string };
    mp4?: { 480: string; max: string };
  }>;
  genres: Array<{ id: string; description: string }>;
  categories: Array<{ id: number; description: string }>;
  tags?: Array<{ id: number; name: string }>;
  release_date: { coming_soon: boolean; date: string };
  developers: string[];
  publishers: string[];
  is_free: boolean;
  price_overview?: { final_formatted: string; final: number };
  pc_requirements: { minimum?: string; recommended?: string };
  mac_requirements: { minimum?: string; recommended?: string };
  linux_requirements: { minimum?: string; recommended?: string };
  metacritic?: { score: number };
  website: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GameFilters {
  search?: string;
  genre?: string;
  tag?: string;
  status?: GameStatus;
  sortBy?: "created_at" | "title" | "average_rating" | "view_count" | "release_date";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface AdminStats {
  total_games: number;
  pending_games: number;
  approved_games: number;
  total_users: number;
  total_reviews: number;
  open_reports: number;
}
