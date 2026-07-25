import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseTradeUrl } from "@/lib/steam";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const steam = await prisma.steamAccount.findUnique({ where: { userId: user.id } });
  if (!steam) {
    return NextResponse.json(
      { error: "Link your Steam account first" },
      { status: 400 },
    );
  }

  let body: { tradeUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = body.tradeUrl ? parseTradeUrl(body.tradeUrl) : null;
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid Steam trade URL. Copy it from Steam → Inventory → Trade Offers." },
      { status: 400 },
    );
  }

  // The `partner` in a trade URL is the 32-bit account ID; it must resolve to
  // this user's own SteamID64 (base + accountId). This blocks pasting someone
  // else's trade URL.
  const STEAMID64_BASE = BigInt("76561197960265728");
  const expectedPartner = (BigInt(steam.steamId64) - STEAMID64_BASE).toString();
  if (parsed.partnerId !== expectedPartner) {
    return NextResponse.json(
      { error: "This trade URL belongs to a different Steam account. Use your own." },
      { status: 400 },
    );
  }

  await prisma.steamAccount.update({
    where: { userId: user.id },
    data: {
      tradeUrl: body.tradeUrl!.trim(),
      tradePartnerId: parsed.partnerId,
      tradeToken: parsed.token,
      tradeUrlVerified: true,
    },
  });

  return NextResponse.json({ ok: true, verified: true });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const steam = await prisma.steamAccount.findUnique({
    where: { userId: user.id },
    select: {
      steamId64: true,
      personaName: true,
      avatar: true,
      tradeUrl: true,
      tradeUrlVerified: true,
    },
  });
  return NextResponse.json({ steam });
}
