import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { gameSubmissionSchema } from "@/lib/validators/game";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["contributor", "admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Contributor role required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = gameSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const isDraft = body.draft === true;

  // Generate unique slug
  let slug = slugify(data.title);
  const { data: existing } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .single();
  if (existing) slug = `${slug}-${Date.now()}`;

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      slug,
      title: data.title,
      title_ar: data.title_ar,
      short_description: data.short_description,
      short_description_ar: data.short_description_ar,
      long_description: data.long_description,
      long_description_ar: data.long_description_ar,
      steam_app_id: data.steam_app_id || null,
      steam_url: data.steam_url || null,
      tags: data.tags,
      genres: data.genres,
      release_date: data.release_date || null,
      developer_id: user.id,
      developer_name: data.developer_name,
      publisher: data.publisher || null,
      is_free: data.is_free,
      price_usd: data.price_usd || null,
      status: isDraft ? "draft" : "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admins (insert notification)
  if (!isDraft) {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"]);

    if (admins?.length) {
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          title: "New Game Submission",
          message: `"${data.title}" submitted for review`,
          type: "info",
          action_url: `/admin`,
        }))
      );
    }
  }

  return NextResponse.json({ game }, { status: 201 });
}
