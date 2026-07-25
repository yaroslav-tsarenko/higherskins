"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Chip } from "@/components/ui/Chip";
import { Package, MapPin, Heart, User as UserIcon, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { formatPrice } from "@/lib/utils/format-price";
import { format } from "date-fns";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
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

export default function AccountPage() {
  const t = useTranslations("account");
  const { user, loading } = useAuth();
  const { currency, convert } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data.data) ? data.data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      <span className="eyebrow">Welcome back</span>
      <h1 className="mb-1 mt-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
        {t("title")}
      </h1>
      <p className="mb-6 text-[15px] text-[color:var(--color-text-secondary)]">
        {t("welcome", { name: user?.name || user?.email || "" })}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
          <span className="eyebrow">Orders</span>
          <span className="font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{orders.length}</span>
          <span className="text-xs text-[color:var(--color-text-secondary)]">All-time</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
          <span className="eyebrow">Total Spent</span>
          <span className="font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{formatPrice(convert(totalSpent), currency)}</span>
          <span className="text-xs text-[color:var(--color-text-secondary)]">Across all orders</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
          <span className="eyebrow">Account</span>
          <span className="truncate text-base font-semibold text-[color:var(--color-text)]">{user?.email}</span>
          <span className="text-xs text-[color:var(--color-text-secondary)]">{user?.name || "No name set"}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">Recent Orders</h2>
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--color-accent)] hover:opacity-80">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {ordersLoading ? (
            <div className="p-6 text-center text-[color:var(--color-text-tertiary)]">Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[color:var(--color-line)] p-8 text-center text-[color:var(--color-text-tertiary)]">
              <Package size={32} className="mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-sm">No orders yet</p>
              <Link href="/catalog" className="mt-3 inline-block text-sm font-semibold text-[color:var(--color-accent)] hover:opacity-80">
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="grid grid-cols-1 grid-rows-[auto_auto] gap-2 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-3.5 text-[color:var(--color-text)] transition-all hover:-translate-y-px hover:border-[color:var(--color-primary)] sm:grid-cols-[1fr_auto_auto] sm:grid-rows-1 sm:items-center sm:gap-6 sm:px-6 sm:py-4"
                >
                  <div className="min-w-0 sm:col-auto max-sm:col-span-full">
                    <div className="text-[15px] font-bold text-[color:var(--color-text)]">#{order.orderNumber.slice(-8)}</div>
                    <div className="mt-0.5 text-xs text-[color:var(--color-text-tertiary)]">{format(new Date(order.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  <Chip size="sm" color={statusColors[order.status] || "default"}>{order.status}</Chip>
                  <span className="whitespace-nowrap text-base font-bold text-[color:var(--color-text)] sm:text-[15px]">{formatPrice(convert(Number(order.total)), currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
          <h2 className="mb-3 font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">Quick Links</h2>
          <Link href="/account/orders" className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-bg-secondary)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"><Package size={16} strokeWidth={1.5} /></span>
            <span className="flex-1">{t("orders")}</span>
            <ChevronRight size={16} className="text-[color:var(--color-text-tertiary)]" />
          </Link>
          <Link href="/account/profile" className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-bg-secondary)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"><UserIcon size={16} strokeWidth={1.5} /></span>
            <span className="flex-1">{t("profile")}</span>
            <ChevronRight size={16} className="text-[color:var(--color-text-tertiary)]" />
          </Link>
          <Link href="/account/addresses" className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-bg-secondary)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"><MapPin size={16} strokeWidth={1.5} /></span>
            <span className="flex-1">{t("addresses")}</span>
            <ChevronRight size={16} className="text-[color:var(--color-text-tertiary)]" />
          </Link>
          <Link href="/account/wishlist" className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-bg-secondary)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"><Heart size={16} strokeWidth={1.5} /></span>
            <span className="flex-1">{t("wishlist")}</span>
            <ChevronRight size={16} className="text-[color:var(--color-text-tertiary)]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
