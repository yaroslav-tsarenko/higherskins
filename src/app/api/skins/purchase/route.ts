import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  activeDeliveryProvider,
  computeFees,
  getWalletBalance,
} from "@/lib/skins/delivery";

export const runtime = "nodejs";

// Buy a specific listing. Each error path returns a stable `code` the client
// maps to a tailored message + recovery action.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthenticated", error: "Sign in through Steam to buy." },
      { status: 401 },
    );
  }

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
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "Invalid body" }, { status: 400 });
  }
  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json(
      { code: "bad_request", error: "Missing listing." },
      { status: 400 },
    );
  }

  const listing = await prisma.skinListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      price: true,
      currency: true,
      status: true,
      marketHashName: true,
      skin: { select: { name: true } },
    },
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

  const price = Number(listing.price);
  const fees = computeFees(price);

  if (getWalletBalance() < fees.total) {
    return NextResponse.json(
      {
        code: "insufficient_balance",
        error: "Insufficient balance. Top up your wallet to complete this purchase.",
      },
      { status: 402 },
    );
  }

  // Atomically claim the listing: only succeeds if it is still available,
  // which prevents two buyers racing on the same offer.
  const claimed = await prisma.skinListing.updateMany({
    where: { id: listingId, status: "available" },
    data: { status: "sold" },
  });
  if (claimed.count === 0) {
    return NextResponse.json(
      { code: "sold", error: "This skin was just sold. Pick another offer." },
      { status: 409 },
    );
  }

  let purchase;
  try {
    purchase = await prisma.skinPurchase.create({
      data: {
        listingId: listing.id,
        userId: user.id,
        price: listing.price,
        currency: listing.currency,
        status: "pending",
        tradeUrl: steam.tradeUrl,
      },
      select: { id: true, status: true, createdAt: true },
    });
  } catch {
    // Roll the listing back so it stays purchasable if we couldn't record it.
    await prisma.skinListing
      .updateMany({ where: { id: listingId }, data: { status: "available" } })
      .catch(() => {});
    return NextResponse.json(
      { code: "error", error: "Could not complete the purchase. Try again." },
      { status: 500 },
    );
  }

  // Hand off to the (stubbed) trade-delivery provider. Fire-and-forget: it
  // advances the purchase status in the background.
  void activeDeliveryProvider.deliver({
    purchaseId: purchase.id,
    tradeUrl: steam.tradeUrl,
    marketHashName: listing.marketHashName,
  });

  return NextResponse.json({
    ok: true,
    purchase: {
      id: purchase.id,
      status: purchase.status,
      skinName: listing.skin.name,
      fees,
      currency: listing.currency,
    },
  });
}
