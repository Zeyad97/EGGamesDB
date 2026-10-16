import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    timeZone: "Africa/Cairo",
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
