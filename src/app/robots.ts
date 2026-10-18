import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const privatePaths = ["admin", "dashboard", "profile", "submit", "login", "register", "verify-email", "forgot-password", "reset-password"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", ...privatePaths.flatMap((path) => [`/en/${path}`, `/ar/${path}`])] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
