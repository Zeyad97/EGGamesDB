import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const client = createPublicClient();
    // exact homepage query
    const r1 = await client.from("games").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(4);
    out.homeQuery = { ok: !r1.error, err: r1.error?.message ?? null, rows: r1.data?.length ?? 0, firstKeys: r1.data?.[0] ? Object.keys(r1.data[0]).slice(0, 8) : [] };
  } catch (e) {
    out.homeQuery = { thrown: String(e).slice(0, 400) };
  }
  return NextResponse.json(out);
}
