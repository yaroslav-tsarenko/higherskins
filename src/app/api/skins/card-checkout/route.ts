import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { extractClientIp } from "@/lib/paynt";
import { computeFees } from "@/lib/skins/delivery";
import { requestBaseUrl, startCardPayment } from "@/lib/wallet";

export const runtime = "nodejs";

// Pay for a listing directly by card, without a pre-funded wallet. The card
// payment is recorded as a top-up tied to the listing; once the provider
// confirms it, settleTopup() buys the listing with the cleared funds.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthenticated", error: "Sign in to buy." },
      { status: 401 },
    );
  }

  // Run the delivery prerequisites before charging, so a card is never billed
  // for an item we already know we can't send.
  const steam = user.steamAccount;
  if (!steam) {
    return NextResponse.json(
      { code: "no_steam", error: "Link your Steam account first." },
      { status: 400 },
    );
  }
  if (!steam.tradeUrlVerified || !steam.tradeUrl) {
    return NextResponse.json(
      { code: "no_trade_url", error: "Add your Steam trade URL to receive the item." },
      { status: 400 },
    );
  }

  let body: { listingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "Invalid body" }, { status: 400 });
  }
  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json({ code: "bad_request", error: "Missing listing." }, { status: 400 });
  }

  const listing = await prisma.skinListing.findUnique({
    where: { id: listingId },
    select: { id: true, price: true, status: true, skin: { select: { name: true } } },
  });
  if (!listing) {
    return NextResponse.json(
      { code: "not_found", error: "This offer no longer exists." },
      { status: 404 },
    );
  }
  if (listing.status !== "available") {
    return NextResponse.json(
      { code: "sold", error: "This skin was just sold. Pick another offer." },
      { status: 409 },
    );
  }

  const fees = computeFees(Number(listing.price));
  const result = await startCardPayment({
    user,
    amount: fees.total,
    description: `Card payment — ${listing.skin.name}`,
    listingId: listing.id,
    baseUrl: requestBaseUrl(request.headers),
    clientIp: extractClientIp(request.headers),
  });
  if (!result.ok) {
    return NextResponse.json({ code: result.code, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    ok: true,
    redirectUrl: result.redirectUrl,
    paynt: "paynt" in result ? result.paynt : undefined,
  });
}
