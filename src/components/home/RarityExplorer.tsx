"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { RarityBucket } from "@/lib/skins/queries";
import { Panel } from "./Section";

// Canonical rarity order + palette (mirrors the CS2 tokens in globals.css).
const RARITY_META: { match: string; color: string }[] = [
  { match: "consumer", color: "var(--color-rarity-consumer)" },
  { match: "industrial", color: "var(--color-rarity-industrial)" },
  { match: "mil-spec", color: "var(--color-rarity-milspec)" },
  { match: "restricted", color: "var(--color-rarity-restricted)" },
  { match: "classified", color: "var(--color-rarity-classified)" },
  { match: "covert", color: "var(--color-rarity-covert)" },
  { match: "extraordinary", color: "var(--color-rarity-gold)" },
  { match: "contraband", color: "var(--color-rarity-contraband)" },
];

function colorFor(rarity: string): string {
  const key = rarity.toLowerCase();
  return RARITY_META.find((m) => key.includes(m.match))?.color ?? "var(--color-rarity-consumer)";
}

function orderFor(rarity: string): number {
  const key = rarity.toLowerCase();
  const i = RARITY_META.findIndex((m) => key.includes(m.match));
  return i === -1 ? 99 : i;
}

export function RarityExplorer({ buckets }: { buckets: RarityBucket[] }) {
  const sorted = [...buckets].sort((a, b) => orderFor(a.rarity) - orderFor(b.rarity));
  const [active, setActive] = useState(0);
  if (!sorted.length) return null;

  const current = sorted[active];
  const color = colorFor(current.rarity);
  const maxCount = Math.max(...sorted.map((b) => b.count), 1);

  return (
    <Panel>
      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      {/* Tier list */}
      <div className="flex flex-col gap-1.5">
        {sorted.map((b, i) => {
          const c = colorFor(b.rarity);
          const isActive = i === active;
          return (
            <button
              key={b.rarity}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                isActive
                  ? "border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-secondary)]"
                  : "border-transparent hover:bg-[color:var(--color-bg-secondary)]/60"
              }`}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c }} />
              <span className="flex-1 truncate text-[13.5px] font-semibold text-[color:var(--color-text)]">
                {b.rarity}
              </span>
              <span className="relative hidden h-1.5 w-20 overflow-hidden rounded-full bg-[color:var(--color-bg-secondary)] sm:block">
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${(b.count / maxCount) * 100}%`, background: c }}
                />
              </span>
              <span className="spec-value w-10 shrink-0 text-right text-[13px] font-bold text-[color:var(--color-text-secondary)]">
                {b.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active detail */}
      <motion.div
        key={current.rarity}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-6"
        style={{ ["--rarity" as string]: color }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: `radial-gradient(80% 90% at 100% 0%, ${color}22 0%, transparent 60%)` }}
        />
        <span className="rarity-strip mb-4 block h-1 w-14 rounded-full" />
        <div className="relative">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
            Rarity tier
          </div>
          <h3 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[color:var(--color-text)]">
            {current.rarity}
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <div className="spec-value text-3xl font-extrabold text-[color:var(--color-text)]">
                {current.count}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                Skins available
              </div>
            </div>
            <div>
              <div className="spec-value text-3xl font-extrabold text-[color:var(--color-accent)]">
                {current.fromPrice != null ? `$${current.fromPrice.toFixed(2)}` : "—"}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                From
              </div>
            </div>
          </div>
          <Link
            href={`/catalog?rarity=${encodeURIComponent(current.rarity)}`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 text-[13px] font-bold text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
          >
            Explore {current.rarity} <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
      </div>
    </Panel>
  );
}
