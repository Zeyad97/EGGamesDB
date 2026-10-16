import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

interface DevelopersPageProps {
  params: Promise<{ locale: string }>;
}

type DeveloperRow = Profile & { games?: Array<{ count: number }> };

export async function generateMetadata({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("developers") };
}

export default async function DevelopersPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "developers" });

  // Unavailable backend retains the empty state instead of crashing.
  let developers: DeveloperRow[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("profiles")
      .select("*, games!games_developer_id_fkey(count)")
      .in("role", ["contributor", "admin", "super_admin"])
      .order("created_at", { ascending: false });

    developers = (data ?? []) as DeveloperRow[];
  } catch {}

  return (
    <div className="pb-4">
      <div className="store-container pt-5">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[11px] text-eg-muted">
          <Link href="/" className="transition-colors hover:text-eg-blue">
            EGGameDB
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-eg-text-sub">{t("title")}</span>
        </nav>

        <div className="mb-5 border-b border-eg-border pb-3">
          <h1 className="text-xl font-semibold text-eg-heading">{t("title")}</h1>
          <p className="mt-1 text-xs text-eg-muted">{t("subtitle")}</p>
        </div>

        {developers.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {developers.map((developer) => (
              <li key={developer.id}>
                <Link
                  href={`/developers/${developer.username}`}
                  className="flex h-full items-start gap-3 border border-eg-border bg-eg-card p-3 transition-colors hover:border-eg-border-strong"
                >
                  <Avatar
                    src={developer.avatar_url}
                    name={developer.display_name || developer.username}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-eg-heading">
                      {developer.display_name || developer.username}
                    </p>
                    <p className="truncate text-[11px] text-eg-muted">@{developer.username}</p>
                    {developer.bio && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-eg-text-sub">
                        {developer.bio}
                      </p>
                    )}
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-eg-muted">
                      <Badge variant={developer.role.includes("admin") ? "green" : "outline"}>
                        {developer.role.replace("_", " ")}
                      </Badge>
                      {t("games_count", { count: developer.games?.[0]?.count ?? 0 })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-eg-border bg-eg-card px-4 py-8 text-center text-xs text-eg-muted">
            {t("empty")}
          </p>
        )}
      </div>
    </div>
  );
}
