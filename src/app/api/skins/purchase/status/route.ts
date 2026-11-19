import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getPaymentStatus, isPaymentSuccessful } from "@/lib/paynt";
import { activeDeliveryProvider, computeFees } from "@/lib/skins/delivery";

export const runtime = "nodejs";

/**
 * Checks and confirms PayNT transaction status for a skin purchase.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const resourcePath = searchParams.get("resourcePath");
    const purchaseId = searchParams.get("purchaseId");

    if (!resourcePath || !purchaseId) {
      return NextResponse.json({ error: "Missing resourcePath or purchaseId" }, { status: 400 });
    }

    const purchase = await prisma.skinPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        listing: { include: { skin: true } },
        user: { include: { steamAccount: true } },
      },
    });

    if (!purchase || purchase.userId !== user.id) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // If already marked completed or trade_sent, return success idempotently
    if (purchase.status === "completed" || purchase.status === "trade_sent") {
      return NextResponse.json({
        success: true,
        purchaseId: purchase.id,
        skinName: purchase.listing.skin.name,
        status: purchase.status,
      });
    }

    const status = await getPaymentStatus(resourcePath);
    const success = isPaymentSuccessful(status.result?.code);

    if (success) {
      const price = Number(purchase.listing.price);
      const fees = computeFees(price);

      await prisma.$transaction([
        prisma.skinPurchase.update({
          where: { id: purchase.id },
          data: { status: "completed" },
        }),
        prisma.skinListing.update({
          where: { id: purchase.listingId },
          data: { status: "sold" },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: user.id,
            type: "purchase",
            status: "completed",
            amount: -fees.total,
            currency: "EUR",
            provider: "paynt",
            paymentId: status.id,
            description: `${purchase.listing.skin.name} (Card payment)`,
          },
        }),
      ]);

      // Fire-and-forget Steam delivery
      if (purchase.user.steamAccount?.tradeUrl) {
        void activeDeliveryProvider.deliver({
          purchaseId: purchase.id,
          tradeUrl: purchase.user.steamAccount.tradeUrl,
          marketHashName: purchase.listing.marketHashName,
          steamId64: purchase.user.steamAccount.steamId64,
          tradeToken: purchase.user.steamAccount.tradeToken ?? undefined,
        });
      }

      return NextResponse.json({
        success: true,
        purchaseId: purchase.id,
        skinName: purchase.listing.skin.name,
        paymentBrand: status.paymentBrand,
        cardLast4: status.card?.last4Digits,
      });
    } else {
      // Payment declined or cancelled: restore listing status to available
      await prisma.skinListing.update({
        where: { id: purchase.listingId },
        data: { status: "available" },
      }).catch(() => {});
      await prisma.skinPurchase.update({
        where: { id: purchase.id },
        data: { status: "failed" },
      }).catch(() => {});

      return NextResponse.json({
        success: false,
        error: status.result?.description || "Payment was not successful.",
        code: status.result?.code,
      });
    }
  } catch (err: any) {
    console.error("[PayNT Skin Purchase Status Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify payment status" },
      { status: 500 }
    );
  }
}
