"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  Layers,
  Percent,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { CountUp } from "./CountUp";
import type { CatalogItem, MarketStats } from "@/lib/skins/queries";
import { useCurrency } from "@/providers/CurrencyProvider";

interface HeroProps {
  stats: MarketStats;
  listedToday: number;
  floaters: CatalogItem[];
}

const STAT_ITEMS = [
  { key: "listings", icon: Layers, label: "Items listed", decimals: 0, prefix: "", suffix: "" },
  { key: "value", icon: Wallet, label: "Market value", decimals: 0, prefix: "$", suffix: "" },
  { key: "discount", icon: Percent, label: "Avg discount", decimals: 1, prefix: "", suffix: "%" },
  { key: "today", icon: TrendingUp, label: "Listed today", decimals: 0, prefix: "", suffix: "" },
] as const;

// Depth/offset table for the floating skin cards. Fixed values keep the
// composition balanced instead of drifting with random data.
const FLOAT_SLOTS = [
  { top: "4%", right: "6%", size: 148, delay: 0, drift: 14, rotate: -6 },
  { top: "38%", right: "34%", size: 118, delay: 0.6, drift: -11, rotate: 5 },
  { top: "62%", right: "4%", size: 132, delay: 1.1, drift: 12, rotate: 7 },
];

function FloatingCard({
  item,
  slot,
}: {
  item: CatalogItem;
  slot: (typeof FLOAT_SLOTS)[number];
}) {
  const { convert, symbol } = useCurrency();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: [0, slot.drift, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.5, delay: slot.delay },
        scale: { duration: 0.5, delay: slot.delay },
        y: { duration: 7, delay: slot.delay, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{
        top: slot.top,
        right: slot.right,
        width: slot.size,
        rotate: slot.rotate,
        ["--rarity" as string]: item.rarityColor,
      }}
      className="pointer-events-none absolute hidden overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/80 backdrop-blur-md xl:block"
    >
      <span className="rarity-strip block h-[3px] w-full" />
      <span className="relative block aspect-[4/3] overflow-hidden tech-grid">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(110% 80% at 50% 120%, ${item.rarityColor}33 0%, transparent 62%)`,
          }}
        />
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain p-3"
          />
        )}
      </span>
      <span className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
          {item.weapon}
        </span>
        <span className="spec-value shrink-0 text-[12px] font-bold text-[color:var(--color-accent)]">
          {symbol}
          {convert(item.price).toFixed(0)}
        </span>
      </span>
    </motion.div>
  );
}

export function HeroMarketplace({ stats, listedToday, floaters }: HeroProps) {
  const { convert, symbol } = useCurrency();
  const values: Record<(typeof STAT_ITEMS)[number]["key"], number> = {
    listings: stats.totalListings,
    value: Math.round(convert(stats.marketValue)),
    discount: stats.avgDiscountPct,
    today: listedToday,
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
      {/* Animated aurora backdrop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 78% at 82% 8%, rgba(124,58,237,0.30) 0%, transparent 62%), radial-gradient(48% 62% at 8% 100%, rgba(34,211,238,0.20) 0%, transparent 62%)",
        }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid opacity-70" />

      {floaters.slice(0, FLOAT_SLOTS.length).map((item, i) => (
        <FloatingCard key={item.listingId} item={item} slot={FLOAT_SLOTS[i]} />
      ))}

      <div className="relative p-6 sm:p-10 lg:p-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary-tint)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
            <Zap size={12} /> Instant Steam trades
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[color:var(--color-text)] sm:text-5xl lg:text-[3.4rem]">
            Buy &amp; sell CS2 skins.{" "}
            <span className="bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
            Thousands of skins with live float, pattern and cross-market price data.
            Trade straight from your Steam inventory — fast, fair, secure.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-6 text-sm font-bold text-[color:var(--color-primary-fg)] shadow-[var(--shadow-glow-violet)] transition hover:brightness-110"
            >
              Browse skins <ArrowRight size={16} />
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 text-sm font-bold text-[color:var(--color-text)] transition hover:border-[color:var(--color-primary)]"
            >
              <Wallet size={16} /> Sell skins
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-2 text-[13px] text-[color:var(--color-text-tertiary)]">
            <ShieldCheck size={15} className="text-[color:var(--color-accent)]" />
            Buyer protection on every trade · No password ever shared
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-[color:var(--color-border)] pt-6 lg:grid-cols-4">
          {STAT_ITEMS.map((s) => (
            <div
              key={s.key}
              className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[color:var(--color-bg-secondary)]/60"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)] transition-transform duration-200 group-hover:scale-110">
                <s.icon size={18} />
              </span>
              <span className="min-w-0">
                <CountUp
                  value={values[s.key]}
                  decimals={s.decimals}
                  prefix={s.key === "value" ? symbol : s.prefix}
                  suffix={s.suffix}
                  className="block font-display text-xl font-extrabold tabular-nums leading-none text-[color:var(--color-text)]"
                />
                <span className="mt-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                  {s.label}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
