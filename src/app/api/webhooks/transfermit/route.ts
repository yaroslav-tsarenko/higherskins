import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.TRANSFERMIT_WEBHOOK_SECRET;
    const rawBody = await request.text();

    if (webhookSecret && webhookSecret !== "your_webhook_secret_here" && webhookSecret.trim() !== "") {
      const signature = request.headers.get("signature") || request.headers.get("Signature");
      if (!signature) {
        console.error("[Transfermit Webhook] Missing signature header");
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const signatureBuffer = Buffer.from(signature);
      const expectedSignatureBuffer = Buffer.from(expectedSignature);

      if (
        signatureBuffer.length !== expectedSignatureBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
      ) {
        console.error("[Transfermit Webhook] Signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    console.log("[Transfermit Webhook] Received webhook event:", payload);

    const { id: paymentId, state: paymentState, referenceId, paymentType } = payload;

    if (!referenceId) {
      console.error("[Transfermit Webhook] Missing referenceId in payload");
      return NextResponse.json({ error: "Missing referenceId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: referenceId },
    });

    if (!order) {
      console.error(`[Transfermit Webhook] Order not found for id: ${referenceId}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (paymentType === "REFUND") {
      if (paymentState === "COMPLETED") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "REFUNDED",
            paymentStatus: "REFUNDED",
          },
        });
        console.log(`[Transfermit Webhook] Order ${order.id} refunded successfully`);
      }
      return NextResponse.json({ ok: true });
    }

    // Process deposit/payment updates
    switch (paymentState) {
      case "COMPLETED":
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paymentId: paymentId,
          },
        });
        console.log(`[Transfermit Webhook] Order ${order.id} paid successfully`);
        break;

      case "DECLINED":
      case "ERROR":
      case "CANCELLED":
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
            paymentId: paymentId,
          },
        });
        console.log(`[Transfermit Webhook] Order ${order.id} marked failed (state: ${paymentState})`);
        break;

      case "PENDING":
      default:
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PENDING",
            paymentId: paymentId,
          },
        });
        console.log(`[Transfermit Webhook] Order ${order.id} payment pending`);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Transfermit Webhook] Internal handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
