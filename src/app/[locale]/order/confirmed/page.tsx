"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Package, MapPin, Truck, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import type { OrderDetail } from "@/types/order";

function ConfirmedContent() {
  const t = useTranslations("notifications");
  const { currency, convert } = useCurrency();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => setOrder(data?.id ? data : null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto mb-16 mt-8 max-w-2xl px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]"
        >
          <CheckCircle size={40} strokeWidth={1.5} />
        </motion.div>
        <span className="eyebrow">Order confirmed</span>
        <h1 className="mb-2 mt-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
          {t("orderPlaced")}
        </h1>
        <p className="text-[15px] text-[color:var(--color-text-secondary)]">
          Thank you for your order. We&apos;ll send a confirmation email shortly.
        </p>
        {order && (
          <p className="mt-3 text-sm text-[color:var(--color-text-tertiary)]">
            Order <strong className="text-[color:var(--color-text)]">#{order.orderNumber.slice(-8)}</strong>
          </p>
        )}
      </motion.div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Package size={18} className="text-[color:var(--color-accent)]" />
            <h2 className="font-serif text-lg font-medium tracking-tight text-[color:var(--color-text)]">Order Summary</h2>
          </div>

          <div className="mb-4 flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 border-b border-[color:var(--color-line)] pb-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-[color:var(--color-text)]">{item.productName}</div>
                  <div className="mt-0.5 text-xs text-[color:var(--color-text-tertiary)]">
                    Qty {item.quantity} × {formatPrice(convert(Number(item.price)), currency)}
                  </div>
                </div>
                <span className="whitespace-nowrap font-bold text-[color:var(--color-text)]">{formatPrice(convert(Number(item.total)), currency)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">Subtotal</span>
              <span className="text-[color:var(--color-text)]">{formatPrice(convert(Number(order.subtotal)), currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">Shipping</span>
              <span className="text-[color:var(--color-text)]">{Number(order.shippingCost) === 0 ? "Free" : formatPrice(convert(Number(order.shippingCost)), currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">Tax</span>
              <span className="text-[color:var(--color-text)]">{formatPrice(convert(Number(order.taxAmount)), currency)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t border-[color:var(--color-line)] pt-2.5 text-[17px] font-bold text-[color:var(--color-text)]">
              <span>Total</span>
              <span>{formatPrice(convert(Number(order.total)), currency)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2"
        >
          <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-5 py-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-[color:var(--color-accent)]" />
              <span className="eyebrow">Delivery to</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.address1}<br />
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
          </div>
          <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-5 py-4">
            <div className="mb-2 flex items-center gap-2">
              <Truck size={14} className="text-[color:var(--color-accent)]" />
              <span className="eyebrow">Next Steps</span>
            </div>
            <ul className="list-disc pl-4 text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
              <li>We&apos;ll prepare your order within 1–2 business days</li>
              <li>You&apos;ll receive a tracking link by email</li>
              <li>Estimated delivery depends on destination</li>
            </ul>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6 flex items-center gap-2.5 rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent-tint)] px-4 py-3.5 text-[13px]"
      >
        <Mail size={16} className="shrink-0 text-[color:var(--color-accent)]" />
        <span className="text-[color:var(--color-text)]">
          A confirmation email has been sent to{" "}
          <strong>{order?.customerEmail || "your email"}</strong>
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-3"
      >
        <Button as={Link} href="/account/orders" variant="bordered" className="flex-1 basis-[200px]" endContent={<ChevronRight size={16} />}>
          View Orders
        </Button>
        <Button as={Link} href="/catalog" color="primary" className="flex-1 basis-[200px]">
          Continue Shopping
        </Button>
      </motion.div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ConfirmedContent />
    </Suspense>
  );
}
