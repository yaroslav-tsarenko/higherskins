"use client";

import { useState } from "react";
import { EXTERIORS } from "@/lib/skins/shared";
import { Panel } from "./Section";

// Only the five real wear buckets (drop the NA sentinel).
const BUCKETS = EXTERIORS.filter((e) => e.code !== "NA");

function bucketForFloat(f: number) {
  return (
    BUCKETS.find((b) => f >= b.floatMin && f < b.floatMax) ?? BUCKETS[BUCKETS.length - 1]
  );
}

export function WearSlider() {
  const [float, setFloat] = useState(0.21);
  const active = bucketForFloat(float);

  return (
    <Panel>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
            Wear explained
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Every skin has a float value. Drag to see how it maps to condition.
          </p>
        </div>
        <div className="text-right">
          <div className="spec-value text-2xl font-extrabold leading-none text-[color:var(--color-text)]">
            {float.toFixed(4)}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
            Float
          </div>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.0001}
        value={float}
        onChange={(e) => setFloat(parseFloat(e.target.value))}
        aria-label="Float value"
        className="wear-slider h-2 w-full cursor-pointer appearance-none rounded-full"
      />

      {/* Bucket segments */}
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {BUCKETS.map((b) => {
          const isActive = b.code === active.code;
          return (
            <button
              key={b.code}
              onClick={() => setFloat((b.floatMin + b.floatMax) / 2)}
              className={`rounded-lg border px-1 py-2 text-center transition-all ${
                isActive
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)]"
                  : "border-[color:var(--color-border)] hover:border-[color:var(--color-line-strong)]"
              }`}
            >
              <div
                className={`spec-value text-[13px] font-bold ${
                  isActive ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-text)]"
                }`}
              >
                {b.short}
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[color:var(--color-text-tertiary)]">
                {b.floatMin.toFixed(2)}–{b.floatMax.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between rounded-xl bg-[color:var(--color-bg-secondary)] px-4 py-3">
          <span className="text-sm text-[color:var(--color-text-secondary)]">This float is</span>
          <span className="text-sm font-bold text-[color:var(--color-text)]">{active.label}</span>
        </div>
      </div>
    </Panel>
  );
}
