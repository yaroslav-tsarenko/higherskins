import { prisma } from "@/lib/prisma";
import { TransfermitAPI } from "@/lib/payments/transfermit";
import { purchaseListing, type PurchaseResult } from "@/lib/skins/purchase";

type Address = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  postalCode: string;
  country: string;
  province: string | null;
  isDefault: boolean;
};

export interface CardPaymentUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  addresses: Address[];
}

export type StartCardPaymentResult =
  | {
      ok: true;
      redirectUrl: string;
      transactionId: string;
      paynt?: {
        checkoutId: string;
        scriptUrl: string;
        integrity: string;
        shopperResultUrl: string;
        amount: number;
        currency: string;
      };
    }
  | { ok: false; code: "no_address" | "provider_error"; error: string; status: number };

export function isPayntConfigured(): boolean {
  const token = process.env.PAYNT_BEARER_TOKEN?.trim();
  return Boolean(token && token !== "your_paynt_bearer_token");
}

// Starts a card payment that credits the wallet. Amounts are in the EUR base
// currency. We create a PENDING ledger entry, hand off to the payment provider,
// and credit the balance only once the provider confirms (see settleTopup).
// With `listingId` set, the cleared funds are immediately spent on that listing.
export async function startCardPayment({
  user,
  amount,
  description,
  listingId,
  baseUrl,
  clientIp,
}: {
  user: CardPaymentUser;
  amount: number;
  description: string;
  listingId?: string;
  baseUrl: string;
  clientIp: string;
}): Promise<StartCardPaymentResult> {
  const address = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  if (!address) {
    return {
      ok: false,
      code: "no_address",
      error: "Add a billing address in your account before paying by card.",
      status: 400,
    };
  }

  const usePaynt = isPayntConfigured();
  const tx = await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      type: "topup",
      status: "pending",
      amount,
      currency: "EUR",
      provider: usePaynt ? "paynt" : "transfermit",
      description,
      listingId: listingId ?? null,
    },
    select: { id: true },
  });

  const returnUrl = `${baseUrl}/account/wallet?topup=${tx.id}`;
  const givenName = user.firstName || address.firstName || "Customer";
  const surname = user.lastName || address.lastName || "";

  try {
    // 1. PayNT Copy & Pay flow (primary)
    if (usePaynt) {
      const { prepareCheckout } = await import("@/lib/paynt");
      const payntRes = await prepareCheckout({
        amount,
        currency: "EUR",
        merchantTransactionId: tx.id,
        shopperResultUrl: returnUrl,
        customer: {
          email: user.email || "",
          givenName,
          surname,
          phone: user.phone || undefined,
          ip: clientIp,
        },
        billing: {
          street1: address.address1,
          street2: address.address2 || undefined,
          city: address.city,
          postcode: address.postalCode,
          country: address.country,
          state: address.province || undefined,
        },
      });

      await prisma.walletTransaction.update({
        where: { id: tx.id },
        data: { paymentId: payntRes.checkoutId },
      });

      const params = new URLSearchParams({
        topupId: tx.id,
        checkoutId: payntRes.checkoutId,
        scriptUrl: payntRes.scriptUrl,
        shopperResultUrl: returnUrl,
        integrity: payntRes.integrity || "",
      });
      return {
        ok: true,
        redirectUrl: `/account/wallet/pay?${params}`,
        transactionId: tx.id,
        paynt: {
          checkoutId: payntRes.checkoutId,
          scriptUrl: payntRes.scriptUrl,
          integrity: payntRes.integrity || "",
          shopperResultUrl: returnUrl,
          amount,
          currency: "EUR",
        },
      };
    }

    // 2. Transfermit fallback
    const res = await new TransfermitAPI().createPayment({
      amount,
      currency: "EUR",
      referenceId: tx.id,
      customer: {
        referenceId: user.id,
        firstName: givenName,
        lastName: surname,
        email: user.email || "",
        phone: user.phone || undefined,
        ip: clientIp,
      },
      billingAddress: {
        addressLine1: address.address1,
        addressLine2: address.address2 || undefined,
        city: address.city,
        countryCode: address.country,
        postalCode: address.postalCode,
        state: address.province || undefined,
      },
      returnUrl,
      webhookUrl: `${baseUrl}/api/webhooks/transfermit`,
    });

    const redirectUrl = res.result?.redirectUrl;
    if (!res.result || !redirectUrl) {
      throw new Error("Provider did not return a redirect URL.");
    }

    await prisma.walletTransaction.update({
      where: { id: tx.id },
      data: { paymentId: res.result.id },
    });

    return { ok: true, redirectUrl, transactionId: tx.id };
  } catch (e) {
    await prisma.walletTransaction
      .update({ where: { id: tx.id }, data: { status: "failed" } })
      .catch(() => {});
    console.error("[Card payment] Payment initialization failed:", e);
    return {
      ok: false,
      code: "provider_error",
      error: "Could not start the card payment. Try again shortly.",
      status: 502,
    };
  }
}

export interface SettleResult {
  found: boolean;
  credited: boolean;
  purchase?: PurchaseResult;
}

// Applies a provider's verdict to a pending top-up. Safe to call from both the
// webhook and the shopper's return page: the conditional status update lets
// exactly one caller credit the balance. A "failed" top-up can still be
// credited if the provider later reports success, since the card was charged.
export async function settleTopup(
  txId: string,
  outcome: "completed" | "failed",
  paymentId?: string | null,
): Promise<SettleResult> {
  const tx = await prisma.walletTransaction.findUnique({ where: { id: txId } });
  if (!tx || tx.type !== "topup") return { found: Boolean(tx), credited: false };

  if (outcome === "failed") {
    await prisma.walletTransaction.updateMany({
      where: { id: tx.id, status: "pending" },
      data: { status: "failed", paymentId: paymentId || tx.paymentId },
    });
    return { found: true, credited: false };
  }

  const credited = await prisma.$transaction(async (db) => {
    const marked = await db.walletTransaction.updateMany({
      where: { id: tx.id, status: { in: ["pending", "failed"] } },
      data: { status: "completed", paymentId: paymentId || tx.paymentId },
    });
    if (marked.count === 0) return false;
    await db.user.update({
      where: { id: tx.userId },
      data: { balance: { increment: tx.amount } },
    });
    return true;
  });

  if (!credited || !tx.listingId) return { found: true, credited };

  // Direct card purchase: spend the funds on the listing right away. If it
  // can't go through (e.g. sold meanwhile), the money stays in the wallet.
  const purchase = await purchaseListing(tx.userId, tx.listingId);
  if (!purchase.ok) {
    console.warn(
      `[Card payment] Top-up ${tx.id} credited but purchase of ${tx.listingId} failed: ${purchase.code}`,
    );
  }
  return { found: true, credited, purchase };
}

// Public origin of the current request, used to build provider return URLs.
export function requestBaseUrl(headers: Headers): string {
  const host =
    headers.get("x-forwarded-host") ||
    headers.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || "https";
  return /^https?:\/\//.test(host) ? host : `${proto}://${host}`;
}
