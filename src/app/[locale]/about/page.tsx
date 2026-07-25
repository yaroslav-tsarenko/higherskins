import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { brand, brandAddressLine } from "@/lib/brand";
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Repeat,
  BarChart3,
  Gauge,
  Users,
  Building2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${brand.displayName} — a modern CS2 skins marketplace built for fast, fair, transparent trading.`,
};

const stats = [
  { value: "10k+", label: "Skins listed", Icon: BarChart3 },
  { value: "< 60s", label: "Median delivery", Icon: Gauge },
  { value: "24/7", label: "Automated trading", Icon: Zap },
  { value: "100%", label: "Buyer protection", Icon: ShieldCheck },
];

const values = [
  {
    Icon: Zap,
    title: "Speed by default",
    body: "Our trade bot fires the moment a payment clears — most skins land in your inventory within seconds, not hours.",
  },
  {
    Icon: ShieldCheck,
    title: "Fair & protected",
    body: "Funds are only captured once a trade offer is confirmed. Every purchase is covered by buyer protection, end to end.",
  },
  {
    Icon: BarChart3,
    title: "Radical transparency",
    body: "Live float, pattern index and cross-market pricing on every listing. You always see exactly what you're buying.",
  },
  {
    Icon: Repeat,
    title: "Built for traders",
    body: "Buy for balance, sell back in a click, and track every trade with a live delivery status. No dead ends.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      {/* Hero */}
      <section className="warm-dots overflow-hidden rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-6 py-12 text-center sm:px-10 sm:py-16">
        <span className="eyebrow">About {brand.displayName}</span>
        <h1 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[44px] sm:leading-[1.05]">
          The fast, fair way to trade{" "}
          <span className="text-[color:var(--color-accent)]">CS2 skins</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[color:var(--color-text-secondary)] sm:text-lg">
          {brand.description}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-[color:var(--color-primary-fg)] transition-all hover:bg-[color:var(--color-primary-hover)]"
          >
            Browse the market <ArrowRight size={15} />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-line)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ value, label, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5 text-center"
          >
            <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <div className="spec-value text-2xl font-semibold text-[color:var(--color-text)]">
              {value}
            </div>
            <div className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">{label}</div>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="eyebrow">Our mission</span>
          <h2 className="mb-4 mt-2 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
            Trading skins shouldn&apos;t feel like a gamble.
          </h2>
          <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
            <p>
              We started {brand.displayName} because buying and selling CS2 skins
              was needlessly opaque — hidden fees, unclear float, slow deliveries
              and the constant worry of getting scammed on peer-to-peer trades.
            </p>
            <p>
              So we built a marketplace around three ideas: show everything, move
              instantly, and protect every trade. Prices, float and pattern are on
              the table before you commit. Our bot handles delivery automatically.
              And your balance is only ever spent on a confirmed trade.
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {values.slice(0, 2).map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-[color:var(--color-text)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values grid */}
      <section className="mt-10">
        <div className="mb-6 text-center">
          <span className="eyebrow">What we stand for</span>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
            Principles behind every trade
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="card-lift rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-[color:var(--color-text)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
            <Building2 size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-[color:var(--color-text)]">The company</h3>
            <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              {brand.displayName} is operated by {brand.company.legalName},
              registered in {brand.company.address.country} (Company No.{" "}
              {brand.company.number}).
            </p>
            <p className="mt-2 text-xs text-[color:var(--color-text-tertiary)]">{brandAddressLine}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
            <Users size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-[color:var(--color-text)]">Talk to us</h3>
            <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              Questions, feedback or a B2B enquiry? Our team replies within 24
              hours on weekdays.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:text-[color:var(--color-primary-hover)]"
            >
              Contact support <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 overflow-hidden rounded-3xl bg-[color:var(--color-primary)] px-6 py-12 text-center text-[color:var(--color-primary-fg)] sm:px-10">
        <h2 className="mx-auto max-w-xl font-serif text-2xl font-medium tracking-tight sm:text-3xl">
          Ready to find your next skin?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm opacity-90 sm:text-base">
          Thousands of listings with live float and cross-market pricing, ready
          to trade instantly.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary-fg)] px-6 py-3 text-sm font-bold text-[color:var(--color-primary)] transition-transform hover:scale-[1.02]"
        >
          Explore the market <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}
