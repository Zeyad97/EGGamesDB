import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AtSign, Code2, Mail } from "lucide-react";
import { Wordmark } from "@/components/layout/Brand";

const platformLinks = [
  { href: "/games", key: "explore" },
  { href: "/developers", key: "developers" },
  { href: "/submit", key: "submit" },
  { href: "/about", key: "about" },
] as const;

const legalLinks = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
  { href: "/contact", key: "contact" },
] as const;

const socialLinks = [
  { href: "https://github.com/Zeyad97/EGGamesDB", label: "GitHub", Icon: Code2 },
  { href: "https://twitter.com/eggamedb", label: "Twitter", Icon: AtSign },
  { href: "mailto:hello@eggamedb.com", label: "Email", Icon: Mail },
] as const;

export function Footer() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  return (
    <footer className="mt-10 border-t border-eg-border bg-eg-darker">
      <div className="store-container py-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex min-h-10 items-center rounded-sm sm:min-h-0">
              <Wordmark />
            </Link>
            <p className="mt-2 text-xs leading-5 text-eg-muted">{t("footer_description")}</p>
            <div className="mt-3 flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center text-eg-muted transition-colors hover:text-eg-text-sub sm:min-h-0 sm:min-w-0"
                >
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-10">
            <nav aria-label={t("platform")}>
              <p className="mb-2 text-[11px] font-semibold text-eg-muted">{t("platform")}</p>
              <ul className="space-y-1.5">
                {platformLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-10 min-w-10 items-center text-xs text-eg-text-sub transition-colors hover:text-eg-heading sm:min-h-0 sm:min-w-0"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t("legal")}>
              <p className="mb-2 text-[11px] font-semibold text-eg-muted">{t("legal")}</p>
              <ul className="space-y-1.5">
                {legalLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-10 min-w-10 items-center text-xs text-eg-text-sub transition-colors hover:text-eg-heading sm:min-h-0 sm:min-w-0"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-eg-border pt-4 text-xs text-eg-muted sm:flex-row sm:items-center sm:justify-between sm:text-[11px]">
          <p>© {new Date().getFullYear()} EGGameDB · MIT License</p>
          <p className="flex items-center gap-1.5">
            <span>{tc("made_in_egypt")}</span>
            <span aria-hidden="true" className="text-eg-gold">
              ·
            </span>
            <a
              href="https://zyaddev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 min-w-10 items-center text-eg-text-sub transition-colors hover:text-white sm:min-h-0 sm:min-w-0"
            >
              ZYAD
            </a>
          </p>
        </div>
      </div>
      <div className="eg-geometric-rule" aria-hidden="true" />
    </footer>
  );
}
