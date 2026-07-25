// Pluggable trade-delivery layer. A real integration would drive a Steam bot
// (node-steam-user / steam-tradeoffer-manager) to send the trade offer and poll
// for acceptance. We ship a deterministic stub so the buy flow is fully
// exercisable in dev without Steam credentials. Swap `activeDeliveryProvider`
// for a real implementation without touching callers.

import { prisma } from "@/lib/prisma";

export type PurchaseStatus = "pending" | "trade_sent" | "completed" | "failed";

export interface DeliveryRequest {
  purchaseId: string;
  tradeUrl: string;
  marketHashName: string;
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

export const activeDeliveryProvider: TradeDeliveryProvider =
  new StubDeliveryProvider();

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

// Stubbed wallet balance. No wallet model exists yet, so we grant a large
// simulated balance — enough for the golden path — while keeping the
// insufficient-funds branch reachable for very high-value items.
export const STUB_WALLET_BALANCE = 1_000_000;

export function getWalletBalance(): number {
  return STUB_WALLET_BALANCE;
}
