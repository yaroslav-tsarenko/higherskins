import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TransfermitAPI } from "@/lib/payments/transfermit";
import { extractClientIp } from "@/lib/paynt";

export const runtime = "nodejs";

const MIN_TOPUP = 5;
const MAX_TOPUP = 10_000;

// Start a wallet top-up. Amounts are handled in the EUR base currency. We
// create a PENDING ledger entry, hand off to the payment provider, and credit
// the balance only when the provider webhook confirms the deposit.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthenticated", error: "Sign in to top up your wallet." },
      { status: 401 },
    );
  }

  let body: { amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "Invalid body" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    return NextResponse.json(
      { code: "bad_amount", error: `Enter an amount between €${MIN_TOPUP} and €${MAX_TOPUP}.` },
      { status: 400 },
    );
  }

  const address = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  if (!address) {
    return NextResponse.json(
      {
        code: "no_address",
        error: "Add a billing address in your account before topping up.",
      },
      { status: 400 },
    );
  }

  const isPayntConfigured = Boolean(
    process.env.PAYNT_BEARER_TOKEN &&
    process.env.PAYNT_BEARER_TOKEN !== "your_paynt_bearer_token" &&
    process.env.PAYNT_BEARER_TOKEN.trim() !== ""
  );

  const tx = await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      type: "topup",
      status: "pending",
      amount,
      currency: "EUR",
      provider: isPayntConfigured ? "paynt" : "transfermit",
      description: "Wallet top-up",
    },
    select: { id: true },
  });

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = /^https?:\/\//.test(host) ? host : `${proto}://${host}`;
  const clientIp = extractClientIp(request.headers);

  // 1. PayNT Copy & Pay Flow (Primary)
  if (isPayntConfigured) {
    try {
      const { prepareCheckout } = await import("@/lib/paynt");
      const shopperResultUrl = `${baseUrl}/account/wallet?topup=${tx.id}`;

      const payntRes = await prepareCheckout({
        amount,
        currency: "EUR",
        merchantTransactionId: tx.id,
        shopperResultUrl,
        customer: {
          email: user.email || "",
          givenName: user.firstName || address.firstName || "Customer",
          surname: user.lastName || address.lastName || "",
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

      return NextResponse.json({
        ok: true,
        redirectUrl: `/account/wallet/pay?topupId=${tx.id}&checkoutId=${payntRes.checkoutId}&scriptUrl=${encodeURIComponent(payntRes.scriptUrl)}&shopperResultUrl=${encodeURIComponent(shopperResultUrl)}&integrity=${encodeURIComponent(payntRes.integrity || "")}`,
        transactionId: tx.id,
        checkoutId: payntRes.checkoutId,
        scriptUrl: payntRes.scriptUrl,
        shopperResultUrl,
      });
    } catch (e: any) {
      await prisma.walletTransaction
        .update({ where: { id: tx.id }, data: { status: "failed" } })
        .catch(() => {});
      console.error("[PayNT Wallet Top-up] Payment initialization failed:", e);
      return NextResponse.json(
        { code: "provider_error", error: e.message || "Could not initialize payment gateway. Try again shortly." },
        { status: 502 },
      );
    }
  }

  // 2. Transfermit Fallback
  try {
    const api = new TransfermitAPI();
    const res = await api.createPayment({
      amount,
      currency: "EUR",
      referenceId: tx.id,
      customer: {
        referenceId: user.id,
        firstName: user.firstName || address.firstName || "Customer",
        lastName: user.lastName || address.lastName || "",
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
      returnUrl: `${baseUrl}/account/wallet?topup=${tx.id}`,
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

    return NextResponse.json({ ok: true, redirectUrl, transactionId: tx.id });
  } catch (e) {
    await prisma.walletTransaction
      .update({ where: { id: tx.id }, data: { status: "failed" } })
      .catch(() => {});
    console.error("[Wallet Top-up] Payment initialization failed:", e);
    return NextResponse.json(
      { code: "provider_error", error: "Could not start the top-up. Try again shortly." },
      { status: 502 },
    );
  }
}
