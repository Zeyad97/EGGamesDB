import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_NEXT_PATHS = new Set(["/profile", "/dashboard", "/store", "/"]);

function getLocale(value: string | null): "en" | "ar" {
  return value === "ar" ? "ar" : value === "en" ? "en" : "en";
}

function getNextPath(value: string | null): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) &&
    ALLOWED_NEXT_PATHS.has(value)
  ) {
    return value;
  }
  return "/profile";
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  const locale = getLocale(request.nextUrl.searchParams.get("locale"));
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return redirectTo(request, `/${locale}/login?error=confirm_failed`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectTo(request, `/${locale}/login?error=confirm_failed`);
    }
  } catch {
    return redirectTo(request, `/${locale}/login?error=confirm_failed`);
  }

  const nextPath = getNextPath(request.nextUrl.searchParams.get("next"));
  return redirectTo(request, `/${locale}${nextPath}`);
}
