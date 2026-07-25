"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/lib/skins/queries";
import { Panel, PanelGrid } from "./Section";

export function FeaturedCollections({ collections }: { collections: Collection[] }) {
  const shown = collections.filter((c) => c.count > 0);
  if (!shown.length) return null;

  return (
    <PanelGrid cols={3}>
      {shown.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="h-full"
        >
          <Panel padded={false} className="transition-colors hover:border-[color:var(--color-border-hover)]">
          <Link href={c.href} className="group relative flex h-full flex-col p-5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(75% 85% at 100% 0%, color-mix(in srgb, ${c.accent} 22%, transparent) 0%, transparent 62%)`,
              }}
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid opacity-60" />

            <span className="relative flex items-start justify-between gap-3">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: c.accent }}
              >
                {c.count.toLocaleString("en-US")} listings
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] transition-all duration-200 group-hover:border-[color:var(--color-primary)] group-hover:text-[color:var(--color-text)]">
                <ArrowUpRight size={15} />
              </span>
            </span>

            <span className="relative mt-3">
              <span className="block font-display text-xl font-extrabold tracking-tight text-[color:var(--color-text)]">
                {c.title}
              </span>
              <span className="mt-1.5 block text-[13.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                {c.blurb}
              </span>
            </span>

            <span className="relative mt-auto flex items-end gap-2 pt-6">
              {c.covers.map((src, idx) => (
                <span
                  key={src}
                  className="relative flex h-16 flex-1 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] transition-transform duration-300"
                  style={{ transform: `translateY(${idx === 1 ? -6 : 0}px)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                  />
                </span>
              ))}
            </span>
          </Link>
          </Panel>
        </motion.div>
      ))}
    </PanelGrid>
  );
}
