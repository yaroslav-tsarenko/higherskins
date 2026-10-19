import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getPaymentStatus, isPaymentSuccessful } from "@/lib/paynt";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendOrderConfirmationEmail, sendOrderInvoiceEmail } from "@/lib/email";

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

    // 2. Check if this is a Wallet Top-up
    const walletTx = await prisma.walletTransaction.findUnique({
      where: { id: merchantTransactionId },
    });

    if (walletTx) {
      if (walletTx.status === "completed") {
        return NextResponse.json({ ok: true, note: "Wallet transaction already processed" });
      }

      if (isSuccess) {
        await prisma.$transaction([
          prisma.walletTransaction.update({
            where: { id: walletTx.id },
            data: { status: "completed", paymentId },
          }),
          prisma.user.update({
            where: { id: walletTx.userId },
            data: { balance: { increment: walletTx.amount } },
          }),
        ]);
        console.log(`[PayNT Webhook] Credited wallet top-up ${walletTx.id} (+€${walletTx.amount})`);
      } else {
        await prisma.walletTransaction.update({
          where: { id: walletTx.id },
          data: { status: "failed", paymentId },
        });
        console.log(`[PayNT Webhook] Wallet top-up ${walletTx.id} marked as failed`);
      }

      return NextResponse.json({ ok: true });
    }

    // 3. Check if this is an Order
    const order = await prisma.order.findUnique({
      where: { id: merchantTransactionId },
      include: { items: true },
    });

    if (!order) {
      console.warn(`[PayNT Webhook] No order or walletTx found for ID: ${merchantTransactionId}`);
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
