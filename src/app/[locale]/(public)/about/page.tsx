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
    if (!contributors.some((contributor) => contributor.login.toLowerCase() === founderFallback.login.toLowerCase())) contributors.push(founderFallback);
    return contributors.sort((a, b) => b.contributions - a.contributions || a.login.localeCompare(b.login));
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
  const founder = contributors.find((contributor) => contributor.login.toLowerCase() === founderFallback.login.toLowerCase()) ?? founderFallback;
  const others = contributors.filter((contributor) => contributor.login.toLowerCase() !== founder.login.toLowerCase());
  const contributionTotal = contributors.reduce((total, contributor) => total + contributor.contributions, 0);

  return (
    <div className="pb-10">
      <div className="store-container pt-6 sm:pt-10">
        <header className="border-b-2 border-eg-gold/60 pb-7 sm:pb-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-eg-gold">EGGameDB <span aria-hidden="true">/</span> {t("creator_title")}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight text-eg-heading sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-eg-text-sub sm:text-base sm:leading-8">{t("intro")}</p>
        </header>

        <div className="grid gap-6 border-b border-eg-border py-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-10 lg:py-8">
          <section className="border-b border-eg-border pb-6 lg:border-b-0 lg:border-e lg:pb-0 lg:pe-10">
            <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-eg-gold">01 <span className="ms-2 font-sans tracking-normal text-eg-muted">{t("mission_title")}</span></p>
            <h2 className="mt-3 text-xl font-bold text-eg-heading">{t("mission_title")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-eg-text-sub">{t("mission_body")}</p>
          </section>
          <section className="lg:ps-1">
            <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-eg-gold">02 <span className="ms-2 font-sans tracking-normal text-eg-muted">{t("stack_title")}</span></p>
            <h2 className="mt-3 text-xl font-bold text-eg-heading">{t("stack_title")}</h2>
            <p className="mt-3 text-sm leading-7 text-eg-text-sub">{stack.join(" · ")}</p>
            <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-10 items-center border border-eg-gold px-4 text-sm font-semibold text-eg-gold transition-colors hover:bg-eg-gold hover:text-eg-darker focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-gold">{t("contribute")}</a>
          </section>
        </div>

        <section className="border-b border-eg-border py-7 sm:py-9">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-eg-border pb-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">03 / {t("hall_eyebrow")}</p><h2 className="mt-1 text-2xl font-black text-eg-heading sm:text-3xl">{t("hall_title")}</h2></div>
            <p className="max-w-md text-xs leading-5 text-eg-muted">{t("hall_summary", { contributors: contributors.length, contributions: contributionTotal })}</p>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-eg-text-sub">{t("hall_body")}</p>
          <a href={founder.html_url} target="_blank" rel="noopener noreferrer" aria-label={t("github_profile", { login: founder.login })} className="group mt-5 flex items-center gap-4 border border-eg-gold/50 bg-eg-gold/[0.06] p-4 transition-colors hover:bg-eg-gold/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-eg-gold sm:p-5">
            <Image src={founder.avatar_url} alt="" width={72} height={72} className="h-16 w-16 shrink-0 rounded-sm border border-eg-gold/50 object-cover sm:h-[72px] sm:w-[72px]" />
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-lg font-bold text-eg-heading group-hover:text-eg-gold">{founder.login}</span><span className="border border-eg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-eg-gold">{t("founder")}</span></span><span className="mt-1 block text-xs text-eg-muted">{t("contributions", { count: founder.contributions })}</span></span>
            <span className="text-xs text-eg-gold" aria-hidden="true">↗</span>
          </a>
          {others.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{others.map((contributor, index) => <a key={`${contributor.id}-${contributor.login}`} href={contributor.html_url} target="_blank" rel="noopener noreferrer" aria-label={t("github_profile", { login: contributor.login })} className={`group flex min-w-0 items-center gap-3 border border-eg-border bg-eg-card px-3 py-2.5 transition-colors hover:border-eg-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-eg-gold ${index < 3 ? "border-t-2 border-t-eg-gold/70" : ""}`}><Image src={contributor.avatar_url} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-sm border border-eg-border object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-eg-heading group-hover:text-eg-gold">{contributor.login}</span><span className="mt-0.5 block text-[11px] text-eg-muted">{t("contributions", { count: contributor.contributions })}</span></span><span className="font-mono text-xs text-eg-muted">{String(index + 2).padStart(2, "0")}</span></a>)}</div>}
          <p className="mt-4 text-xs leading-5 text-eg-muted">{t("update_note")}</p>
          <div className="mt-5 border-s-2 border-eg-gold bg-eg-surface px-4 py-4 sm:px-5"><h3 className="text-sm font-bold text-eg-heading">{t("join_title")}</h3><ol className="mt-3 grid gap-2 text-xs leading-5 text-eg-text-sub sm:grid-cols-3">{["join_step_one", "join_step_two", "join_step_three"].map((key, index) => <li key={key} className="flex gap-2"><span className="font-mono text-eg-gold">0{index + 1}</span><span>{t(key)}</span></li>)}</ol><a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-9 items-center border border-eg-border-strong px-3 text-xs font-semibold text-eg-heading transition-colors hover:border-eg-gold hover:text-eg-gold">{t("contribute")}</a></div>
        </section>

        <section className="border-b border-eg-border py-7 sm:py-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">04</p><h2 className="store-title mb-4 mt-1">{t("values_title")}</h2>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{valueKeys.map((key, index) => <div key={key} className="border-t border-eg-border pt-3"><dt className="text-[13px] font-semibold text-eg-heading"><span className="me-2 font-mono text-[10px] text-eg-gold">{String(index + 1).padStart(2, "0")}</span>{t(`values.${key}.title`)}</dt><dd className="mt-1 text-xs leading-5 text-eg-text-sub">{t(`values.${key}.desc`)}</dd></div>)}</dl>
        </section>

        <section className="border-b border-eg-border py-7 sm:py-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-eg-gold">05</p><h2 className="store-title mb-2 mt-1">{t("creator_title")}</h2>
          <p className="max-w-3xl text-sm leading-7 text-eg-text-sub">{t.rich("creator_body", { link: (chunks) => <a href="https://linktr.ee/zyad" target="_blank" rel="noopener noreferrer" className="text-eg-blue hover:text-white">{chunks}</a> })}</p>
        </section>

        <p className="pt-4 text-xs text-eg-muted">{t.rich("license", { github: (chunks) => <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="text-eg-blue hover:text-white">{chunks}</a> })}</p>
      </div>
    </div>
  );
}
