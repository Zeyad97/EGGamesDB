import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ["/submit", "/profile", "/dashboard"];
const ADMIN_PATHS = ["/admin"];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const configured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const withoutLocale = pathname.replace(/^\/(en|ar)/, "") || "/";
  const isProtected = PROTECTED_PATHS.some((p) => withoutLocale.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => withoutLocale.startsWith(p));

  if ((isProtected || isAdmin) && configured) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const locale = pathname.split("/")[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    if (isAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "super_admin"].includes(profile.role)) {
        const locale = pathname.split("/")[1] || "en";
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }

    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|favicon|public|.*\\..*).*)" ],
};

// Also export as default for compatibility
export default proxy;
