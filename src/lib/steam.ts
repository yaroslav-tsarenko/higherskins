// Steam OpenID 2.0 auth + trade URL helpers. No third-party SDK required.

const STEAM_OPENID = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";

export function getBaseUrl(): string {
  // Prefer the canonical public site URL so Steam always redirects back to the
  // real domain — not the protected Vercel deployment URL (which shows the
  // "You Need Access" SSO gate). APP_URL still wins for local overrides.
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

// Build the Steam login redirect URL.
export function buildSteamAuthUrl(returnTo: string): string {
  const realm = getBaseUrl();
  const params = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID}?${params.toString()}`;
}

// Verify the OpenID callback with Steam (check_authentication) and return SteamID64.
export async function verifySteamCallback(query: URLSearchParams): Promise<string | null> {
  const claimedId = query.get("openid.claimed_id");
  if (!claimedId) return null;

  const body = new URLSearchParams();
  for (const [key, value] of query.entries()) {
    if (key.startsWith("openid.")) body.set(key, value);
  }
  body.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  if (!/is_valid\s*:\s*true/i.test(text)) return null;

  const match = claimedId.match(/\/openid\/id\/(\d{17})$/);
  return match ? match[1] : null;
}

export interface SteamProfile {
  steamId64: string;
  personaName: string | null;
  profileUrl: string | null;
  avatar: string | null;
  avatarFull: string | null;
}

// Fetch profile summary via Steam Web API. Requires STEAM_API_KEY; degrades gracefully.
export async function fetchSteamProfile(steamId64: string): Promise<SteamProfile> {
  const key = process.env.STEAM_API_KEY;
  const fallback: SteamProfile = {
    steamId64,
    personaName: null,
    profileUrl: `https://steamcommunity.com/profiles/${steamId64}`,
    avatar: null,
    avatarFull: null,
  };
  if (!key) return fallback;

  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId64}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    const json = (await res.json()) as {
      response?: { players?: Array<Record<string, string>> };
    };
    const p = json.response?.players?.[0];
    if (!p) return fallback;
    return {
      steamId64,
      personaName: p.personaname ?? null,
      profileUrl: p.profileurl ?? fallback.profileUrl,
      avatar: p.avatarmedium ?? p.avatar ?? null,
      avatarFull: p.avatarfull ?? null,
    };
  } catch {
    return fallback;
  }
}

export interface ParsedTradeUrl {
  partnerId: string;
  token: string;
}

// Validate + parse a Steam trade offer URL.
export function parseTradeUrl(raw: string): ParsedTradeUrl | null {
  try {
    const url = new URL(raw.trim());
    if (url.hostname !== "steamcommunity.com") return null;
    if (!url.pathname.startsWith("/tradeoffer/new")) return null;
    const partnerId = url.searchParams.get("partner");
    const token = url.searchParams.get("token");
    if (!partnerId || !/^\d+$/.test(partnerId)) return null;
    if (!token || !/^[A-Za-z0-9_-]{6,}$/.test(token)) return null;
    return { partnerId, token };
  } catch {
    return null;
  }
}
