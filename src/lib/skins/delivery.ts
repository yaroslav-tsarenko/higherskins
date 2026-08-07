// Pluggable trade-delivery layer. A real integration would drive a Steam bot
// (node-steam-user / steam-tradeoffer-manager) to send the trade offer and poll
// for acceptance. We ship a deterministic stub so the buy flow is fully
// exercisable in dev without Steam credentials. Swap `activeDeliveryProvider`
// for a real implementation without touching callers.

import { prisma } from "@/lib/prisma";
import {
  createOrder,
  getMinItem,
  getOrder,
  sihConfigured,
  sihLiveMode,
  SihError,
  type SihOrderStatus,
} from "@/lib/sih/client";

export type PurchaseStatus = "pending" | "trade_sent" | "completed" | "failed";

export interface DeliveryRequest {
  purchaseId: string;
  tradeUrl: string;
  marketHashName: string;
  // Present once the buyer has a verified Steam trade URL. Required by the SIH
  // provider; the stub ignores them.
  steamId64?: string;
  tradeToken?: string;
}

export interface TradeDeliveryProvider {
  name: string;
  // Kick off delivery for a purchase. Implementations should transition the
  // purchase status over its lifecycle (pending → trade_sent → completed/failed).
  deliver(req: DeliveryRequest): Promise<void>;
}

async function setStatus(purchaseId: string, status: PurchaseStatus) {
  await prisma.skinPurchase
    .update({ where: { id: purchaseId }, data: { status } })
    .catch(() => {});
}

// Simulates a Steam bot: sends the offer shortly after purchase, then marks it
// completed as if the buyer accepted. Timers are fire-and-forget in dev.
class StubDeliveryProvider implements TradeDeliveryProvider {
  name = "stub";

  async deliver(req: DeliveryRequest): Promise<void> {
    // Offer "sent" almost immediately.
    setTimeout(() => {
      void setStatus(req.purchaseId, "trade_sent");
      // Buyer "accepts" a few seconds later.
      setTimeout(() => void setStatus(req.purchaseId, "completed"), 6000);
    }, 1500);
  }
}

// Refunds a failed delivery: returns the item to the market, credits the
// buyer's wallet back, and records the reversal. Idempotent — only a purchase
// that is not already failed/refunded is reversed, guarded by updateMany count.
async function refundPurchase(purchaseId: string) {
  const purchase = await prisma.skinPurchase
    .findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        userId: true,
        listingId: true,
        price: true,
        status: true,
        listing: { select: { skin: { select: { name: true } } } },
      },
    })
    .catch(() => null);
  if (!purchase || purchase.status === "failed") return;

  const marked = await prisma.skinPurchase.updateMany({
    where: { id: purchaseId, status: { not: "failed" } },
    data: { status: "failed" },
  });
  if (marked.count === 0) return; // already reversed by a concurrent run

  const amount = Number(purchase.price);
  await prisma.$transaction([
    prisma.skinListing.updateMany({
      where: { id: purchase.listingId },
      data: { status: "available" },
    }),
    prisma.user.update({
      where: { id: purchase.userId },
      data: { balance: { increment: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        userId: purchase.userId,
        type: "refund",
        status: "completed",
        amount,
        currency: "EUR",
        description: `Refund — ${purchase.listing?.skin?.name ?? "skin"} could not be delivered`,
      },
    }),
  ]);
}

// Maps SIH's order lifecycle onto our purchase status.
function mapSihStatus(status: SihOrderStatus): PurchaseStatus | "refund" {
  switch (status) {
    case "created":
    case "processing":
      return "pending";
    case "sent":
      return "trade_sent";
    case "finished":
      return "completed";
    case "failed":
    case "penalized":
      return "refund";
  }
}

const SIH_POLL_INTERVAL_MS = 5000;
const SIH_POLL_MAX_ATTEMPTS = 60; // ~5 minutes

// Fulfils a purchase through SIH: places the order against the buyer's Steam
// trade URL, then polls the order until it settles. On any terminal failure the
// buyer is refunded. Runs live only when SIH_LIVE=1; otherwise SIH simulates.
class SihDeliveryProvider implements TradeDeliveryProvider {
  name = "sih";

  async deliver(req: DeliveryRequest): Promise<void> {
    if (!req.steamId64 || !req.tradeToken) {
      await refundPurchase(req.purchaseId);
      return;
    }

    try {
      const min = await getMinItem(req.marketHashName);
      if (!min || min.count < 1) {
        // Out of stock on SIH — nothing to deliver.
        await refundPurchase(req.purchaseId);
        return;
      }

      const order = await createOrder({
        steamId: req.steamId64,
        token: req.tradeToken,
        amount: min.price,
        item: req.marketHashName,
        customId: req.purchaseId,
        test: !sihLiveMode(),
      });

      await prisma.skinPurchase
        .update({
          where: { id: req.purchaseId },
          data: { provider: "sih", providerOrderId: String(order.id), status: "pending" },
        })
        .catch(() => {});

      void this.poll(req.purchaseId);
    } catch (err) {
      if (err instanceof SihError) {
        // create-order rejected (invalid tradelink, private inventory, steam
        // guard off, trade ban…). Refund and surface nothing to the buyer here.
        await refundPurchase(req.purchaseId);
        return;
      }
      // Transient/network error: leave the purchase pending for a later reconcile.
    }
  }

  private async poll(purchaseId: string): Promise<void> {
    for (let attempt = 0; attempt < SIH_POLL_MAX_ATTEMPTS; attempt++) {
      await delay(SIH_POLL_INTERVAL_MS);
      const settled = await reconcilePurchase(purchaseId).catch(() => false);
      if (settled) return;
    }
  }
}

// Polls SIH once for a purchase and advances its status. Returns true when the
// purchase has reached a terminal state (completed or refunded). Safe to call
// from a cron to reconcile purchases left pending after a cold start.
export async function reconcilePurchase(purchaseId: string): Promise<boolean> {
  const purchase = await prisma.skinPurchase
    .findUnique({
      where: { id: purchaseId },
      select: { id: true, providerOrderId: true, status: true },
    })
    .catch(() => null);
  if (!purchase || !purchase.providerOrderId) return true;
  if (purchase.status === "completed" || purchase.status === "failed") return true;

  const order = await getOrder({ id: Number(purchase.providerOrderId) }).catch(() => null);
  if (!order) return false;

  const next = mapSihStatus(order.status);
  if (next === "refund") {
    await refundPurchase(purchaseId);
    return true;
  }
  if (next !== purchase.status) {
    await setStatus(purchaseId, next);
  }
  return next === "completed";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Use the real SIH provider whenever an API key is configured; fall back to the
// deterministic stub for local dev without SIH credentials.
export const activeDeliveryProvider: TradeDeliveryProvider = sihConfigured()
  ? new SihDeliveryProvider()
  : new StubDeliveryProvider();

// ── Fee model ────────────────────────────────────────────────────────────
// Buyers pay the listed price; buyer protection is included at no extra cost.
// Keeping this in one place makes it trivial to introduce a real fee later.
export interface FeeBreakdown {
  itemPrice: number;
  serviceFee: number;
  total: number;
}

export function computeFees(itemPrice: number): FeeBreakdown {
  const serviceFee = 0;
  return {
    itemPrice: round2(itemPrice),
    serviceFee: round2(serviceFee),
    total: round2(itemPrice + serviceFee),
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Wallet balance, held in the EUR base currency on the User record. Top-ups
// credit it via the payment provider; purchases debit it (see below).
export async function getWalletBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });
  return user ? Number(user.balance) : 0;
}
