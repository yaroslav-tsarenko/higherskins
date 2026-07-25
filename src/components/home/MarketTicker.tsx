"use client";

import { Link } from "@/i18n/routing";
import { TrendingDown } from "lucide-react";
import type { TickerListing } from "@/lib/skins/queries";

// Continuously scrolling strip of the newest listings. The list is rendered
// twice so the -50% marquee loop is seamless; the animation is paused on hover
// and frozen entirely under prefers-reduced-motion (global rule).
export function MarketTicker({ items }: { items: TickerListing[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] py-3">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[color:var(--color-bg-elevated)] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[color:var(--color-bg-elevated)] to-transparent"
      />
      <div className="animate-marquee flex w-max items-stretch gap-3 group-hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            href={`/skin/${item.skinId}`}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 transition-colors hover:border-[color:var(--color-primary)]"
            style={{ ["--rarity" as string]: item.rarityColor }}
          >
            <span className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--color-bg-secondary)]">
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-[3px]"
                style={{ background: item.rarityColor }}
              />
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-1" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[150px] truncate text-[12.5px] font-semibold text-[color:var(--color-text)]">
                {item.name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="spec-value text-[13px] font-bold text-[color:var(--color-accent)]">
                  ${item.price.toFixed(2)}
                </span>
                {item.discountPct != null && item.discountPct > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[color:var(--color-success)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--color-success)]">
                    <TrendingDown size={9} /> {item.discountPct.toFixed(0)}%
                  </span>
                )}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
