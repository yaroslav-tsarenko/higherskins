import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NotFoundSearch } from "@/components/shared/NotFoundSearch";

export default function NotFound() {
  return (
    <main className="warm-dots relative mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span
        aria-hidden
        className="spec-value select-none text-[120px] font-bold leading-none text-[color:var(--color-line-strong)] sm:text-[168px]"
      >
        404
      </span>
      <div className="-mt-2 flex flex-col items-center gap-4">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
          Page not found
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          We couldn&rsquo;t find that page.
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
          The link may be out of date, or the item may have moved. Search the
          market or head back to browsing.
        </p>
      </div>

      <NotFoundSearch />

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary-fg)] transition-all hover:bg-[color:var(--color-primary-hover)]"
        >
          Back to market <ArrowRight size={13} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
