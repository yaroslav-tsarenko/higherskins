import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { computeFees } from "@/lib/skins/delivery";
import { prepareCheckout, extractClientIp } from "@/lib/paynt";

export const runtime = "nodejs";

/**
 * Prepares a PayNT / OPPWA checkout for purchasing a skin listing with a card.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { code: "unauthenticated", error: "Sign in through Steam to buy." },
        { status: 401 }
      );
    }

    const steam = user.steamAccount;
    if (!steam) {
      return NextResponse.json(
        { code: "no_steam", error: "Link your Steam account first." },
        { status: 400 }
      );
    }
    if (!steam.tradeUrlVerified || !steam.tradeUrl) {
      return NextResponse.json(
        { code: "no_trade_url", error: "Add your Steam trade URL to receive the item." },
        { status: 400 }
      );
    }

    let body: { listingId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { code: "bad_request", error: "Invalid request body." },
        { status: 400 }
      );
    }

    const listingId = body.listingId?.trim();
    if (!listingId) {
      return NextResponse.json(
        { code: "bad_request", error: "Missing listing ID." },
        { status: 400 }
      );
    }

    const listing = await prisma.skinListing.findUnique({
      where: { id: listingId },
      include: { skin: true },
    });

    if (!listing) {
      return NextResponse.json(
        { code: "not_found", error: "This offer no longer exists." },
        { status: 404 }
      );
    }

    if (listing.status !== "available" && listing.status !== "reserved") {
      return NextResponse.json(
        { code: "sold", error: "This skin was just sold. Pick another offer." },
        { status: 409 }
      );
    }

    // Check if there is an existing purchase for this listing
    const existingPurchase = await prisma.skinPurchase.findUnique({
      where: { listingId: listing.id },
    });

    if (existingPurchase && existingPurchase.status === "completed") {
      return NextResponse.json(
        { code: "sold", error: "This skin has already been purchased." },
        { status: 409 }
      );
    }

    // Calculate total price in EUR
    const price = Number(listing.price);
    const fees = computeFees(price);
    const totalEur = fees.total;

    // Create or reuse pending SkinPurchase
    let purchase = existingPurchase;
    if (!purchase) {
      purchase = await prisma.skinPurchase.create({
        data: {
          listingId: listing.id,
          userId: user.id,
          price: listing.price,
          currency: listing.currency,
          status: "pending",
          tradeUrl: steam.tradeUrl,
        },
      });
    } else {
      purchase = await prisma.skinPurchase.update({
        where: { id: purchase.id },
        data: {
          userId: user.id,
          status: "pending",
          tradeUrl: steam.tradeUrl,
        },
      });
    }

    // Temporarily mark listing as reserved during checkout
    await prisma.skinListing.update({
      where: { id: listing.id },
      data: { status: "reserved" },
    });

    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "localhost:1011";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = /^https?:\/\//.test(host) ? host : `${proto}://${host}`;
    const clientIp = extractClientIp(req.headers);

    const shopperResultUrl = `${baseUrl}/skin/${listing.skinId}?listing=${listing.id}&purchaseId=${purchase.id}`;

    const address = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

    const payntRes = await prepareCheckout({
      amount: totalEur,
      currency: "EUR",
      merchantTransactionId: purchase.id,
      shopperResultUrl,
      customer: {
        email: user.email || "",
        givenName: user.firstName || address?.firstName || "Customer",
        surname: user.lastName || address?.lastName || "",
        phone: user.phone || undefined,
        ip: clientIp,
      },
      billing: address
        ? {
            street1: address.address1,
            street2: address.address2 || undefined,
            city: address.city,
            postcode: address.postalCode,
            country: address.country,
            state: address.province || undefined,
          }
        : undefined,
    });

    return NextResponse.json({
      ok: true,
      purchaseId: purchase.id,
      checkoutId: payntRes.checkoutId,
      scriptUrl: payntRes.scriptUrl,
      integrity: payntRes.integrity,
      shopperResultUrl: payntRes.shopperResultUrl,
      total: totalEur,
      skinName: listing.skin.name,
    });
  } catch (err: any) {
    console.error("[PayNT Skin Purchase Prepare Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initialize payment gateway." },
      { status: 500 }
    );
  }
}
