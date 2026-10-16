import { NextRequest, NextResponse } from "next/server";
import { fetchSteamGameData, steamDataToGameFields } from "@/lib/steam";
import { extractSteamAppId } from "@/lib/utils";

// Rate limit: simple in-memory (use Redis for production)
const rateMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 10 requests/minute." }, { status: 429 });
  }

  const input = req.nextUrl.searchParams.get("id");
  if (!input) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

  const appId = extractSteamAppId(input);
  if (!appId) return NextResponse.json({ error: "Invalid Steam App ID or URL" }, { status: 400 });

  const data = await fetchSteamGameData(appId);
  if (!data) return NextResponse.json({ error: "Game not found on Steam" }, { status: 404 });

  return NextResponse.json({ data: steamDataToGameFields(data) });
}
