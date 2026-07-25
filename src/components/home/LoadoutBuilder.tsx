"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Shuffle, X } from "lucide-react";
import type { CatalogItem, LoadoutSlotPool } from "@/lib/skins/queries";
import { Panel } from "./Section";

type Selection = Record<string, CatalogItem | undefined>;

const SIDES = [
  { key: "ct", label: "Counter-Terrorist" },
  { key: "t", label: "Terrorist" },
] as const;

function SlotCard({
  label,
  item,
  onClear,
}: {
  label: string;
  item: CatalogItem | undefined;
  onClear: () => void;
}) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
      style={{ ["--rarity" as string]: item?.rarityColor ?? "var(--color-line-strong)" }}
    >
      <span className="rarity-strip block h-[3px] w-full" />
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden tech-grid">
        {item?.imageUrl ? (
          <motion.img
            key={item.listingId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-3"
          />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
            empty
          </span>
        )}
        {item && (
          <button
            onClick={onClear}
            aria-label={`Clear ${label}`}
            className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
          {label}
        </span>
        <span className="truncate text-[12px] font-semibold text-[color:var(--color-text)]">
          {item ? item.name.split(" | ").slice(1).join(" | ") || item.name : "—"}
        </span>
        <span className="spec-value text-[12.5px] font-bold text-[color:var(--color-accent)]">
          {item ? `$${item.price.toFixed(2)}` : "$0.00"}
        </span>
      </div>
    </div>
  );
}

export function LoadoutBuilder({ pools }: { pools: LoadoutSlotPool[] }) {
  const [side, setSide] = useState<(typeof SIDES)[number]["key"]>("ct");
  const [selection, setSelection] = useState<Selection>({});
  const [activeSlot, setActiveSlot] = useState(pools[0]?.slot ?? "knife");

  if (!pools.length) return null;

  const total = Object.values(selection).reduce((acc, i) => acc + (i?.price ?? 0), 0);
  const filled = Object.values(selection).filter(Boolean).length;
  const options = pools.find((p) => p.slot === activeSlot)?.items ?? [];

  const randomize = () => {
    const next: Selection = {};
    for (const pool of pools) {
      if (!pool.items.length) continue;
      next[pool.slot] = pool.items[Math.floor(Math.random() * pool.items.length)];
    }
    setSelection(next);
  };

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-2">
        {SIDES.map((s) => (
          <button
            key={s.key}
            onClick={() => setSide(s.key)}
            className={`relative rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              side === s.key
                ? "text-[color:var(--color-text)]"
                : "text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)]"
            }`}
          >
            {side === s.key && (
              <motion.span
                layoutId="loadout-side"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-secondary)]"
              />
            )}
            <span className="relative">{s.label}</span>
          </button>
        ))}
        <button
          onClick={randomize}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-[12.5px] font-semibold text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-text)]"
        >
          <Shuffle size={13} /> Surprise me
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {pools.map((pool) => (
          <button
            key={pool.slot}
            onClick={() => setActiveSlot(pool.slot)}
            className={`rounded-xl text-left transition-shadow ${
              activeSlot === pool.slot
                ? "shadow-[0_0_0_2px_var(--color-primary)]"
                : "hover:shadow-[0_0_0_1px_var(--color-line-strong)]"
            }`}
          >
            <SlotCard
              label={pool.label}
              item={selection[pool.slot]}
              onClear={() => setSelection((s) => ({ ...s, [pool.slot]: undefined }))}
            />
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
          Pick a {pools.find((p) => p.slot === activeSlot)?.label.toLowerCase()}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((item) => {
            const picked = selection[activeSlot]?.listingId === item.listingId;
            return (
              <button
                key={item.listingId}
                onClick={() => setSelection((s) => ({ ...s, [activeSlot]: item }))}
                title={`${item.name} — $${item.price.toFixed(2)}`}
                className={`relative flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border bg-[color:var(--color-bg)] transition-colors ${
                  picked
                    ? "border-[color:var(--color-primary)]"
                    : "border-[color:var(--color-border)] hover:border-[color:var(--color-line-strong)]"
                }`}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg"
                  style={{ background: item.rarityColor }}
                />
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-4">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
            {side === "ct" ? "CT" : "T"} loadout · {filled}/{pools.length} slots
          </div>
          <motion.div
            key={total}
            initial={{ opacity: 0.6, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="font-display text-2xl font-extrabold tabular-nums text-[color:var(--color-text)]"
          >
            ${total.toFixed(2)}
          </motion.div>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 text-[13px] font-bold text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
        >
          Build it for real <ArrowRight size={14} />
        </Link>
      </div>
    </Panel>
  );
}
