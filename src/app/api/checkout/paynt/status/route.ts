import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus, isPaymentSuccessful, isPaymentPending } from "@/lib/paynt";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendOrderConfirmationEmail, sendOrderInvoiceEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourcePath = searchParams.get("resourcePath");
    const orderId = searchParams.get("orderId");
    const checkoutId = searchParams.get("id");

    if (!resourcePath) {
      return NextResponse.json(
        { error: "Missing required parameter: resourcePath" },
        { status: 400 }
      );
    }

    // 1. Locate the order
    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
    }

    if (!order && checkoutId) {
      order = await prisma.order.findFirst({
        where: { paymentId: checkoutId },
        include: { items: true },
      });
    }

    // 2. Idempotency Check: if already processed as PAID, return immediately to respect rate limits
    if (order && (order.paymentStatus === "PAID" || order.status === "CONFIRMED")) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: Number(order.total),
          paymentStatus: order.paymentStatus,
          status: order.status,
          customerEmail: order.customerEmail,
          items: order.items,
        },
      });
    }

    // 3. Query OPPWA for transaction result (Single server call to respect 2 req/min limit)
    console.log(`[PayNT Status] Querying resourcePath: ${resourcePath}`);
    const payntStatus = await getPaymentStatus(resourcePath);
    const resultCode = payntStatus.result?.code || "";
    const isSuccess = isPaymentSuccessful(resultCode);
    const isPending = isPaymentPending(resultCode);

    // If order wasn't found by query params, try using merchantTransactionId from OPPWA
    if (!order && payntStatus.merchantTransactionId) {
      order = await prisma.order.findUnique({
        where: { id: payntStatus.merchantTransactionId },
        include: { items: true },
      });
    }

    if (!order) {
      return NextResponse.json(
        {
          success: isSuccess,
          code: resultCode,
          description: payntStatus.result?.description,
          error: "Order not found for this transaction",
        },
        { status: 404 }
      );
    }

    // 4. Handle Success
    if (isSuccess) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentId: payntStatus.id || order.paymentId,
        },
        include: { items: true },
      });

      // Schedule transactional emails
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

      return NextResponse.json({
        success: true,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          total: Number(updatedOrder.total),
          paymentStatus: updatedOrder.paymentStatus,
          status: updatedOrder.status,
          customerEmail: updatedOrder.customerEmail,
          items: updatedOrder.items,
        },
        paymentBrand: payntStatus.paymentBrand,
        cardLast4: payntStatus.card?.last4Digits,
      });
    }

    // 5. Handle Pending (rare, e.g. waiting for async settlement)
    if (isPending) {
      return NextResponse.json({
        success: false,
        pending: true,
        message: "Payment is pending confirmation.",
        orderId: order.id,
      });
    }

    // 6. Handle Failure / Decline
    // Mark order failed and restore inventory
    if (order.status === "PENDING" && order.paymentStatus === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      });

      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    return NextResponse.json({
      success: false,
      code: resultCode,
      description: payntStatus.result?.description || "Payment declined by issuer",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error("[GET /api/checkout/paynt/status error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify transaction status" },
      { status: 500 }
    );
  }
}
