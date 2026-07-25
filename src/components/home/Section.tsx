/**
 * Homepage layout primitives. Every marketplace section is built from these so
 * padding, radii, borders and the eyebrow → heading → action → content rhythm
 * stay identical across the page. Never style a section shell inline.
 */

import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("flex flex-col", className)}>
      {children}
    </section>
  );
}

export function SectionHead({
  icon: Icon,
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
          <Icon size={13} /> {eyebrow}
        </div>
        <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[color:var(--color-text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {href && cta && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] px-3.5 py-2 text-[13px] font-semibold text-[color:var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)]"
        >
          {cta} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

/**
 * The single card surface used by every block. `h-full` by default so two
 * panels sharing a grid row always end at the same baseline.
 */
export function Panel({
  className,
  padded = true,
  children,
}: {
  className?: string;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Row of equal-width, equal-height panels. */
export function PanelGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
}) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  } as const;
  return (
    <div className={cn("grid grid-cols-1 items-stretch gap-6", map[cols], className)}>
      {children}
    </div>
  );
}
