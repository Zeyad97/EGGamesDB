import type { Metadata } from "next";
import { buildAlternates } from "@/lib/site";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: "User";
}

const REPOSITORY_URL = "https://github.com/Zeyad97/EGGamesDB";
const CONTRIBUTORS_URL = "https://api.github.com/repos/Zeyad97/EGGamesDB/contributors?per_page=100";
const valueKeys = ["gaming_first", "egyptian_pride", "quality", "open_source", "community", "free_forever"] as const;
const stack = ["Next.js 16", "TypeScript", "TailwindCSS", "Framer Motion", "Supabase", "PostgreSQL"];

const founderFallback: Contributor = {
  login: "Zeyad97",
  id: 143192185,
  avatar_url: "https://avatars.githubusercontent.com/u/143192185?v=4",
  html_url: "https://github.com/Zeyad97",
  contributions: 1,
  type: "User",
};

function isContributor(value: unknown): value is Contributor {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Contributor>;
  if (typeof item.login !== "string" || !item.login.trim()) return false;
  if (typeof item.id !== "number" || !Number.isInteger(item.id)) return false;
  if (item.type !== "User" || typeof item.contributions !== "number" || item.contributions < 0) return false;

  try {
    const profileUrl = new URL(item.html_url || "");
    const avatarUrl = new URL(item.avatar_url || "");
    return profileUrl.protocol === "https:" && profileUrl.hostname === "github.com" && avatarUrl.protocol === "https:" && avatarUrl.hostname === "avatars.githubusercontent.com";
  } catch {
    return false;
  }
}

async function getContributors(): Promise<Contributor[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const response = await fetch(CONTRIBUTORS_URL, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 43200 },
      signal: controller.signal,
    });
    if (!response.ok) return [founderFallback];
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return [founderFallback];
    const contributors = payload.filter(isContributor);
    return contributors.length > 0 ? contributors : [founderFallback];
  } catch {
    return [founderFallback];
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("about_title"), description: t("about_description"), alternates: buildAlternates(locale, "/about") };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const contributors = await getContributors();

  return (
    <div className="pb-6">
      <div className="store-container pt-6 sm:pt-8">
        <header className="border-b border-eg-border pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">EGGameDB · {t("creator_title")}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-eg-heading sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-eg-text-sub">{t("intro")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="border-b border-eg-border py-6 lg:border-e lg:border-b-0 lg:pe-8">
            <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">01</p>
            <h2 className="mt-2 text-lg font-bold text-eg-heading">{t("mission_title")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-eg-text-sub">{t("mission_body")}</p>
          </section>
          <section className="py-6 lg:ps-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-eg-muted">{t("stack_title")}</p>
            <p className="mt-3 text-sm leading-7 text-eg-text-sub">{stack.join(" · ")}</p>
            <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-10 items-center border border-eg-gold px-4 text-sm font-semibold text-eg-gold transition-colors hover:bg-eg-gold hover:text-eg-darker focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-gold">{t("contribute")}</a>
          </section>
        </div>

        <section className="border-t border-eg-border pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">{t("hall_eyebrow")}</p><h2 className="mt-1 text-2xl font-black text-eg-heading">{t("hall_title")}</h2></div>
            <p className="max-w-md text-xs leading-5 text-eg-muted">{t("hall_body")}</p>
          </div>
          <div className="mt-5 divide-y divide-eg-border border-y border-eg-border">
            {contributors.map((contributor, index) => (
              <a key={`${contributor.id}-${contributor.login}`} href={contributor.html_url} target="_blank" rel="noopener noreferrer" aria-label={t("github_profile", { login: contributor.login })} className="group flex min-h-[76px] items-center gap-3 px-1 py-3 transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-eg-gold sm:gap-4 sm:px-3">
                <span className="w-6 text-center font-mono text-xs text-eg-muted">{String(index + 1).padStart(2, "0")}</span>
                <Image src={contributor.avatar_url} alt="" width={48} height={48} className="h-12 w-12 rounded-sm border border-eg-border object-cover" />
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="truncate font-semibold text-eg-heading group-hover:text-eg-gold">{contributor.login}</span>{contributor.login === founderFallback.login && <span className="border border-eg-gold/40 px-1.5 py-0.5 text-[10px] text-eg-gold">{t("founder")}</span>}</span><span className="mt-1 block text-xs text-eg-muted">{t("contributions", { count: contributor.contributions })}</span></span>
                <span className="text-xs text-eg-text-sub" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-eg-muted">{t("update_note")}</p>
        </section>

        <section className="mt-6 border-t border-eg-border pt-6">
          <h2 className="store-title mb-3">{t("values_title")}</h2>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{valueKeys.map((key) => <div key={key}><dt className="text-[13px] font-semibold text-eg-heading">{t(`values.${key}.title`)}</dt><dd className="mt-1 text-xs leading-5 text-eg-text-sub">{t(`values.${key}.desc`)}</dd></div>)}</dl>
        </section>

        <section className="mt-6 border-t border-eg-border pt-6">
          <h2 className="store-title mb-2">{t("creator_title")}</h2>
          <p className="max-w-3xl text-sm leading-7 text-eg-text-sub">{t.rich("creator_body", { link: (chunks) => <a href="https://linktr.ee/zyad" target="_blank" rel="noopener noreferrer" className="text-eg-blue hover:text-white">{chunks}</a> })}</p>
        </section>

        <p className="mt-6 border-t border-eg-border pt-4 text-xs text-eg-muted">{t.rich("license", { github: (chunks) => <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="text-eg-blue hover:text-white">{chunks}</a> })}</p>
      </div>
    </div>
  );
}
