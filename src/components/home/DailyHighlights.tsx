"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Award, Crown, Percent, Sparkle, Swords } from "lucide-react";
import type { Highlight } from "@/lib/skins/queries";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Panel, PanelGrid } from "./Section";

const ICONS: Record<string, React.ElementType> = {
  discount: Percent,
  grail: Crown,
  float: Sparkle,
  knife: Swords,
};

export function DailyHighlights({ highlights }: { highlights: Highlight[] }) {
  const { format } = useCurrency();
  if (!highlights.length) return null;

  return (
    <PanelGrid cols={4}>
      {highlights.map((h, i) => {
        const Icon = ICONS[h.key] ?? Award;
        return (
          <motion.div
            key={h.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="h-full"
          >
            <Panel padded={false} className="card-lift">
              <Link href={`/skin/${h.item.skinId}`} className="group flex h-full flex-col">
                <span
                  className="flex items-center gap-1.5 border-b border-[color:var(--color-border)] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-accent)]"
                  style={{ ["--rarity" as string]: h.item.rarityColor }}
                >
                  <Icon size={12} /> {h.label}
                </span>
                <span className="relative block aspect-[16/10] overflow-hidden tech-grid">
                  {h.item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.item.imageUrl}
                      alt={h.item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="flex flex-1 flex-col gap-1 px-4 pb-4">
                  <span className="line-clamp-2 text-[13px] font-semibold leading-tight text-[color:var(--color-text)]">
                    {h.item.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
                    {h.note}
                  </span>
                  <span className="mt-auto pt-3 spec-value text-[15px] font-extrabold text-[color:var(--color-accent)]">
                    {format(h.item.price)}
                  </span>
                </span>
              </Link>
            </Panel>
          </motion.div>
        );
      })}
    </PanelGrid>
  );
}
