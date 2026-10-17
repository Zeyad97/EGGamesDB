const fallback = new Map<string, { count: number; reset: number }>();

function headersOf(request: Request | Headers): Headers {
  return request instanceof Headers ? request : request.headers;
}

function clientIp(headers: Headers): string {
  // On Vercel the leftmost untrusted hop is surfaced via
  // x-vercel-forwarded-for; prefer it, then x-real-ip, then the first
  // x-forwarded-for hop.
  const vercelForwarded = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelForwarded) return vercelForwarded;
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function enforceRateLimit(request: Request | Headers, scope: string, limit: number, windowSeconds = 60): Promise<boolean> {
  const headers = headersOf(request);
  const ip = clientIp(headers);
  const key = `egdb:rl:${scope}:${ip}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        // NX keeps the original window: the TTL is set only when the key is
        // first created, so repeated hits cannot extend the window.
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(windowSeconds), "NX"]]),
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        const result = await response.json() as Array<{ result?: number | string; error?: string }>;
        const count = Number(result?.[0]?.result);
        if (Number.isFinite(count)) return count <= limit;
      }
    } catch { /* Fail open to bounded per-instance limiting if Redis is unavailable. */ }
  }
  const now = Date.now();
  if (fallback.size > 5_000) {
    for (const [storedKey, storedValue] of fallback) if (now >= storedValue.reset) fallback.delete(storedKey);
    if (fallback.size > 5_000) fallback.delete(fallback.keys().next().value as string);
  }
  const entry = fallback.get(key);
  if (!entry || now >= entry.reset) {
    fallback.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
