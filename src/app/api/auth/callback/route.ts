import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_NEXT_PATHS = new Set(["/profile", "/dashboard", "/store", "/reset-password", "/"]);

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

function isMissingCodeVerifier(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === "pkce_code_verifier_not_found" || /code verifier/i.test(error?.message ?? "");
}

export async function GET(request: NextRequest) {
  const locale = getLocale(request.nextUrl.searchParams.get("locale"));
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getNextPath(request.nextUrl.searchParams.get("next"));
  const failurePath = nextPath === "/reset-password"
    ? `/${locale}/forgot-password?error=link_expired`
    : `/${locale}/login?error=confirm_failed`;
  const missingVerifierPath = nextPath === "/reset-password"
    ? failurePath
    : `/${locale}/login?confirmed=1`;

  if (!code) {
    return redirectTo(request, failurePath);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectTo(request, isMissingCodeVerifier(error) ? missingVerifierPath : failurePath);
    }
  } catch (error) {
    const authError = error instanceof Error ? { message: error.message } : null;
    return redirectTo(request, isMissingCodeVerifier(authError) ? missingVerifierPath : failurePath);
  }

  return redirectTo(request, `/${locale}${nextPath}`);
}
