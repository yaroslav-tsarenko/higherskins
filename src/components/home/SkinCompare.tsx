"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { EXTERIORS, RARITY_TIERS, exteriorMeta } from "@/lib/skins/shared";
import type { CatalogItem } from "@/lib/skins/queries";
import { Panel } from "./Section";

// Metrics are derived from listing data only — no invented popularity scores.
function rarityRank(item: CatalogItem): number {
  return RARITY_TIERS[item.rarity]?.order ?? 0;
}

function wearScore(item: CatalogItem): number {
  if (item.float == null) return 0.5;
  return 1 - Math.min(1, Math.max(0, item.float));
}

function ComparePicker({
  label,
  pool,
  value,
  onChange,
}: {
  label: string;
  pool: CatalogItem[];
  value: CatalogItem;
  onChange: (item: CatalogItem) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
        {label}
      </span>
      <select
        value={value.listingId}
        onChange={(e) => {
          const next = pool.find((i) => i.listingId === e.target.value);
          if (next) onChange(next);
        }}
        className="w-full truncate rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[13px] font-semibold text-[color:var(--color-text)] outline-none transition-colors focus:border-[color:var(--color-primary)]"
      >
        {pool.map((i) => (
          <option key={i.listingId} value={i.listingId}>
            {i.name} — ${i.price.toFixed(2)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompareCard({ item }: { item: CatalogItem }) {
  const ext = exteriorMeta(item.exterior);
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
      style={{ ["--rarity" as string]: item.rarityColor }}
    >
      <span className="rarity-strip block h-[3px] w-full" />
      <div className="relative aspect-[16/10] overflow-hidden tech-grid">
        {item.imageUrl && (
          <motion.img
            key={item.listingId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="truncate text-[13px] font-bold text-[color:var(--color-text)]">
          {item.name}
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
          {item.rarity}
          {ext && <span>· {ext.short}</span>}
        </span>
      </div>
    </div>
  );
}

function StatRow({
  label,
  left,
  right,
  leftBetter,
  rightBetter,
}: {
  label: string;
  left: string;
  right: string;
  leftBetter?: boolean;
  rightBetter?: boolean;
}) {
  const cls = (better?: boolean) =>
    `spec-value text-[13px] font-bold ${
      better ? "text-[color:var(--color-success)]" : "text-[color:var(--color-text)]"
    }`;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-[color:var(--color-border)] py-2.5 first:border-t-0">
      <span className={`${cls(leftBetter)} text-left`}>{left}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
        {label}
      </span>
      <span className={`${cls(rightBetter)} text-right`}>{right}</span>
    </div>
  );
}

export function SkinCompare({ pool }: { pool: CatalogItem[] }) {
  const options = useMemo(() => pool.slice(0, 60), [pool]);
  const [left, setLeft] = useState(options[0]);
  const [right, setRight] = useState(options[Math.min(1, options.length - 1)]);

  if (options.length < 2 || !left || !right) return null;

  const priceDiff = left.price - right.price;
  const leftWear = wearScore(left);
  const rightWear = wearScore(right);
  const leftDiscount = left.discountPct ?? 0;
  const rightDiscount = right.discountPct ?? 0;

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  return (
    <Panel>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <ComparePicker label="Skin A" pool={options} value={left} onChange={setLeft} />
        <button
          onClick={swap}
          aria-label="Swap skins"
          className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center self-end justify-self-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-text)]"
        >
          <ArrowLeftRight size={15} />
        </button>
        <ComparePicker label="Skin B" pool={options} value={right} onChange={setRight} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <CompareCard item={left} />
        <CompareCard item={right} />
      </div>

      <div className="mt-4">
        <StatRow
          label="Price"
          left={`$${left.price.toFixed(2)}`}
          right={`$${right.price.toFixed(2)}`}
          leftBetter={left.price < right.price}
          rightBetter={right.price < left.price}
        />
        <StatRow
          label="Rarity tier"
          left={String(rarityRank(left) + 1)}
          right={String(rarityRank(right) + 1)}
          leftBetter={rarityRank(left) > rarityRank(right)}
          rightBetter={rarityRank(right) > rarityRank(left)}
        />
        <StatRow
          label="Float"
          left={left.float != null ? left.float.toFixed(4) : "—"}
          right={right.float != null ? right.float.toFixed(4) : "—"}
          leftBetter={leftWear > rightWear}
          rightBetter={rightWear > leftWear}
        />
        <StatRow
          label="Below Steam"
          left={`${leftDiscount.toFixed(1)}%`}
          right={`${rightDiscount.toFixed(1)}%`}
          leftBetter={leftDiscount > rightDiscount}
          rightBetter={rightDiscount > leftDiscount}
        />
        <StatRow
          label="Wear band"
          left={exteriorMeta(left.exterior)?.label ?? "—"}
          right={exteriorMeta(right.exterior)?.label ?? "—"}
          leftBetter={
            EXTERIORS.findIndex((e) => e.code === left.exterior) <
            EXTERIORS.findIndex((e) => e.code === right.exterior)
          }
          rightBetter={
            EXTERIORS.findIndex((e) => e.code === right.exterior) <
            EXTERIORS.findIndex((e) => e.code === left.exterior)
          }
        />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-4">
        <p className="text-[13px] text-[color:var(--color-text-secondary)]">
          {priceDiff === 0 ? (
            "Both listings cost the same."
          ) : (
            <>
              <span className="spec-value font-bold text-[color:var(--color-text)]">
                ${Math.abs(priceDiff).toFixed(2)}
              </span>{" "}
              cheaper on the {priceDiff > 0 ? "right" : "left"}.
            </>
          )}
        </p>
        <Link
          href={`/skin/${(priceDiff > 0 ? right : left).skinId}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[color:var(--color-primary)] hover:underline"
        >
          Open cheaper listing <ArrowRight size={14} />
        </Link>
      </div>
    </Panel>
  );
}
