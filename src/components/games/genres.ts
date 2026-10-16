/**
 * Genre values as stored in the `games.genres` column. Kept in one place so
 * the catalog sidebar and the storefront genre strip stay in sync.
 */
export const CATALOG_GENRES = [
  "Action",
  "Adventure",
  "RPG",
  "Strategy",
  "Puzzle",
  "Horror",
  "Simulation",
  "Sports",
  "Indie",
  "Casual",
] as const;

export type CatalogGenre = (typeof CATALOG_GENRES)[number];
