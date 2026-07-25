"use client";

import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { format } from "date-fns";
import type { OrderDetail } from "@/types/order";

const statusColors: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("account");
  const { currency, convert } = useCurrency();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="p-8 text-center text-[color:var(--color-text-secondary)]">Order not found</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
            {t("orderNumber", { number: order.orderNumber.slice(-8) })}
          </h1>
          <p className="text-sm text-[color:var(--color-text-tertiary)]">
            Placed on {format(new Date(order.createdAt), "MMM d, yyyy 'at' HH:mm")}
          </p>
        </div>
        <Chip size="lg" color={statusColors[order.status] || "default"}>{order.status}</Chip>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-5 py-4">
          <div className="eyebrow mb-2">Shipping Address</div>
          <div className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
            {order.shippingAddress.address1}<br />
            {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
            {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-5 py-4">
          <div className="eyebrow mb-2">Order Info</div>
          <div className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            Payment: <strong className="text-[color:var(--color-text)]">{order.paymentStatus}</strong>
            {order.paymentMethod && <><br />Method: {order.paymentMethod}</>}
            {order.shippingMethod && <><br />Shipping: {order.shippingMethod}</>}
            {order.trackingNumber && <><br />Tracking: <strong className="text-[color:var(--color-text)]">{order.trackingNumber}</strong></>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]">
        <table className="hidden w-full border-collapse sm:table">
          <thead>
            <tr>
              <th className="border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-tertiary)]">Product</th>
              <th className="border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-tertiary)]">Qty</th>
              <th className="border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-tertiary)]">Price</th>
              <th className="border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-tertiary)]">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} className={i < order.items.length - 1 ? "border-b border-[color:var(--color-line)]" : ""}>
                <td className="px-4 py-3.5 text-sm">
                  <div className="font-semibold text-[color:var(--color-text)]">{item.productName}</div>
                  {item.variantName && <div className="text-xs text-[color:var(--color-text-tertiary)]">{item.variantName}</div>}
                  <div className="text-xs text-[color:var(--color-text-tertiary)]">SKU: {item.productSku}</div>
                </td>
                <td className="px-4 py-3.5 text-right text-sm text-[color:var(--color-text)]">{item.quantity}</td>
                <td className="px-4 py-3.5 text-right text-sm text-[color:var(--color-text)]">{formatPrice(convert(Number(item.price)), currency)}</td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold text-[color:var(--color-text)]">{formatPrice(convert(Number(item.total)), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col sm:hidden">
          {order.items.map((item, i) => (
            <div key={item.id} className={`flex flex-col gap-1 px-4 py-3.5 ${i < order.items.length - 1 ? "border-b border-[color:var(--color-line)]" : ""}`}>
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.productName}</div>
              {item.variantName && <div className="text-xs text-[color:var(--color-text-tertiary)]">{item.variantName}</div>}
              <div className="flex justify-between text-xs text-[color:var(--color-text-tertiary)]">
                <span>Qty {item.quantity} × {formatPrice(convert(Number(item.price)), currency)}</span>
                <span className="font-bold text-[color:var(--color-text)]">{formatPrice(convert(Number(item.total)), currency)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end gap-1 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-5 py-4 text-sm">
          <div className="flex gap-4">
            <span className="text-[color:var(--color-text-secondary)]">Subtotal</span>
            <span className="text-[color:var(--color-text)]">{formatPrice(convert(Number(order.subtotal)), currency)}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[color:var(--color-text-secondary)]">Shipping</span>
            <span className="text-[color:var(--color-text)]">{Number(order.shippingCost) === 0 ? "Free" : formatPrice(convert(Number(order.shippingCost)), currency)}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[color:var(--color-text-secondary)]">Tax</span>
            <span className="text-[color:var(--color-text)]">{formatPrice(convert(Number(order.taxAmount)), currency)}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex gap-4 text-[color:var(--color-success)]">
              <span>Discount</span>
              <span>−{formatPrice(convert(Number(order.discountAmount)), currency)}</span>
            </div>
          )}
          <div className="mt-1 flex w-full justify-between border-t border-[color:var(--color-line)] pt-2 text-lg font-bold text-[color:var(--color-text)]">
            <span>Total</span>
            <span>{formatPrice(convert(Number(order.total)), currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
