export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.eggamedb.com").replace(/\/$/, "");

export function buildAlternates(locale: string, pathWithoutLocale: string) {
  const path = pathWithoutLocale === "/" ? "" : `/${pathWithoutLocale.replace(/^\/+|\/+$/g, "")}`;
  const en = `${SITE_URL}/en${path}`;
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: { en, ar: `${SITE_URL}/ar${path}`, "x-default": en },
  };
}

export function absoluteLocaleUrl(locale: string, pathWithoutLocale: string) {
  const path = pathWithoutLocale === "/" ? "" : `/${pathWithoutLocale.replace(/^\/+|\/+$/g, "")}`;
  return `${SITE_URL}/${locale}${path}`;
}
