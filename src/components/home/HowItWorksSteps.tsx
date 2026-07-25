"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Search, ShieldCheck, Repeat } from "lucide-react";
import { Panel } from "./Section";

const STEPS = [
  {
    icon: Search,
    title: "Find the exact float",
    body: "Filter by weapon, rarity, wear band, pattern index and StatTrak™. Every listing shows its real float and how it compares to the rest of the market.",
    cta: { label: "Open the catalog", href: "/catalog" },
    accent: "var(--color-primary)",
  },
  {
    icon: ShieldCheck,
    title: "Pay once, protected",
    body: "Checkout is escrowed until the trade lands in your inventory. We never ask for your Steam password or API key — only a trade link.",
    cta: { label: "Buyer protection", href: "/policies/payment" },
    accent: "var(--color-accent)",
  },
  {
    icon: Repeat,
    title: "Trade lands in minutes",
    body: "Accept the Steam trade offer and the skin is yours. Selling works the same way in reverse — list from your inventory and get paid on delivery.",
    cta: { label: "Start selling", href: "/sell" },
    accent: "var(--color-success)",
  },
];

export function HowItWorksSteps() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <Panel>
      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_1.05fr] lg:items-center">
      <div className="flex flex-col gap-2">
        {STEPS.map((s, i) => {
          const isActive = i === active;
          const StepIcon = s.icon;
          return (
            <button
              key={s.title}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                isActive
                  ? "border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-secondary)]"
                  : "border-transparent hover:bg-[color:var(--color-bg-secondary)]/60"
              }`}
            >
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${isActive ? s.accent : "var(--color-line-strong)"}22`, color: s.accent }}
              >
                <StepIcon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
                  Step {i + 1}
                </span>
                <span className="block truncate text-[14px] font-bold text-[color:var(--color-text)]">
                  {s.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: `radial-gradient(80% 90% at 100% 0%, ${step.accent}22 0%, transparent 60%)` }}
          />
          <div className="relative">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: `${step.accent}1f`, color: step.accent }}
            >
              <Icon size={22} />
            </span>
            <h3 className="mt-4 font-display text-xl font-extrabold tracking-tight text-[color:var(--color-text)]">
              {step.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {step.body}
            </p>
            <Link
              href={step.cta.href}
              className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[color:var(--color-primary)] hover:underline"
            >
              {step.cta.label} <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </Panel>
  );
}
