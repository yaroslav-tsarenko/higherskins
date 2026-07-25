"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Chip } from "@/components/ui/Chip";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { formatPrice } from "@/lib/utils/format-price";
import { format } from "date-fns";
import { Package } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: string }[];
}

const statusColors: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export default function OrdersPage() {
  const t = useTranslations("account");
  const nav = useTranslations("nav");
  const { user } = useAuth();
  const { currency, convert } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data.data) ? data.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">{t("orders")}</h1>

      {orders.length === 0 ? (
        <EmptyState
          title={t("noOrders")}
          subtitle={t("noOrdersSubtitle")}
          actionLabel={nav("catalog")}
          actionHref="/catalog"
          icon={<Package size={48} />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="grid grid-cols-1 grid-rows-[auto_auto] gap-2 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-3.5 text-[color:var(--color-text)] transition-all hover:-translate-y-px hover:border-[color:var(--color-primary)] sm:grid-cols-[1fr_auto_auto] sm:grid-rows-1 sm:items-center sm:gap-6 sm:px-6 sm:py-4"
            >
              <div className="min-w-0 max-sm:col-span-full">
                <div className="text-[15px] font-bold text-[color:var(--color-text)]">#{order.orderNumber.slice(-8)}</div>
                <div className="mt-0.5 text-xs text-[color:var(--color-text-tertiary)]">{format(new Date(order.createdAt), "MMM d, yyyy")}</div>
                <div className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </div>
              </div>
              <Chip size="sm" color={statusColors[order.status] || "default"}>{order.status}</Chip>
              <span className="whitespace-nowrap text-base font-bold text-[color:var(--color-text)] sm:text-[15px]">{formatPrice(convert(Number(order.total)), currency)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
