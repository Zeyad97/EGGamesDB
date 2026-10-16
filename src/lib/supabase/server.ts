import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const configured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    configured ? SUPABASE_URL : "https://placeholder.supabase.co",
    configured ? SUPABASE_ANON_KEY : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// Bounded timeout (ms) for anonymous public catalog reads. An unreachable
// Supabase backend must fail fast instead of blocking navigation for seconds.
const PUBLIC_FETCH_TIMEOUT_MS = 1500;

// Thin wrapper around the ambient (Next-patched) global fetch that aborts
// hung requests after PUBLIC_FETCH_TIMEOUT_MS. An upstream abort signal is
// composed: if the caller aborts first, the request aborts with the
// caller's reason. Timers and listeners are always cleaned up.
function fetchWithPublicTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const upstream = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const controller = new AbortController();
  const onUpstreamAbort = () => controller.abort(upstream?.reason);
  const timer = setTimeout(() => {
    controller.abort(new Error(`Supabase request timed out after ${PUBLIC_FETCH_TIMEOUT_MS}ms`));
  }, PUBLIC_FETCH_TIMEOUT_MS);
  if (upstream) {
    if (upstream.aborted) {
      controller.abort(upstream.reason);
    } else {
      upstream.addEventListener("abort", onUpstreamAbort, { once: true });
    }
  }
  const cleanup = () => {
    clearTimeout(timer);
    upstream?.removeEventListener("abort", onUpstreamAbort);
  };
  let result: Promise<Response>;
  try {
    result = globalThis.fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    cleanup();
    throw error;
  }
  return result.then(
    (response) => {
      cleanup();
      return response;
    },
    (error) => {
      cleanup();
      throw error;
    }
  );
}

// Anonymous client for server-rendered public catalog reads only. It carries
// no user cookie/session dependency. It throws immediately when Supabase env
// values are not configured, so callers fall back without ever contacting a
// placeholder host. Every network request is bounded by
// PUBLIC_FETCH_TIMEOUT_MS via fetchWithPublicTimeout, and PostgREST automatic
// retries are disabled: idempotent GETs that fail with a network error would
// otherwise be retried with 1s/2s/4s backoff (~7s total) before surfacing.
export function createPublicClient() {
  if (!configured) {
    throw new Error("Supabase is not configured");
  }
  const client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithPublicTimeout },
  });
  // supabase-js does not forward a retry flag to its PostgREST client, so set
  // the documented PostgrestClient retry option directly. Every from()/rpc()
  // builder inherits it.
  (client as unknown as { rest: { retry: boolean | undefined } }).rest.retry = false;
  return client;
}
