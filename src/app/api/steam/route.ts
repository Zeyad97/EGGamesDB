import { NextRequest, NextResponse } from "next/server";
import { fetchSteamGameData, steamDataToGameFields } from "@/lib/steam";
import { extractSteamAppId } from "@/lib/utils";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  if (!(await enforceRateLimit(req, "steam", 10))) {
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
