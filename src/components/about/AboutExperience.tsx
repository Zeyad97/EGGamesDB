"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Code2, Flag, Gamepad2, GitBranch, Heart, Landmark, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/lib/hooks/useCarousel";

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: "User";
}

interface AboutExperienceProps {
  locale: string;
  contributors: Contributor[];
  gameImages: string[];
  stats: { games: number; studios: number; contributors: number; contributions: number };
}

const valueKeys = ["gaming_first", "egyptian_pride", "quality", "open_source", "community", "free_forever"] as const;
const valueIcons = [Gamepad2, Flag, BadgeCheck, GitBranch, Users, Heart];
const stack = ["Next.js 16", "TypeScript", "Tailwind CSS", "Framer Motion", "Supabase", "PostgreSQL"];
const REPOSITORY_URL = "https://github.com/Zeyad97/EGGamesDB";
const entrance: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({ children, className = "", reducedMotion }: { children: React.ReactNode; className?: string; reducedMotion: boolean }) {
  return (
    <motion.section
      className={className}
      variants={entrance}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
      whileInView={reducedMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.12 }}
    >
      {children}
    </motion.section>
  );
}

export function AboutExperience({ locale, contributors, gameImages, stats }: AboutExperienceProps) {
  const t = useTranslations("about");
  const reducedMotion = usePrefersReducedMotion();
  const founder = contributors.find((item) => item.login.toLowerCase() === "zyad97") ?? contributors[0];
  const others = contributors.filter((item) => item.login.toLowerCase() !== founder.login.toLowerCase());
  const direction = locale === "ar" ? "rtl" : "ltr";
  const statsList = [
    { label: t("stats_games"), value: stats.games, icon: Gamepad2 },
    { label: t("stats_studios"), value: stats.studios, icon: Landmark },
    { label: t("stats_contributors"), value: stats.contributors, icon: Users },
    { label: t("stats_contributions"), value: stats.contributions, icon: GitBranch },
  ];

  return (
    <main className="overflow-hidden bg-eg-darker" dir={direction}>
      <header className="relative isolate min-h-[620px] overflow-hidden border-b border-eg-gold/30 sm:min-h-[660px] lg:min-h-[700px]">
        {gameImages.slice(0, 3).map((source, index) => (
          <div key={source} className={`absolute inset-y-0 ${index === 0 ? "start-0 w-full" : "hidden"}`}>
            <Image src={source} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-40" />
          </div>
        ))}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,#12100d_0%,rgba(18,16,13,.92)_38%,rgba(18,16,13,.48)_100%)] rtl:bg-[linear-gradient(270deg,#12100d_0%,rgba(18,16,13,.92)_38%,rgba(18,16,13,.48)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,#12100d_0%,transparent_54%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1"><span className="w-[68%] bg-eg-red" /><span className="flex-1 bg-eg-gold" /></div>
        <div className="relative mx-auto flex min-h-[620px] max-w-[1600px] flex-col justify-end px-5 pb-14 pt-32 sm:min-h-[660px] sm:px-10 sm:pb-20 lg:min-h-[700px] lg:px-16">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.65 }}>
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-eg-gold sm:text-xs">EGGameDB <span className="mx-2 text-eg-red">/</span>{t("creator_title")}</p>
            <h1 className="mt-6 max-w-[12ch] text-[clamp(3.2rem,9vw,8.2rem)] font-semibold leading-[.91] tracking-[-.065em] text-eg-heading">{t("hero_title")}</h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-eg-text sm:text-base sm:leading-8">{t("intro")}</p>
            <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-5 border border-eg-gold bg-eg-gold px-5 text-sm font-bold text-eg-darker transition-colors hover:bg-eg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-eg-heading">
              {t("hero_cta")}<ArrowUpRight size={17} aria-hidden="true" className="rtl:rotate-[-90deg]" />
            </a>
          </motion.div>
          <div aria-hidden="true" className="mt-12 flex items-center gap-3">
            <span className="h-[3px] w-14 bg-eg-red" /><span className="h-px w-24 bg-eg-gold/80" /><span className="text-[9px] font-mono tracking-[.24em] text-eg-muted">01 / 04</span>
          </div>
        </div>
      </header>

      <section aria-label={t("stats_label")} className="border-b border-eg-border bg-eg-nav/70">
        <div className="mx-auto grid max-w-[1360px] grid-cols-2 divide-x divide-y divide-white/10 px-5 sm:px-10 lg:grid-cols-4 lg:divide-y-0 lg:px-16">
          {statsList.map(({ label, value, icon: Icon }, index) => (
            <div key={label} className={`flex min-h-28 items-center gap-3 py-5 sm:gap-4 ${index % 2 === 1 ? "ps-4 sm:ps-8" : "pe-3 sm:pe-6"} ${index > 1 ? "pt-5" : ""} lg:px-6 lg:first:ps-0 lg:last:pe-0`}>
              <Icon size={19} strokeWidth={1.5} className="shrink-0 text-eg-gold" aria-hidden="true" />
              <div className="min-w-0"><p className="text-2xl font-semibold tabular-nums tracking-tight text-eg-heading sm:text-3xl">{value.toLocaleString(locale)}</p><p className="mt-1 text-[9px] font-bold uppercase leading-4 tracking-[.14em] text-eg-text-sub sm:text-[10px]">{label}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-5 sm:px-10 lg:px-16">
        <Reveal reducedMotion={reducedMotion} className="grid gap-8 border-b border-eg-border py-16 sm:py-20 lg:grid-cols-[.65fr_1.35fr] lg:gap-14 lg:py-28">
          <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-eg-gold">01 <span className="mx-2 text-eg-red">/</span>{t("mission_kicker")}</p><h2 className="mt-3 text-sm font-bold uppercase tracking-[.15em] text-eg-text-sub">{t("mission_title")}</h2></div>
          <div><p className="max-w-5xl text-[clamp(1.8rem,4.3vw,4.1rem)] font-medium leading-[1.18] tracking-[-.045em] text-eg-heading">{t("mission_statement")}</p><p className="mt-7 max-w-3xl text-sm leading-7 text-eg-text-sub">{t("mission_body")}</p></div>
        </Reveal>

        <Reveal reducedMotion={reducedMotion} className="border-b border-eg-border py-16 sm:py-20">
          <div className="mb-9 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-eg-gold">02 <span className="mx-2 text-eg-red">/</span>{t("values_kicker")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-eg-heading sm:text-4xl">{t("values_title")}</h2></div><span aria-hidden="true" className="hidden h-px flex-1 bg-eg-border sm:block" /></div>
          <div className="grid gap-px border border-eg-border bg-eg-border sm:grid-cols-2 lg:grid-cols-3">
            {valueKeys.map((key, index) => {
              const Icon = valueIcons[index];
              return <article key={key} className="group min-h-[205px] bg-eg-dark p-5 transition-colors duration-300 hover:bg-eg-card sm:p-7"><div className="flex items-center justify-between"><Icon size={21} strokeWidth={1.5} className="text-eg-gold" aria-hidden="true" /><span className="font-mono text-xs text-eg-muted">0{index + 1}</span></div><h3 className="mt-9 text-lg font-semibold text-eg-heading">{t(`values.${key}.title`)}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-eg-text-sub">{t(`values.${key}.desc`)}</p></article>;
            })}
          </div>
        </Reveal>

        <Reveal reducedMotion={reducedMotion} className="flex flex-col gap-6 border-b border-eg-border py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-eg-gold">03 <span className="mx-2 text-eg-red">/</span>{t("stack_kicker")}</p><h2 className="mt-2 text-xl font-semibold text-eg-heading">{t("stack_title")}</h2></div>
          <div className="flex max-w-3xl flex-wrap gap-2">{stack.map((item) => <span key={item} className="border border-eg-border-strong px-3 py-2 text-xs font-medium text-eg-text-sub">{item}</span>)}</div>
        </Reveal>

        <Reveal reducedMotion={reducedMotion} className="py-16 sm:py-24" >
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-14">
            <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-eg-gold">04 <span className="mx-2 text-eg-red">/</span>{t("hall_eyebrow")}</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] text-eg-heading sm:text-5xl">{t("hall_title")}</h2><p className="mt-5 max-w-md text-sm leading-7 text-eg-text-sub">{t("hall_body")}</p><p className="mt-6 border-s-2 border-eg-red ps-4 text-xs leading-6 text-eg-muted">{t("hall_summary", { contributors: stats.contributors, contributions: stats.contributions })}</p></div>
            <div className="min-w-0">
              <a href={founder.html_url} target="_blank" rel="noopener noreferrer" aria-label={t("github_profile", { login: founder.login })} className="group relative flex min-h-[230px] items-end overflow-hidden border border-eg-gold/50 bg-[radial-gradient(ellipse_at_80%_20%,rgba(214,177,90,.16),transparent_44%),#211d17] p-5 transition-colors hover:border-eg-gold sm:min-h-[270px] sm:p-8">
                <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-eg-gold" />
                <Image src={founder.avatar_url} alt="" width={128} height={128} className="absolute end-5 top-5 h-24 w-24 rounded-sm border border-eg-gold/50 object-cover grayscale transition-[filter] group-hover:grayscale-0 sm:end-8 sm:top-8 sm:h-32 sm:w-32" />
                <span aria-hidden="true" className="absolute end-[6.8rem] top-7 font-mono text-[10px] tracking-[.2em] text-eg-gold sm:end-44 sm:top-10">01 / FOUNDING CONTRIBUTOR</span>
                <span className="relative min-w-0"><span className="inline-flex border border-eg-gold/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[.18em] text-eg-gold">{t("founder")}</span><span className="mt-3 block truncate text-3xl font-semibold tracking-tight text-eg-heading sm:text-5xl">{founder.login}</span><span className="mt-2 block text-xs text-eg-text-sub">{t("contributions", { count: founder.contributions })}</span></span>
                <ArrowUpRight size={20} aria-hidden="true" className="absolute bottom-6 end-6 text-eg-gold transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 rtl:rotate-[-90deg]" />
              </a>
              {others.length > 0 && <div className="mt-3 grid gap-px border border-eg-border bg-eg-border sm:grid-cols-2">{others.map((contributor, index) => <a key={`${contributor.id}-${contributor.login}`} href={contributor.html_url} target="_blank" rel="noopener noreferrer" aria-label={t("github_profile", { login: contributor.login })} className="group flex min-w-0 items-center gap-3 bg-eg-dark p-3 transition-colors hover:bg-eg-card sm:p-4"><span className="font-mono text-[10px] text-eg-gold">{String(index + 2).padStart(2, "0")}</span><Image src={contributor.avatar_url} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-sm border border-eg-border object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-eg-heading group-hover:text-eg-gold">{contributor.login}</span><span className="mt-1 block text-[11px] text-eg-muted">{t("contributions", { count: contributor.contributions })}</span></span><ArrowUpRight size={15} aria-hidden="true" className="shrink-0 text-eg-muted" /></a>)}</div>}
              <p className="mt-3 text-[11px] leading-5 text-eg-muted">{t("update_note")}</p>
              <div className="mt-7 border-t-2 border-eg-red bg-eg-card p-5 sm:p-7"><div className="flex items-center gap-3"><GitBranch size={18} className="text-eg-gold" aria-hidden="true"/><h3 className="text-base font-semibold text-eg-heading">{t("join_title")}</h3></div><ol className="mt-5 grid gap-4 sm:grid-cols-3">{["join_step_one", "join_step_two", "join_step_three"].map((key, index) => <li key={key} className="flex gap-3"><span className="font-mono text-xs text-eg-gold">0{index + 1}</span><span className="text-xs leading-5 text-eg-text-sub">{t(key)}</span></li>)}</ol><a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-eg-gold hover:text-eg-accent-hover">{t("contribute")}<ArrowUpRight size={14} aria-hidden="true" className="rtl:rotate-[-90deg]" /></a></div>
            </div>
          </div>
        </Reveal>

        <Reveal reducedMotion={reducedMotion} className="grid gap-8 border-t border-eg-border py-12 sm:grid-cols-[.65fr_1.35fr] sm:py-16">
          <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-eg-gold">05 <span className="mx-2 text-eg-red">/</span>{t("creator_kicker")}</p><h2 className="mt-3 text-2xl font-semibold text-eg-heading">{t("creator_title")}</h2></div>
          <div><p className="max-w-3xl text-base leading-8 text-eg-text-sub">{t.rich("creator_body", { link: (chunks) => <a href="https://linktr.ee/zyad" target="_blank" rel="noopener noreferrer" className="font-semibold text-eg-gold underline decoration-eg-gold/40 underline-offset-4 hover:text-eg-accent-hover">{chunks}</a> })}</p><p className="mt-5 text-xs leading-6 text-eg-muted">{t.rich("license", { github: (chunks) => <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="text-eg-gold hover:text-eg-accent-hover">{chunks}</a> })}</p></div>
        </Reveal>
      </div>

      <Reveal reducedMotion={reducedMotion} className="relative isolate overflow-hidden border-y border-eg-gold/30 bg-eg-nav">
        <div aria-hidden="true" className="absolute inset-y-0 start-0 w-2 bg-eg-red" />
        <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-6 py-14 sm:px-10 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-16">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-eg-gold"><Code2 size={14} className="me-2 inline" aria-hidden="true"/>{t("cta_kicker")}</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] text-eg-heading sm:text-5xl">{t("cta_title")}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-eg-text-sub">{t("cta_body")}</p></div>
          <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-5 bg-eg-gold px-6 text-sm font-bold text-eg-darker transition-colors hover:bg-eg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-eg-heading">{t("cta_button")}<ArrowUpRight size={18} aria-hidden="true" className="rtl:rotate-[-90deg]" /></a>
        </div>
      </Reveal>
      <div aria-hidden="true" className="h-1 bg-eg-gold/70" />
    </main>
  );
}
