"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ShoppingBag, Heart, ImageOff, Star, Eye } from "lucide-react";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { useCart } from "@/providers/CartProvider";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  category?: string;
  quantity: number;
  rating?: number;
  reviewCount?: number;
}

export function ProductCard({
  id,
  name,
  slug,
  sku,
  price,
  comparePrice,
  imageUrl,
  category,
  quantity,
  rating,
  reviewCount,
}: ProductCardProps) {
  const t = useTranslations("product");
  const { addItem } = useCart();
  const [imgError, setImgError] = useState(false);
  const isOnSale = !!(comparePrice && comparePrice > price);
  const discountPct = isOnSale
    ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
    : 0;
  const outOfStock = quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      productId: id,
      name,
      slug,
      sku,
      price,
      quantity: 1,
      imageUrl: imageUrl || null,
      maxQuantity: quantity,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link
      href={`/product/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-primary)]/60 hover:shadow-[0_10px_28px_-8px_rgba(46,125,255,0.35)]"
    >
      {/* Image area — fixed uniform aspect, neutral off-white for photo clarity */}
      <div className="relative aspect-square overflow-hidden bg-[rgb(252,252,252)]">
        {/* faint tech grid on card image bg */}
        <div aria-hidden className="absolute inset-0 tech-grid opacity-[0.06]" />
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="relative z-[1] object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-400">
            <ImageOff size={26} strokeWidth={1.5} />
            <span className="text-xs">No image</span>
          </div>
        )}

        {/* Discount pill (electric azure) */}
        {isOnSale && (
          <span className="absolute left-3 top-3 z-[2] inline-flex h-6 items-center rounded-md bg-[color:var(--color-primary)] px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_0_16px_rgba(46,125,255,0.55)]">
            −{discountPct}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 z-[2] inline-flex h-6 items-center rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]/85 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)] backdrop-blur">
            {t("outOfStock")}
          </span>
        )}

        {/* In-stock indicator (mint dot) */}
        {!outOfStock && !isOnSale && (
          <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]/70 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-success)] backdrop-blur">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)] shadow-[0_0_8px_rgba(62,213,152,0.7)]"
            />
            In stock
          </span>
        )}

        {/* Hover-only quick actions (wishlist + quick view) */}
        <div className="absolute right-3 top-3 z-[2] flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]/90 text-[color:var(--color-text-secondary)] backdrop-blur transition-all hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] hover:shadow-[0_0_16px_rgba(46,125,255,0.35)]"
          >
            <Heart size={14} strokeWidth={1.75} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label="Quick view"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]/90 text-[color:var(--color-text-secondary)] backdrop-blur transition-all hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] hover:shadow-[0_0_16px_rgba(46,125,255,0.35)]"
          >
            <Eye size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* subtle bottom hairline */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-line-strong)] to-transparent opacity-60"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {category && (
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
            {category}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.75em] font-display text-[15px] font-semibold leading-snug tracking-tight text-[color:var(--color-text)] transition-colors group-hover:text-[color:var(--color-primary)]">
          {name}
        </h3>

        {typeof rating === "number" && rating > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-tertiary)]">
            <div className="flex items-center gap-0.5 text-[color:var(--color-warning)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  strokeWidth={0}
                  className={
                    i < Math.round(rating)
                      ? "fill-current"
                      : "opacity-25 fill-current"
                  }
                />
              ))}
            </div>
            {typeof reviewCount === "number" && reviewCount > 0 && (
              <span className="font-mono tabular-nums">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="font-mono">
            <PriceDisplay price={price} comparePrice={comparePrice} size="sm" />
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={t("addToCart")}
            className={`group/btn relative inline-flex h-10 shrink-0 items-center gap-1.5 overflow-hidden rounded-lg px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 ${
              outOfStock
                ? "cursor-not-allowed border border-[color:var(--color-line)] text-[color:var(--color-text-tertiary)]"
                : "bg-[color:var(--color-primary)] text-white hover:bg-[color:var(--color-primary-hover)] hover:shadow-[0_0_20px_rgba(46,125,255,0.55)]"
            }`}
          >
            <ShoppingBag size={14} strokeWidth={2} />
            <span className="hidden max-w-0 whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-[7rem] group-hover:opacity-100 sm:inline">
              Add to cart
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}
