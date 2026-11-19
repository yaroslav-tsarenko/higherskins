import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getPaymentStatus, isPaymentPending, isPaymentSuccessful } from "@/lib/paynt";
import { settleTopup } from "@/lib/wallet";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendOrderConfirmationEmail, sendOrderInvoiceEmail } from "@/lib/email";
import { activeDeliveryProvider, computeFees } from "@/lib/skins/delivery";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.PAYNT_WEBHOOK_SECRET?.trim();

    // 1. Signature Verification (if secret configured)
    if (webhookSecret) {
      const signature =
        request.headers.get("x-signature") ||
        request.headers.get("signature") ||
        request.headers.get("Signature");

      if (signature) {
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(rawBody)
          .digest("hex");

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);

        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          console.error("[PayNT Webhook] Invalid signature");
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // OPPWA might send urlencoded webhook in some configurations
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    }

    console.log("[PayNT Webhook] Received payload:", payload);

    let resultCode = payload.result?.code;
    let merchantTransactionId = payload.merchantTransactionId;
    let paymentId = payload.id;
    const resourcePath = payload.resourcePath || payload.payload?.resourcePath;

    // If payload contains resourcePath, query latest status from gateway
    if (resourcePath && (!resultCode || !merchantTransactionId)) {
      try {
        const status = await getPaymentStatus(resourcePath);
        resultCode = status.result?.code;
        merchantTransactionId = status.merchantTransactionId || merchantTransactionId;
        paymentId = status.id || paymentId;
      } catch (err) {
        console.error("[PayNT Webhook] Error fetching status from resourcePath:", err);
      }
    }

    if (!merchantTransactionId) {
      console.warn("[PayNT Webhook] Missing merchantTransactionId in payload");
      return NextResponse.json({ ok: true, note: "Ignored, no merchantTransactionId" });
    }

    const isSuccess = isPaymentSuccessful(resultCode);

    // 2. Check if this is a Wallet Top-up (incl. direct card purchases of a skin)
    if (isPaymentPending(resultCode)) {
      return NextResponse.json({ ok: true, note: "Payment still pending" });
    }
    const settled = await settleTopup(
      merchantTransactionId,
      isSuccess ? "completed" : "failed",
      paymentId,
    );
    if (settled.found) {
      console.log(
        `[PayNT Webhook] Top-up ${merchantTransactionId}: ${isSuccess ? "success" : "failed"}, credited=${settled.credited}`,
      );
      return NextResponse.json({ ok: true });
    }

    // 3. Check if this is an Order
    const order = await prisma.order.findUnique({
      where: { id: merchantTransactionId },
      include: { items: true },
    });

    if (!order) {
      // 4. Check if this is a SkinPurchase
      const skinPurchase = await prisma.skinPurchase.findUnique({
        where: { id: merchantTransactionId },
        include: {
          listing: { include: { skin: true } },
          user: { include: { steamAccount: true } },
        },
      });

      if (skinPurchase) {
        if (skinPurchase.status === "completed" || skinPurchase.status === "trade_sent") {
          return NextResponse.json({ ok: true, note: "Skin purchase already processed" });
        }

        if (isSuccess) {
          const price = Number(skinPurchase.listing.price);
          const fees = computeFees(price);

          await prisma.$transaction([
            prisma.skinPurchase.update({
              where: { id: skinPurchase.id },
              data: { status: "completed" },
            }),
            prisma.skinListing.update({
              where: { id: skinPurchase.listingId },
              data: { status: "sold" },
            }),
            prisma.walletTransaction.create({
              data: {
                userId: skinPurchase.userId,
                type: "purchase",
                status: "completed",
                amount: -fees.total,
                currency: "EUR",
                provider: "paynt",
                paymentId,
                description: `${skinPurchase.listing.skin.name} (Card payment)`,
              },
            }),
          ]);

          if (skinPurchase.user.steamAccount?.tradeUrl) {
            void activeDeliveryProvider.deliver({
              purchaseId: skinPurchase.id,
              tradeUrl: skinPurchase.user.steamAccount.tradeUrl,
              marketHashName: skinPurchase.listing.marketHashName,
              steamId64: skinPurchase.user.steamAccount.steamId64,
              tradeToken: skinPurchase.user.steamAccount.tradeToken ?? undefined,
            });
          }

          console.log(`[PayNT Webhook] Skin purchase ${skinPurchase.id} completed and delivery initiated`);
        } else {
          await prisma.skinListing.update({
            where: { id: skinPurchase.listingId },
            data: { status: "available" },
          }).catch(() => {});
          await prisma.skinPurchase.update({
            where: { id: skinPurchase.id },
            data: { status: "failed" },
          }).catch(() => {});
          console.log(`[PayNT Webhook] Skin purchase ${skinPurchase.id} failed, listing returned to available`);
        }

        return NextResponse.json({ ok: true });
      }

      console.warn(`[PayNT Webhook] No order, walletTx or skinPurchase found for ID: ${merchantTransactionId}`);
      return NextResponse.json({ ok: true, note: "No matching record" });
    }

    // Idempotency check: if already paid/confirmed, do nothing
    if (order.paymentStatus === "PAID" || order.status === "CONFIRMED") {
      return NextResponse.json({ ok: true, note: "Order already confirmed" });
    }

    if (isSuccess) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentId: paymentId || order.paymentId,
        },
        include: { items: true },
      });

      const emailPayload = {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        customerEmail: updatedOrder.customerEmail,
        items: updatedOrder.items,
        subtotal: updatedOrder.subtotal,
        taxAmount: updatedOrder.taxAmount,
        shippingCost: updatedOrder.shippingCost,
        discountAmount: updatedOrder.discountAmount,
        total: updatedOrder.total,
        shippingMethod: updatedOrder.shippingMethod || "standard",
        shippingAddress: updatedOrder.shippingAddress as any,
        createdAt: updatedOrder.createdAt,
      };

      scheduleEmail(`order confirmation ${updatedOrder.orderNumber}`, () =>
        sendOrderConfirmationEmail(emailPayload)
      );
      scheduleEmail(`order invoice ${updatedOrder.orderNumber}`, () =>
        sendOrderInvoiceEmail(emailPayload)
      );

      console.log(`[PayNT Webhook] Order ${order.id} marked PAID and confirmed`);
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      });

      // Restore product stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      console.log(`[PayNT Webhook] Order ${order.id} payment failed. Stock restored.`);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[PayNT Webhook Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal webhook error" },
      { status: 500 }
    );
  }
}
