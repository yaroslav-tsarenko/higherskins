"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight, ShieldCheck, Trash2, Package, Truck, ImageOff } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { formatPrice } from "@/lib/utils/format-price";

export default function CartPage() {
  const t = useTranslations("cart");
  const nav = useTranslations("nav");
  const { cart, updateQuantity, removeItem } = useCart();
  const { currency, convert } = useCurrency();

  const freeShippingThreshold = convert(100);
  const subtotalConverted = convert(cart.subtotal);

  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("title") }]} />

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:mb-6 sm:text-[40px]"
      >
        {t("title")}{" "}
        {cart.items.length > 0 && (
          <span className="text-[color:var(--color-text-tertiary)]">
            ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
          </span>
        )}
      </motion.h1>

      {cart.items.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <EmptyState
            title={t("empty")}
            subtitle={t("emptySubtitle")}
            actionLabel={t("continueShopping")}
            actionHref="/catalog"
            icon={<ShoppingCart size={48} />}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Cart Items */}
          <div className="overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[color:var(--color-text-secondary)]" />
                <span className="text-[13px] font-semibold text-[color:var(--color-text-secondary)]">
                  {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your cart
                </span>
              </div>
              {subtotalConverted >= freeShippingThreshold && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-success)]">
                  <Truck size={14} />
                  Free shipping
                </div>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, padding: 0, margin: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  className="flex items-start gap-3.5 p-4 sm:items-center sm:gap-5 sm:p-5 sm:px-6 [&+&]:border-t [&+&]:border-[color:var(--color-line)]"
                >
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[color:var(--color-line)] bg-white sm:h-[100px] sm:w-[100px]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="100px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[color:var(--color-text-tertiary)]">
                        <ImageOff size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Link
                      href={`/product/${item.slug}`}
                      className="line-clamp-2 break-words text-sm font-semibold text-[color:var(--color-text)] hover:text-[color:var(--color-primary)] sm:text-[15px] [overflow-wrap:anywhere]"
                    >
                      {item.name}
                    </Link>
                    {item.variantName && (
                      <span className="text-xs text-[color:var(--color-text-tertiary)]">
                        {item.variantName}
                      </span>
                    )}
                    <span className="text-xs text-[color:var(--color-text-tertiary)]">
                      SKU: {item.sku}
                    </span>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1 sm:pt-2">
                      <QuantitySelector
                        quantity={item.quantity}
                        maxQuantity={item.maxQuantity}
                        onChange={(qty) => updateQuantity(item.productId, qty, item.variantId)}
                      />
                      <div className="ml-auto flex items-center gap-2 sm:gap-4">
                        <PriceDisplay price={item.price * item.quantity} size="sm" />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-[color:var(--color-text-tertiary)] transition-colors hover:bg-[color:var(--color-bg-secondary)] hover:text-[color:var(--color-danger)]"
                          aria-label="Remove"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5 sm:p-7 lg:sticky lg:top-[calc(var(--header-height)+var(--announcement-height)+1rem)]"
          >
            <h2 className="mb-5 font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">
              Order Summary
            </h2>

            <div className="mb-5 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--color-text-secondary)]">{t("subtotal")}</span>
                <span className="font-medium text-[color:var(--color-text)]">{formatPrice(convert(cart.subtotal), currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--color-text-secondary)]">{t("shipping")}</span>
                <span className={`font-semibold ${cart.shippingCost === 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-text)]"}`}>
                  {cart.shippingCost > 0 ? formatPrice(convert(cart.shippingCost), currency) : "Free"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--color-text-secondary)]">{t("tax")} (21%)</span>
                <span className="font-medium text-[color:var(--color-text)]">{formatPrice(convert(cart.taxAmount), currency)}</span>
              </div>

              {subtotalConverted < freeShippingThreshold && (
                <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--color-bg-secondary)] px-3 py-2.5 text-xs text-[color:var(--color-text-secondary)]">
                  <Truck size={14} />
                  Add {formatPrice(freeShippingThreshold - subtotalConverted, currency)} more for free shipping
                </div>
              )}

              <div className="mt-1 flex justify-between border-t-2 border-[color:var(--color-line)] pt-4 text-xl font-bold text-[color:var(--color-text)]">
                <span>{t("total")}</span>
                <span>{formatPrice(convert(cart.total), currency)}</span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 py-4 text-base font-semibold text-white transition-colors hover:bg-[color:var(--color-accent-hover)]"
              >
                {t("checkout")} <ArrowRight size={18} />
              </Link>
            </motion.div>

            <Link
              href="/catalog"
              className="mt-3.5 block text-center text-sm font-semibold text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
            >
              {t("continueShopping")}
            </Link>

            <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-[color:var(--color-line)] pt-4 text-xs text-[color:var(--color-text-tertiary)]">
              <ShieldCheck size={14} />
              Secure checkout with SSL encryption
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
