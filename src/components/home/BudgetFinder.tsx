"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Wallet } from "lucide-react";
import type { CatalogItem } from "@/lib/skins/queries";
import { Panel } from "./Section";

const MIN = 1;
const MAX = 5000;

// The slider moves on a log scale so the cheap end (where most listings live)
// gets as much travel as the four-figure knives.
function toBudget(t: number): number {
  return Math.round(MIN * Math.pow(MAX / MIN, t));
}

function toSlider(budget: number): number {
  return Math.log(budget / MIN) / Math.log(MAX / MIN);
}

const PRESETS = [10, 50, 250, 1000];

export function BudgetFinder({ pool }: { pool: CatalogItem[] }) {
  const [budget, setBudget] = useState(100);

  const { affordable, picks } = useMemo(() => {
    const affordable = pool.filter((i) => i.price <= budget);
    return { affordable, picks: affordable.slice(0, 4) };
  }, [pool, budget]);

  if (!pool.length) return null;

  return (
    <Panel className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(55% 70% at 100% 0%, rgba(124,58,237,0.16) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex flex-1 flex-col">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
            <Wallet size={13} /> Budget finder
          </div>
          <h3 className="mt-1 font-display text-xl font-extrabold tracking-tight text-[color:var(--color-text)]">
            What can I get for{" "}
            <span className="spec-value text-[color:var(--color-primary)]">${budget}</span>?
          </h3>

          <label className="mt-4 block">
            <span className="sr-only">Budget</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={toSlider(budget)}
              onChange={(e) => setBudget(toBudget(Number(e.target.value)))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--color-bg-secondary)] accent-[color:var(--color-primary)]"
            />
          </label>
          <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
            <span>${MIN}</span>
            <span>${MAX.toLocaleString("en-US")}+</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setBudget(p)}
                className={`rounded-full border px-3 py-1.5 spec-value text-[12px] font-bold transition-colors ${
                  budget === p
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"
                    : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-line-strong)]"
                }`}
              >
                ${p}
              </button>
            ))}
          </div>

        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {picks.map((item) => (
            <motion.div
              key={item.listingId}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
            >
              <Link
                href={`/skin/${item.skinId}?listing=${item.listingId}`}
                className="card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
                style={{ ["--rarity" as string]: item.rarityColor }}
              >
                <span className="rarity-strip block h-[3px] w-full" />
                <span className="relative block aspect-[4/3] overflow-hidden tech-grid">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="flex flex-1 flex-col gap-1 p-2.5">
                  <span className="line-clamp-2 text-[12px] font-semibold leading-tight text-[color:var(--color-text)]">
                    {item.name}
                  </span>
                  <span className="mt-auto spec-value text-[13.5px] font-bold text-[color:var(--color-accent)]">
                    ${item.price.toFixed(2)}
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
          {!picks.length && (
            <p className="col-span-full rounded-xl border border-dashed border-[color:var(--color-border)] p-6 text-center text-[13px] text-[color:var(--color-text-tertiary)]">
              Nothing in this range yet — try a higher budget.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-4">
          <p className="text-[13px] text-[color:var(--color-text-secondary)]">
            <span className="spec-value font-bold text-[color:var(--color-text)]">
              {affordable.length}
            </span>{" "}
            of {pool.length} sampled listings fit this budget.
          </p>
          <Link
            href={`/catalog?priceMax=${budget}&sort=discount`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 text-[13px] font-bold text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
          >
            Shop under ${budget} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Panel>
  );
}
