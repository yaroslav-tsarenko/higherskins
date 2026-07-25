"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { exteriorMeta } from "@/lib/skins/shared";
import type { CatalogItem, TrendingSet } from "@/lib/skins/queries";
import { Panel } from "./Section";

function TrendCard({ item }: { item: CatalogItem }) {
  const ext = exteriorMeta(item.exterior);
  const down = (item.discountPct ?? 0) > 0;

  return (
    <Link
      href={`/skin/${item.skinId}?listing=${item.listingId}`}
      className="card-lift group flex w-[186px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] sm:w-[204px]"
      style={{ ["--rarity" as string]: item.rarityColor }}
    >
      <span className="rarity-strip block h-[3px] w-full" />
      <span className="relative block aspect-[4/3] overflow-hidden tech-grid">
        <span
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(120% 80% at 50% 120%, ${item.rarityColor}2b 0%, transparent 62%)`,
          }}
        />
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.08] group-hover:-rotate-1"
          />
        )}
        {down && (
          <span className="absolute right-2 top-2 rounded-md bg-[color:var(--color-success)] px-1.5 py-0.5 spec-value text-[11px] font-bold text-black">
            −{Math.round(item.discountPct ?? 0)}%
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
            {item.weapon}
          </span>
          {ext && (
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ color: item.rarityColor, background: `${item.rarityColor}1a` }}
            >
              {ext.short}
            </span>
          )}
        </span>
        <span className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-tight text-[color:var(--color-text)]">
          {item.name.split(" | ").slice(1).join(" | ") || item.name}
        </span>
        <span className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="spec-value text-[15px] font-bold text-[color:var(--color-text)]">
            ${item.price.toFixed(2)}
          </span>
          {item.steamPrice != null && down && (
            <span className="spec-value text-[11px] text-[color:var(--color-text-tertiary)] line-through">
              ${item.steamPrice.toFixed(2)}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function TrendingCarousel({ sets }: { sets: TrendingSet[] }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = sets[Math.min(active, sets.length - 1)];

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 440, behavior: "smooth" });
  };

  if (!sets.length || !current?.items.length) return null;

  return (
    <Panel padded={false}>
      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-border)] p-4">
        {sets.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.key}
              onClick={() => setActive(i)}
              className={`relative rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
                isActive
                  ? "text-[color:var(--color-primary-fg)]"
                  : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="trending-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-[color:var(--color-primary)]"
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-text)]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-text)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[color:var(--color-bg-elevated)] to-transparent"
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            ref={trackRef}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {current.items.map((item) => (
              <TrendCard key={item.listingId} item={item} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  );
}
