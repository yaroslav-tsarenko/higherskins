"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceMover } from "@/lib/skins/queries";

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 72;
      const y = 24 - ((p - min) / span) * 22 - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="72" height="24" viewBox="0 0 72 24" fill="none" aria-hidden className="shrink-0">
      <path d={`${d} L72 24 L0 24 Z`} fill={color} fillOpacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoverRow({ mover, up }: { mover: PriceMover; up: boolean }) {
  const color = up ? "var(--color-success)" : "var(--color-danger)";
  return (
    <Link
      href={`/skin/${mover.skinId}`}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-secondary)]"
    >
      <span className="relative flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--color-bg-secondary)]">
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: mover.rarityColor }}
        />
        {mover.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mover.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[color:var(--color-text)]">
          {mover.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
          {mover.weapon}
        </span>
      </span>

      <Sparkline points={mover.spark} color={color} />

      <span className="w-24 shrink-0 text-right">
        <span className="block spec-value text-[13.5px] font-bold text-[color:var(--color-text)]">
          ${mover.price.toFixed(2)}
        </span>
        <span
          className="inline-flex items-center gap-0.5 spec-value text-[11.5px] font-bold"
          style={{ color }}
        >
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {mover.changePct > 0 ? "+" : ""}
          {mover.changePct.toFixed(1)}%
        </span>
      </span>
    </Link>
  );
}

export function TopMovers({ gainers, losers }: { gainers: PriceMover[]; losers: PriceMover[] }) {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const list = tab === "gainers" ? gainers : losers;
  if (!list.length) return null;

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        {(["gainers", "losers"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              tab === key
                ? "text-[color:var(--color-text)]"
                : "text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)]"
            }`}
          >
            {tab === key && (
              <motion.span
                layoutId="movers-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-secondary)]"
              />
            )}
            <span className="relative">{key}</span>
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
          7d change
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-0.5"
        >
          {list.map((m) => (
            <MoverRow key={m.skinId} mover={m} up={tab === "gainers"} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
