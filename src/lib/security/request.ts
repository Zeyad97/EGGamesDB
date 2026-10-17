import type { NextRequest } from "next/server";

export function isAllowedStateChangeOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const expected = new URL(request.url);
    if (parsed.origin === expected.origin) return true;
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    return Boolean(configured && parsed.origin === new URL(configured).origin);
  } catch {
    return false;
  }
}
