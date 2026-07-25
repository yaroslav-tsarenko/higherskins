import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { ArrowRight, Rocket, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "This feature is on the way. Check back soon.",
};

export default function ComingSoonPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Coming soon" }]} />

      <section className="warm-dots relative mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-6 py-16 text-center sm:px-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
          <Rocket size={28} strokeWidth={1.5} />
        </div>
        <span className="eyebrow">Coming soon</span>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-4xl">
          We&apos;re building this.
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
          This feature isn&apos;t live yet, but it&apos;s on the roadmap. In the
          meantime, explore the market or reach out if you have questions.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-[color:var(--color-primary-fg)] transition-all hover:bg-[color:var(--color-primary-hover)]"
          >
            Back to market <ArrowRight size={15} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-line)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
          >
            <Bell size={15} /> Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
