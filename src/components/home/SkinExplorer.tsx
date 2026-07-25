"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { EXTERIORS, RARITY_TIERS, type ExteriorCode } from "@/lib/skins/shared";
import type { CatalogItem } from "@/lib/skins/queries";
import { Panel } from "./Section";

const PRICE_STEPS = [10, 50, 150, 500, 2000, Infinity];

function priceLabel(v: number): string {
  return v === Infinity ? "Any" : `$${v}`;
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active
          ? "border-transparent text-[color:var(--color-text)]"
          : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-line-strong)] hover:text-[color:var(--color-text)]"
      }`}
      style={
        active
          ? {
              background: color
                ? `color-mix(in srgb, ${color} 22%, transparent)`
                : "var(--color-primary-tint)",
              boxShadow: `inset 0 0 0 1px ${color ?? "var(--color-primary)"}`,
            }
          : undefined
      }
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function SkinExplorer({ pool }: { pool: CatalogItem[] }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [exteriors, setExteriors] = useState<ExteriorCode[]>([]);
  const [priceIdx, setPriceIdx] = useState(PRICE_STEPS.length - 1);

  const facets = useMemo(() => {
    const cats = new Map<string, number>();
    const rars = new Map<string, number>();
    for (const item of pool) {
      cats.set(item.category, (cats.get(item.category) ?? 0) + 1);
      rars.set(item.rarity, (rars.get(item.rarity) ?? 0) + 1);
    }
    return {
      categories: [...cats.keys()].sort(),
      rarities: [...rars.keys()].sort(
        (a, b) => (RARITY_TIERS[a]?.order ?? 99) - (RARITY_TIERS[b]?.order ?? 99),
      ),
    };
  }, [pool]);

  const maxPrice = PRICE_STEPS[priceIdx];

  const results = useMemo(
    () =>
      pool.filter(
        (i) =>
          (!categories.length || categories.includes(i.category)) &&
          (!rarities.length || rarities.includes(i.rarity)) &&
          (!exteriors.length || exteriors.includes(i.exterior)) &&
          i.price <= maxPrice,
      ),
    [pool, categories, rarities, exteriors, maxPrice],
  );

  const activeCount = categories.length + rarities.length + exteriors.length + (maxPrice === Infinity ? 0 : 1);

  const floatSpread = useMemo(() => {
    const buckets = EXTERIORS.map((e) => ({
      ...e,
      count: results.filter((i) => i.exterior === e.code).length,
    }));
    const total = buckets.reduce((acc, b) => acc + b.count, 0) || 1;
    return buckets.map((b) => ({ ...b, share: b.count / total }));
  }, [results]);

  const reset = () => {
    setCategories([]);
    setRarities([]);
    setExteriors([]);
    setPriceIdx(PRICE_STEPS.length - 1);
  };

  const params = new URLSearchParams();
  if (categories.length) params.set("category", categories.join(","));
  if (rarities.length) params.set("rarity", rarities.join(","));
  if (exteriors.length) params.set("exterior", exteriors.join(","));
  if (maxPrice !== Infinity) params.set("priceMax", String(maxPrice));

  return (
    <Panel padded={false}>
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Filter rail */}
        <div className="flex flex-col gap-5 border-b border-[color:var(--color-border)] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[color:var(--color-accent)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
              Filters
            </span>
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--color-text-tertiary)] transition-colors hover:text-[color:var(--color-text)]"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
              Category
            </div>
            <div className="flex flex-wrap gap-1.5">
              {facets.categories.map((c) => (
                <Chip
                  key={c}
                  active={categories.includes(c)}
                  onClick={() => setCategories((s) => toggle(s, c))}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
              Rarity
            </div>
            <div className="flex flex-wrap gap-1.5">
              {facets.rarities.map((r) => (
                <Chip
                  key={r}
                  active={rarities.includes(r)}
                  color={RARITY_TIERS[r]?.color}
                  onClick={() => setRarities((s) => toggle(s, r))}
                >
                  {r.replace(" Grade", "")}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
              Wear
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXTERIORS.map((e) => (
                <Chip
                  key={e.code}
                  active={exteriors.includes(e.code)}
                  onClick={() => setExteriors((s) => toggle(s, e.code))}
                >
                  {e.short}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
              <span>Max price</span>
              <span className="spec-value text-[color:var(--color-text)]">
                {priceLabel(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={PRICE_STEPS.length - 1}
              step={1}
              value={priceIdx}
              onChange={(e) => setPriceIdx(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--color-bg-secondary)] accent-[color:var(--color-primary)]"
              aria-label="Maximum price"
            />
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
              Wear distribution
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-[color:var(--color-bg-secondary)]">
              {floatSpread.map((b) => (
                <motion.span
                  key={b.code}
                  animate={{ flexGrow: Math.max(0.001, b.share) }}
                  transition={{ duration: 0.3 }}
                  title={`${b.label}: ${b.count}`}
                  className="h-full"
                  style={{
                    background: `color-mix(in srgb, var(--color-success) ${100 - b.floatMin * 100}%, var(--color-danger))`,
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
              <span>Factory New</span>
              <span>Battle-Scarred</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex min-w-0 flex-col p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--color-text-secondary)]">
              <Filter size={13} className="text-[color:var(--color-accent)]" />
              <span className="spec-value font-bold text-[color:var(--color-text)]">
                {results.length}
              </span>
              of {pool.length} sampled listings
            </span>
            <Link
              href={`/catalog${params.toString() ? `?${params}` : ""}`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary)] px-4 py-2 text-[13px] font-bold text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
            >
              Open in catalog <ArrowRight size={14} />
            </Link>
          </div>

          {results.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {results.slice(0, 8).map((item) => (
                  <motion.div
                    key={item.listingId}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
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
                          {item.name.split(" | ").slice(1).join(" | ") || item.name}
                        </span>
                        <span className="mt-auto flex items-center justify-between gap-2">
                          <span className="spec-value text-[13.5px] font-bold text-[color:var(--color-accent)]">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.float != null && (
                            <span className="font-mono text-[9.5px] tabular-nums text-[color:var(--color-text-tertiary)]">
                              {item.float.toFixed(3)}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[color:var(--color-border)] p-10 text-center text-[13px] text-[color:var(--color-text-tertiary)]">
              No listings match these filters — loosen one and try again.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
