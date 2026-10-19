"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useCart } from "@/providers/CartProvider";
import { formatPrice } from "@/lib/utils/format-price";

interface OrderData {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  status: string;
  customerEmail: string;
  items?: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number | string;
    total: number | string;
  }>;
}

function CheckoutResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, convert } = useCurrency();
  const { clearCart } = useCart();

  const resourcePath = searchParams.get("resourcePath");
  const checkoutId = searchParams.get("id");
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState<string | null>(null);

  useEffect(() => {
    // If no resourcePath, cannot verify OPPWA result
    if (!resourcePath) {
      setLoading(false);
      setSuccess(false);
      setErrorMessage("No payment authorization resource path received from gateway.");
      return;
    }

    let isMounted = true;

    async function verifyPayment() {
      try {
        const query = new URLSearchParams({
          resourcePath: resourcePath || "",
        });
        if (orderId) query.set("orderId", orderId);
        if (checkoutId) query.set("id", checkoutId);

        const res = await fetch(`/api/checkout/paynt/status?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setSuccess(true);
          setOrder(data.order);
          setCardBrand(data.paymentBrand || null);
          setCardLast4(data.cardLast4 || null);
          clearCart();
        } else {
          setSuccess(false);
          setErrorMessage(
            data.description ||
              data.error ||
              "Your payment could not be processed. Please check your card details or try another card."
          );
          if (data.order) setOrder(data.order);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSuccess(false);
        setErrorMessage(
          err.message || "An unexpected network error occurred while verifying the payment."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [resourcePath, checkoutId, orderId, clearCart]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="mx-auto my-20 flex max-w-md flex-col items-center justify-center rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-10 text-center shadow-lg">
        <Loader2 size={42} className="animate-spin text-[color:var(--color-primary)]" />
        <h2 className="mt-5 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)]">
          Verifying payment...
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
          Contacting PayNT 3D Secure verification system. Please do not close or refresh this tab.
        </p>
      </div>
    );
  }

  // 2. Success State
  if (success) {
    return (
      <div className="mx-auto mb-16 mt-8 max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
          >
            <CheckCircle size={44} strokeWidth={1.75} />
          </motion.div>
          <span className="eyebrow">Payment confirmed</span>
          <h1 className="mb-2 mt-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-4xl">
            Order Placed Successfully!
          </h1>
          <p className="text-[15px] text-[color:var(--color-text-secondary)]">
            Thank you for your purchase! A confirmation receipt has been sent to{" "}
            <span className="font-semibold text-[color:var(--color-text)]">
              {order?.customerEmail}
            </span>
            .
          </p>
          {order && (
            <p className="mt-3 text-sm text-[color:var(--color-text-tertiary)]">
              Order Reference:{" "}
              <strong className="font-mono text-[color:var(--color-text)]">
                #{order.orderNumber.slice(-8)}
              </strong>
            </p>
          )}
        </motion.div>

        {/* Card info if available */}
        {(cardBrand || cardLast4) && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-3 text-xs">
            <span className="text-[color:var(--color-text-secondary)]">Paid via:</span>
            <span className="font-mono font-semibold uppercase text-[color:var(--color-text)]">
              {cardBrand || "Card"} {cardLast4 ? `•••• ${cardLast4}` : ""}
            </span>
          </div>
        )}

        {/* Order Items Summary */}
        {order?.items && order.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Package size={18} className="text-[color:var(--color-accent)]" />
              <h2 className="font-serif text-lg font-medium tracking-tight text-[color:var(--color-text)]">
                Items Purchased
              </h2>
            </div>

            <div className="mb-4 flex flex-col gap-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-[color:var(--color-line)] pb-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[color:var(--color-text)]">
                      {item.productName}
                    </div>
                    <div className="mt-0.5 text-xs text-[color:var(--color-text-tertiary)]">
                      Qty {item.quantity} × {formatPrice(convert(Number(item.price)), currency)}
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-bold text-[color:var(--color-text)]">
                    {formatPrice(convert(Number(item.total)), currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-1 text-base font-bold text-[color:var(--color-text)]">
              <span>Total Paid</span>
              <span>{formatPrice(convert(Number(order.total)), currency)}</span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/catalog" className="flex-1">
            <Button color="primary" size="lg" fullWidth endContent={<ArrowRight size={16} />}>
              Continue Shopping
            </Button>
          </Link>
          <Link href="/account" className="flex-1">
            <Button variant="bordered" size="lg" fullWidth>
              View My Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Error / Decline State
  return (
    <div className="mx-auto mb-16 mt-8 max-w-xl px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6 text-center sm:p-10"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]">
          <XCircle size={38} strokeWidth={1.75} />
        </div>

        <span className="eyebrow text-[color:var(--color-danger)]">Transaction failed</span>
        <h1 className="mb-3 mt-1 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
          Payment Was Not Completed
        </h1>

        <div className="mb-6 rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 p-4 text-left text-sm text-[color:var(--color-text)]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-[color:var(--color-danger)]"
            />
            <div>
              <p className="font-semibold text-[color:var(--color-danger)]">
                Reason from payment gateway:
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                {errorMessage ||
                  "The card was declined or 3D Secure verification timed out. No funds were debited."}
              </p>
            </div>
          </div>
        </div>

        <p className="mb-6 text-xs text-[color:var(--color-text-tertiary)]">
          You can return to checkout and try again with another card, or contact your bank if you
          believe this was an error.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            color="primary"
            size="lg"
            fullWidth
            onPress={() => router.push("/checkout")}
            startContent={<RotateCcw size={16} />}
          >
            Try Again
          </Button>
          <Link href="/cart" className="flex-1">
            <Button
              variant="bordered"
              size="lg"
              fullWidth
              startContent={<ShoppingBag size={16} />}
            >
              Return to Cart
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[color:var(--color-primary)]" />
        </div>
      }
    >
      <CheckoutResultContent />
    </Suspense>
  );
}
