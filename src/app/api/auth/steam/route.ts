import { NextResponse } from "next/server";
import { buildSteamAuthUrl, getBaseUrl } from "@/lib/steam";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "";
  const locale = url.searchParams.get("locale") || "en";
  const link = url.searchParams.get("link") === "1";

  const callback = new URL(`${getBaseUrl()}/api/auth/steam/callback`);
  callback.searchParams.set("locale", locale);
  if (next) callback.searchParams.set("next", next);

  // Linking mode: only meaningful for a signed-in user. The callback re-reads
  // the session cookie to attach the SteamID to that same account.
  if (link) {
    const user = await getSessionUser();
    if (user) callback.searchParams.set("link", "1");
  }

  return NextResponse.redirect(buildSteamAuthUrl(callback.toString()));
}
