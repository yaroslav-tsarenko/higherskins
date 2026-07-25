"use client";

import { motion } from "framer-motion";
import { Activity, Boxes, Crosshair, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { CountUp } from "./CountUp";
import { Panel } from "./Section";
import type { MarketPulse } from "@/lib/skins/queries";

function TrendBars({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(...series, 1);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden>
      {series.map((v, i) => (
        <motion.span
          key={i}
          initial={{ height: 2 }}
          whileInView={{ height: `${Math.max(8, (v / max) * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.02 }}
          className="flex-1 rounded-sm"
          style={{ background: color, opacity: 0.35 + (v / max) * 0.65 }}
        />
      ))}
    </div>
  );
}

function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  const color = up ? "var(--color-success)" : "var(--color-danger)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 spec-value text-[11px] font-bold"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function MetricPanel({
  icon: Icon,
  label,
  children,
  footer,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Panel className="group transition-colors hover:border-[color:var(--color-border-hover)]">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)] transition-transform duration-200 group-hover:scale-110">
          <Icon size={14} />
        </span>
        {label}
      </div>
      <div className="mt-4 font-display text-[26px] font-extrabold leading-none tabular-nums text-[color:var(--color-text)]">
        {children}
      </div>
      <div className="mt-auto pt-4">{footer}</div>
    </Panel>
  );
}

export function MarketDashboard({ pulse }: { pulse: MarketPulse }) {
  const supply = pulse.supplyTrend.map((d) => d.count);
  const hasSales = pulse.soldCount > 0;

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricPanel
        icon={Boxes}
        label="Active listings"
        footer={<TrendBars series={supply} color="var(--color-primary)" />}
      >
        <CountUp value={pulse.activeListings} />
      </MetricPanel>

      <MetricPanel
        icon={DollarSign}
        label="Average price"
        footer={
          <p className="text-[12px] text-[color:var(--color-text-tertiary)]">
            Across every available listing
          </p>
        }
      >
        <CountUp value={pulse.avgPrice} decimals={2} prefix="$" />
      </MetricPanel>

      <MetricPanel
        icon={Activity}
        label="Listed today"
        footer={<Delta pct={pulse.growthPct} />}
      >
        <CountUp value={pulse.listedToday} />
      </MetricPanel>

      <MetricPanel
        icon={Crosshair}
        label="Most traded weapon"
        footer={
          <p className="text-[12px] text-[color:var(--color-text-tertiary)]">
            {pulse.topWeapon
              ? `${pulse.topWeapon.listings.toLocaleString("en-US")} listings live`
              : "No listings yet"}
          </p>
        }
      >
        <span className="block truncate text-[22px]">{pulse.topWeapon?.weapon ?? "—"}</span>
      </MetricPanel>

      <MetricPanel
        icon={TrendingUp}
        label="Settled volume"
        footer={
          <p className="text-[12px] text-[color:var(--color-text-tertiary)]">
            {hasSales
              ? `${pulse.soldCount.toLocaleString("en-US")} trades completed`
              : "Awaiting the first settled trade"}
          </p>
        }
      >
        <CountUp value={pulse.soldVolume} decimals={2} prefix="$" />
      </MetricPanel>
    </div>
  );
}
