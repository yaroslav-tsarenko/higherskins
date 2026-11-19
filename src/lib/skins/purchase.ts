import { prisma } from "@/lib/prisma";
import {
  activeDeliveryProvider,
  computeFees,
  getWalletBalance,
  type FeeBreakdown,
} from "@/lib/skins/delivery";

export type PurchaseErrorCode =
  | "no_steam"
  | "no_trade_url"
  | "not_found"
  | "sold"
  | "insufficient_balance"
  | "error";

export type PurchaseResult =
  | {
      ok: true;
      purchase: {
        id: string;
        status: string;
        skinName: string;
        fees: FeeBreakdown;
        currency: string;
      };
    }
  | { ok: false; code: PurchaseErrorCode; error: string; status: number };

const fail = (code: PurchaseErrorCode, error: string, status: number): PurchaseResult => ({
  ok: false,
  code,
  error,
  status,
});

// Buys a listing from the user's wallet balance and hands it to trade
// delivery. Shared by the "pay from balance" route and by card payments, which
// top up the wallet first and then call this once the payment clears.
export async function purchaseListing(userId: string, listingId: string): Promise<PurchaseResult> {
  const steam = await prisma.steamAccount.findUnique({ where: { userId } });
  if (!steam) {
    return fail("no_steam", "Link your Steam account first.", 400);
  }
  if (!steam.tradeUrlVerified || !steam.tradeUrl) {
    return fail("no_trade_url", "Add your Steam trade URL to receive the item.", 400);
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
    return fail("not_found", "This offer no longer exists.", 404);
  }
  if (listing.status !== "available") {
    return fail("sold", "This skin was just sold. Pick another offer.", 409);
  }

  const fees = computeFees(Number(listing.price));

  if ((await getWalletBalance(userId)) < fees.total) {
    return fail(
      "insufficient_balance",
      "Insufficient balance. Top up your wallet to complete this purchase.",
      402,
    );
  }

  // Atomically claim the listing: only succeeds if it is still available,
  // which prevents two buyers racing on the same offer.
  const claimed = await prisma.skinListing.updateMany({
    where: { id: listingId, status: "available" },
    data: { status: "sold" },
  });
  if (claimed.count === 0) {
    return fail("sold", "This skin was just sold. Pick another offer.", 409);
  }

  // Atomically debit the wallet: the `balance >= total` guard prevents a race
  // where two concurrent purchases both pass the check above and overspend.
  const debited = await prisma.user.updateMany({
    where: { id: userId, balance: { gte: fees.total } },
    data: { balance: { decrement: fees.total } },
  });
  if (debited.count === 0) {
    await prisma.skinListing
      .updateMany({ where: { id: listingId }, data: { status: "available" } })
      .catch(() => {});
    return fail(
      "insufficient_balance",
      "Insufficient balance. Top up your wallet to complete this purchase.",
      402,
    );
  }

  let purchase;
  try {
    purchase = await prisma.skinPurchase.create({
      data: {
        listingId: listing.id,
        userId,
        price: listing.price,
        currency: listing.currency,
        status: "pending",
        tradeUrl: steam.tradeUrl,
      },
      select: { id: true, status: true, createdAt: true },
    });
    await prisma.walletTransaction.create({
      data: {
        userId,
        type: "purchase",
        status: "completed",
        amount: -fees.total,
        currency: "EUR",
        description: listing.skin.name,
      },
    });
  } catch {
    // Roll everything back so the listing stays purchasable and the buyer is
    // not charged if we couldn't record the purchase.
    await prisma.skinListing
      .updateMany({ where: { id: listingId }, data: { status: "available" } })
      .catch(() => {});
    await prisma.user
      .update({ where: { id: userId }, data: { balance: { increment: fees.total } } })
      .catch(() => {});
    return fail("error", "Could not complete the purchase. Try again.", 500);
  }

  // Hand off to the (stubbed) trade-delivery provider. Fire-and-forget: it
  // advances the purchase status in the background.
  void activeDeliveryProvider.deliver({
    purchaseId: purchase.id,
    tradeUrl: steam.tradeUrl,
    marketHashName: listing.marketHashName,
    steamId64: steam.steamId64,
    tradeToken: steam.tradeToken ?? undefined,
  });

  return {
    ok: true,
    purchase: {
      id: purchase.id,
      status: purchase.status,
      skinName: listing.skin.name,
      fees,
      currency: listing.currency,
    },
  };
}
