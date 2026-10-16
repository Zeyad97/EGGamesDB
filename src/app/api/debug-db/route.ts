import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const info = {
    urlPrefix: url.slice(0, 30),
    urlLen: url.length,
    keyLen: key.length,
    keyPrefix: key.slice(0, 15),
  };
  try {
    const { data, error, count } = await createPublicClient()
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    return NextResponse.json({ ...info, ok: !error, count, error: error?.message ?? null, dataLen: data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ ...info, ok: false, thrown: String(e).slice(0, 300) });
  }
}
