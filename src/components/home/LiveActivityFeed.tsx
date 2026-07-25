"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Radio, ShoppingBag, PlusCircle, TrendingDown } from "lucide-react";
import { exteriorMeta } from "@/lib/skins/shared";
import type { ActivityEvent, ActivityKind } from "@/lib/skins/queries";
import { Panel } from "./Section";

const KIND_META: Record<ActivityKind, { label: string; icon: React.ElementType; color: string }> = {
  sold: { label: "sold", icon: ShoppingBag, color: "var(--color-success)" },
  listed: { label: "listed", icon: PlusCircle, color: "var(--color-accent)" },
  price_drop: { label: "price drop", icon: TrendingDown, color: "var(--color-warning)" },
};

function relativeTime(iso: string, now: number | null): string {
  if (now == null) return "just now";
  const diff = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ActivityRow({ event, now }: { event: ActivityEvent; now: number | null }) {
  const meta = KIND_META[event.kind];
  const Icon = meta.icon;
  const ext = exteriorMeta(event.exterior);

  return (
    <Link
      href={`/skin/${event.skinId}`}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-secondary)]"
    >
      <span className="relative flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--color-bg-secondary)]">
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: event.rarityColor }}
        />
        {event.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[color:var(--color-text)]">
          {event.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: meta.color }}
          >
            <Icon size={10} /> {meta.label}
          </span>
          {ext && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
              · {ext.short}
            </span>
          )}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block spec-value text-[13.5px] font-bold text-[color:var(--color-text)]">
          ${event.price.toFixed(2)}
        </span>
        <span className="block font-mono text-[10px] tabular-nums text-[color:var(--color-text-tertiary)]">
          {relativeTime(event.at, now)}
        </span>
      </span>
    </Link>
  );
}

/**
 * Rolling feed of real marketplace events. `events` is the server payload; the
 * component only rotates the window it shows, so swapping in a websocket or a
 * polled API later means replacing the prop, not the UI.
 */
export function LiveActivityFeed({
  events,
  visible = 7,
  intervalMs = 3500,
}: {
  events: ActivityEvent[];
  visible?: number;
  intervalMs?: number;
}) {
  const [offset, setOffset] = useState(0);
  // Stays null through SSR and the first paint so timestamps can't hydrate stale.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    if (events.length <= visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => cancelAnimationFrame(frame);
    }

    const id = setInterval(() => {
      setOffset((o) => (o + 1) % events.length);
      setNow(Date.now());
    }, intervalMs);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [events.length, visible, intervalMs]);

  if (!events.length) return null;

  const window_ = Array.from(
    { length: Math.min(visible, events.length) },
    (_, i) => events[(offset + i) % events.length],
  );

  return (
    <Panel>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-success)] opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-success)]" />
        </span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
          Live activity
        </span>
        <Radio size={13} className="ml-auto text-[color:var(--color-text-tertiary)]" />
      </div>

      <div className="flex flex-col gap-0.5">
        <AnimatePresence initial={false} mode="popLayout">
          {window_.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.24 }}
            >
              <ActivityRow event={event} now={now} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Panel>
  );
}
