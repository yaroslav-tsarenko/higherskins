import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators/checkout";
import { getSessionUser } from "@/lib/auth";
import { sendOrderConfirmationEmail, sendOrderInvoiceEmail } from "@/lib/email";
import { scheduleEmail } from "@/lib/email-jobs";
import { resolveDiscount, markDiscountUsed } from "@/lib/discounts";
import { TransfermitAPI } from "@/lib/payments/transfermit";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    const body = await request.json();
    const validated = checkoutSchema.parse(body);
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!validated.contact.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = items.map((item: { productId: string; quantity: number; variantName?: string }) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        variantName: item.variantName || null,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      };
    });

    const discount = await resolveDiscount({
      userId: user?.id ?? null,
      email: validated.contact.email,
      code: validated.discountCode ?? null,
    });

    const discountAmount = discount ? +(subtotal * (discount.percent / 100)).toFixed(2) : 0;
    const discountedSubtotal = subtotal - discountAmount;

    const taxRate = 21;
    const taxAmount = +(discountedSubtotal * (taxRate / 100)).toFixed(2);
    const shippingCost = discountedSubtotal >= 100 ? 0 : 5.99;
    const total = +(discountedSubtotal + taxAmount + shippingCost).toFixed(2);

    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        customerName: `${validated.shipping.firstName} ${validated.shipping.lastName}`,
        customerEmail: validated.contact.email,
        customerPhone: validated.contact.phone,
        shippingAddress: validated.shipping,
        shippingMethod: validated.shippingMethod,
        shippingCost,
        subtotal,
        taxAmount,
        discountAmount,
        discountCode: discount?.code ?? null,
        discountPercent: discount?.percent ?? null,
        total,
        paymentMethod: "transfermit",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    if (discount) {
      await markDiscountUsed(discount, user?.id ?? null);
    }

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Initialize payment on Transfermit
    let redirectUrl = "";
    try {
      const api = new TransfermitAPI();

      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || process.env.NEXT_PUBLIC_SITE_URL || "localhost:9997";
      const proto = request.headers.get("x-forwarded-proto") || "http";
      const baseUrl = `${proto}://${host}`;

      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

      const paymentData = {
        amount: total,
        currency: "EUR",
        referenceId: order.id,
        customer: {
          referenceId: order.id,
          firstName: validated.shipping.firstName,
          lastName: validated.shipping.lastName,
          email: validated.contact.email,
          phone: validated.contact.phone || undefined,
          ip: clientIp,
        },
        billingAddress: {
          addressLine1: validated.shipping.address1,
          addressLine2: validated.shipping.address2 || undefined,
          city: validated.shipping.city,
          countryCode: validated.shipping.country,
          postalCode: validated.shipping.postalCode,
          state: validated.shipping.province || undefined,
        },
        returnUrl: `${baseUrl}/order/confirmed?orderId=${order.id}`,
        webhookUrl: `${baseUrl}/api/webhooks/transfermit`,
      };

      const transfermitRes = await api.createPayment(paymentData);

      if (transfermitRes && transfermitRes.result) {
        const { id: paymentId, redirectUrl: rUrl } = transfermitRes.result;

        // Update order with paymentId
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId: paymentId,
          },
        });

        redirectUrl = rUrl || "";
      } else {
        throw new Error("Transfermit did not return a valid result.");
      }
    } catch (e) {
      console.error("Transfermit payment creation failed:", e);

      // Rollback order creation
      await prisma.order.delete({
        where: { id: order.id },
      });

      // Restore stock inventory
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      return NextResponse.json(
        { error: "Payment initialization failed. Please try again." },
        { status: 500 }
      );
    }

    const emailPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      total: order.total,
      shippingMethod: order.shippingMethod || "standard",
      shippingAddress: validated.shipping,
      createdAt: order.createdAt,
    };

    scheduleEmail(`order confirmation ${order.orderNumber}`, () => sendOrderConfirmationEmail(emailPayload));
    scheduleEmail(`order invoice ${order.orderNumber}`, () => sendOrderInvoiceEmail(emailPayload));

    return NextResponse.json({ ...order, redirectUrl }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
