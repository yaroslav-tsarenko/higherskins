import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators/checkout";
import { getSessionUser } from "@/lib/auth";
import { resolveDiscount, markDiscountUsed } from "@/lib/discounts";
import { prepareCheckout, extractClientIp } from "@/lib/paynt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const validated = checkoutSchema.parse(body);
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
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
    const orderItems = items.map(
      (item: { productId: string; quantity: number; variantName?: string }) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Product "${product.name}" is out of stock`);
        }

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
      }
    );

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

    // 1. Create Pending Order
    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        status: "PENDING",
        paymentStatus: "PENDING",
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
        paymentMethod: "paynt",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    if (discount) {
      await markDiscountUsed(discount, user?.id ?? null);
    }

    // Decrement stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // 2. Prepare PayNT / OPPWA Checkout
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "localhost:9997";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = /^https?:\/\//.test(host) ? host : `${proto}://${host}`;
    const clientIp = extractClientIp(request.headers);

    const shopperResultUrl = `${baseUrl}/checkout/result?orderId=${order.id}`;

    try {
      const payntResult = await prepareCheckout({
        amount: total,
        currency: "EUR",
        merchantTransactionId: order.id,
        shopperResultUrl,
        customer: {
          email: validated.contact.email,
          givenName: validated.shipping.firstName,
          surname: validated.shipping.lastName,
          phone: validated.contact.phone || undefined,
          ip: clientIp,
        },
        billing: {
          street1: validated.shipping.address1,
          street2: validated.shipping.address2 || undefined,
          city: validated.shipping.city,
          postcode: validated.shipping.postalCode,
          country: validated.shipping.country,
          state: validated.shipping.province || undefined,
        },
      });

      // Update order with checkoutId
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: payntResult.checkoutId,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        checkoutId: payntResult.checkoutId,
        integrity: payntResult.integrity,
        scriptUrl: payntResult.scriptUrl,
        shopperResultUrl: payntResult.shopperResultUrl,
        total,
      });
    } catch (payntError: any) {
      console.error("[PayNT Checkout Prepare Failed]:", payntError);

      // Rollback order and stock
      await prisma.order.delete({ where: { id: order.id } });
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      return NextResponse.json(
        { error: payntError.message || "Failed to initialize payment gateway. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/checkout/paynt/prepare error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to prepare checkout" },
      { status: 500 }
    );
  }
}
