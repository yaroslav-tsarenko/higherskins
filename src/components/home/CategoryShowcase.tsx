"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { SkinCard } from "@/components/skins/SkinCard";
import type { CategoryShowcase as Showcase } from "@/lib/skins/queries";
import { Panel } from "./Section";

export function CategoryShowcase({
  groups,
}: {
  groups: Showcase[];
}) {
  const [active, setActive] = useState(0);
  if (!groups.length) return null;

  const current = groups[Math.min(active, groups.length - 1)];

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {groups.map((g, i) => {
          const isActive = i === active;
          return (
            <button
              key={g.category}
              onClick={() => setActive(i)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                isActive
                  ? "text-[color:var(--color-primary-fg)]"
                  : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="showcase-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-[color:var(--color-primary)]"
                />
              )}
              <span className="relative">{g.category}</span>
              <span
                className={`relative spec-value text-[11px] ${
                  isActive
                    ? "text-[color:var(--color-primary-fg)]/70"
                    : "text-[color:var(--color-text-tertiary)]"
                }`}
              >
                {g.count}
              </span>
            </button>
          );
        })}

        <Link
          href={`/catalog?category=${encodeURIComponent(current.category)}`}
          className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--color-primary)] hover:underline"
        >
          All {current.category} <ArrowRight size={14} />
        </Link>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {current.items.map((item) => (
            <SkinCard key={item.listingId} item={item} />
          ))}
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
}
