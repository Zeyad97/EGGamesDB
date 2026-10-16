import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AtSign, Code2, Globe } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { GameCard } from "@/components/games/GameCard";
import { EgyptFlag } from "@/components/layout/Brand";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Game, Profile } from "@/types";

export const dynamic = "force-dynamic";

interface DeveloperPageProps {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: DeveloperPageProps) {
  const { username } = await params;
  return { title: `${username} — EGGameDB Developer` };
}

export default async function DeveloperPage({ params }: DeveloperPageProps) {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "developers" });
  const tc = await getTranslations({ locale, namespace: "common" });

  let profile: Profile | null = null;
  let gameList: Game[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    profile = data;

    if (profile) {
      try {
        const { data: games } = await supabase
          .from("games")
          .select("*")
          .eq("developer_id", profile.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        gameList = (games ?? []) as Game[];
      } catch {
        // Games list is non-critical: render the profile without it.
      }
    }
  } catch {
    profile = null;
  }

  if (!profile) notFound();
  const totalViews = gameList.reduce((sum, game) => sum + (game.view_count || 0), 0);
  const totalRatings = gameList.reduce((sum, game) => sum + (game.rating_count || 0), 0);
  const name = profile.display_name || profile.username;

  const links = [
    profile.website && { href: profile.website, label: t("website"), Icon: Globe },
    profile.twitter && {
      href: `https://twitter.com/${profile.twitter}`,
      label: `@${profile.twitter}`,
      Icon: AtSign,
    },
    profile.github && {
      href: `https://github.com/${profile.github}`,
      label: profile.github,
      Icon: Code2,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; Icon: typeof Globe }>;

  return (
    <div className="pb-4">
      <div className="store-container pt-5">
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-eg-muted">
          <Link href="/" className="transition-colors hover:text-eg-blue">
            EGGameDB
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/developers" className="transition-colors hover:text-eg-blue">
            {t("all_developers")}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-eg-text-sub">{name}</span>
        </nav>

        <div className="flex flex-col gap-4 border border-eg-border bg-eg-card p-4 sm:flex-row sm:items-start">
          <Avatar src={profile.avatar_url} name={name} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-eg-heading">{name}</h1>
              <Badge variant={profile.role.includes("admin") ? "green" : "outline"}>
                {profile.role.replace("_", " ")}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-eg-gold">
                <EgyptFlag />
                {tc("made_in_egypt")}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-eg-muted">
              @{profile.username} · {t("member_since", { date: formatDate(profile.created_at, locale) })}
            </p>

            {profile.bio && (
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-eg-text-sub">{profile.bio}</p>
            )}

            <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-eg-muted">
              <span className="text-eg-text-sub">{t("games_count", { count: gameList.length })}</span>
              <span>
                <span className="text-eg-text-sub">{formatNumber(totalViews, locale)}</span> {t("views")}
              </span>
              <span>
                <span className="text-eg-text-sub">{formatNumber(totalRatings, locale)}</span> {t("ratings")}
              </span>
            </p>

            {links.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {links.map(({ href, label, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-eg-text-sub transition-colors hover:text-eg-blue"
                  >
                    <Icon size={12} aria-hidden="true" />
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="store-title mt-6 mb-3">{t("games_count", { count: gameList.length })}</h2>

        {gameList.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gameList.map((game) => (
              <li key={game.id}>
                <GameCard game={game} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-eg-border bg-eg-card px-4 py-8 text-center text-xs text-eg-muted">
            {t("no_games")}
          </p>
        )}
      </div>
    </div>
  );
}
