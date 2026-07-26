"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/providers/CurrencyProvider";

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

const RANGES = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
] as const;

export function PriceChart({ history }: { history: PricePoint[] }) {
  const { convert, format, symbol } = useCurrency();
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30d");

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 30;
    return history.slice(-days);
  }, [history, range]);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
    const volume = data.reduce((s, d) => s + d.volume, 0);
    return { min, max, last, changePct, volume };
  }, [data]);

  const up = (stats?.changePct ?? 0) >= 0;
  const stroke = up ? "var(--color-success)" : "var(--color-danger)";

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
            Price history
          </div>
          {stats && (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tnum font-display text-xl font-bold text-[color:var(--color-text)]">
                {format(stats.last)}
              </span>
              <span className={`tnum text-sm font-semibold ${up ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]"}`}>
                {up ? "▲" : "▼"} {Math.abs(stats.changePct).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                range === r.key
                  ? "bg-[color:var(--color-primary)] text-white"
                  : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => {
                const c = convert(v);
                return `${symbol}${c < 1 ? c.toFixed(2) : Math.round(c)}`;
              }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-text-secondary)" }}
              formatter={(value) => [format(Number(value)), "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#priceFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[color:var(--color-border)] pt-4">
          <Stat label="Low" value={format(stats.min)} />
          <Stat label="High" value={format(stats.max)} />
          <Stat label="Volume" value={stats.volume.toLocaleString()} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="tnum text-sm font-semibold text-[color:var(--color-text)]">{value}</div>
    </div>
  );
}
