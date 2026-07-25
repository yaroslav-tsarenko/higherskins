"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { useCurrency } from "@/providers/CurrencyProvider";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<PriceDisplayProps["size"]>, { current: string; compare: string }> = {
  sm: { current: "text-[15px]", compare: "text-xs" },
  md: { current: "text-xl", compare: "text-sm" },
  lg: { current: "text-3xl", compare: "text-base" },
};

export function PriceDisplay({ price, comparePrice, size = "md", className }: PriceDisplayProps) {
  const { currency, convert } = useCurrency();
  const isOnSale = !!(comparePrice && comparePrice > price);

  return (
    <div className={`flex items-baseline gap-2 ${className ?? ""}`}>
      <span
        className={`font-semibold tracking-tight ${sizeClass[size].current} ${
          isOnSale ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-text)]"
        }`}
      >
        {formatPrice(convert(price), currency)}
      </span>
      {isOnSale && (
        <span
          className={`${sizeClass[size].compare} text-[color:var(--color-text-tertiary)] line-through`}
        >
          {formatPrice(convert(comparePrice!), currency)}
        </span>
      )}
    </div>
  );
}
