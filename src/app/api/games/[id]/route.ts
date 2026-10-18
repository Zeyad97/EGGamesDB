import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gameSubmissionSchema } from "@/lib/validators/game";
import { sanitizeGameDescription } from "@/lib/security/sanitize-html";
import { isAllowedStateChangeOrigin } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";

// PATCH /api/games/:id — owner or admin edits a submission.
// Owners may move draft -> pending, pending -> draft, or resubmit
// rejected -> pending. Only draft/pending are accepted from the client.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAllowedStateChangeOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await enforceRateLimit(req, "games-update", 10))) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 10 requests/minute." }, { status: 429 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing game id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("games")
    .select("id, developer_id, status")
    .eq("id", id)
    .single();
  // Non-owners/non-admins cannot read non-approved rows, so a missing row is
  // reported as 404 without leaking its existence.
  if (!existing) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = !!profile && ["admin", "super_admin"].includes(profile.role);
  const isOwner = existing.developer_id === user.id;
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isAdmin && !["draft", "pending", "rejected"].includes(existing.status)) {
    return NextResponse.json({ error: "Only draft, pending, or rejected games can be edited" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = gameSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const status = (body as { draft?: unknown }).draft === true ? "draft" : "pending";
  if (!isAdmin && status !== existing.status) {
    const allowed =
      (existing.status === "draft" && status === "pending") ||
      (existing.status === "pending" && status === "draft") ||
      (existing.status === "rejected" && status === "pending");
    if (!allowed) return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  // Whitelisted columns only: developer_id, reviewed_*, spotlight_at,
  // counters, and rejection_reason are never accepted from the body.
  const update: Record<string, unknown> = {
    title: data.title,
    title_ar: data.title_ar,
    short_description: data.short_description,
    short_description_ar: data.short_description_ar,
    long_description: sanitizeGameDescription(data.long_description),
    long_description_ar: sanitizeGameDescription(data.long_description_ar),
    steam_app_id: data.steam_app_id || null,
    steam_url: data.steam_url || null,
    tags: data.tags,
    genres: data.genres,
    release_date: data.release_date || null,
    developer_name: data.developer_name,
    publisher: data.publisher || null,
    is_free: data.is_free,
    price_usd: data.price_usd ?? null,
    header_image: data.header_image ?? null,
    capsule_image: data.capsule_image ?? null,
    screenshots: data.screenshots ?? [],
    status,
  };
  // Clear the moderator's reason when a rejected game is resubmitted; the
  // database trigger permits this only on rejected -> pending.
  if (existing.status === "rejected" && status === "pending") {
    update.rejection_reason = null;
  }

  const { data: game, error } = await supabase
    .from("games")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ game }, { status: 200 });
}
