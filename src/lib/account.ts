import type { AccountType, Profile, UserRole } from "@/types";

const STUDIO_ROLES: readonly UserRole[] = ["contributor", "admin", "super_admin"];

/**
 * An explicit account_type always wins. Before migration 009 is applied the
 * column is missing, so the account type falls back to the role: contributor,
 * admin and super_admin are studios, everyone else is a player.
 */
export function resolveAccountType(
  profile: { role: UserRole; account_type?: AccountType | null }
): AccountType {
  if (profile.account_type === "studio" || profile.account_type === "player") {
    return profile.account_type;
  }
  return STUDIO_ROLES.includes(profile.role) ? "studio" : "player";
}

/** True when the profile row carries account_type, i.e. migration 009 is applied. */
export function hasAccountTypeColumn(profile: Pick<Profile, "account_type">): boolean {
  return profile.account_type === "studio" || profile.account_type === "player";
}

// Postgres / PostgREST codes meaning a column, table, function or schema cache entry is missing.
const SCHEMA_MISSING_CODES = ["42703", "42P01", "42883", "PGRST202", "PGRST204", "PGRST205"];

/** True when an error means a migration has not been applied yet (feature should degrade quietly). */
export function isSchemaMissingError(error: { code?: string } | null | undefined): boolean {
  return !!error?.code && SCHEMA_MISSING_CODES.includes(error.code);
}
