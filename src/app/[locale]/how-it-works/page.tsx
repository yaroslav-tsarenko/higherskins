import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { brand } from "@/lib/brand";
import {
  ArrowRight,
  Search,
  Wallet,
  PackageCheck,
  ShieldCheck,
  Link2,
  BadgeCheck,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description: `How buying and selling CS2 skins works on ${brand.displayName} — link Steam, pay from balance, receive your skin in seconds.`,
};

const steps = [
  {
    Icon: Search,
    title: "Find your skin",
    body: "Browse the catalogue with live float, pattern index and cross-market pricing. Filter by weapon, wear, rarity and price to land on exactly what you want.",
  },
  {
    Icon: Wallet,
    title: "Pay from balance",
    body: "Top up your HigherSkins wallet and buy in a click. Your funds are only captured once the trade offer is confirmed — so every purchase is protected.",
  },
  {
    Icon: PackageCheck,
    title: "Receive in seconds",
    body: "Our bot sends a Steam trade offer the moment payment clears. Accept it and the skin lands in your inventory — usually within seconds.",
  },
];

const perks = [
  {
    Icon: BadgeCheck,
    title: "Verified authenticity",
    body: "Every listing shows live float, pattern index and cross-market pricing, so you know exactly what you're getting before you buy.",
  },
  {
    Icon: ShieldCheck,
    title: "Escrowed payments",
    body: "Your balance is only captured once the trade offer is confirmed. If delivery can't complete, you're refunded automatically.",
  },
  {
    Icon: Clock,
    title: "Delivery in seconds",
    body: "Our bot sends the Steam trade offer the moment payment clears — most skins arrive in your inventory within seconds.",
  },
];

const faqs = [
  {
    Icon: Clock,
    q: "Why do some trades have a hold?",
    a: "Steam applies a hold (up to 8 days) when the seller doesn't have Mobile Guard active. Buying from verified sellers means no hold.",
  },
  {
    Icon: ShieldCheck,
    q: "Is my purchase protected?",
    a: "Yes. Funds are only captured on a confirmed trade offer, and every purchase is covered by buyer protection end to end.",
  },
  {
    Icon: Link2,
    q: "Do I need a Steam account?",
    a: "You can sign up with just an email. Steam is only required at checkout, so our bot can deliver the skin to your inventory.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How it works" }]} />

      {/* Hero */}
      <section className="mb-10 text-center">
        <span className="eyebrow">How it works</span>
        <h1 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[44px] sm:leading-[1.05]">
          Buy a skin in{" "}
          <span className="text-[color:var(--color-accent)]">three steps</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[color:var(--color-text-secondary)] sm:text-lg">
          No middlemen, no waiting around. Here&apos;s exactly what happens from
          browse to inventory.
        </p>
      </section>

      {/* Buying steps */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map(({ Icon, title, body }, i) => (
          <div
            key={title}
            className="relative rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6"
          >
            <span className="spec-value absolute right-5 top-5 text-4xl font-semibold text-[color:var(--color-line-strong)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
              <Icon size={22} strokeWidth={1.5} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[color:var(--color-text)]">{title}</h3>
            <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{body}</p>
          </div>
        ))}
      </section>

      {/* Why buy with us */}
      <section className="mt-12">
        <div className="mb-6 text-center">
          <span className="eyebrow">Why {brand.displayName}</span>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
            Every purchase, fully protected
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {perks.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[color:var(--color-text)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick answers */}
      <section className="mt-12">
        <div className="mb-6 text-center">
          <span className="eyebrow">Good to know</span>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
            Quick answers
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {faqs.map(({ Icon, q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-[color:var(--color-text)]">{q}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{a}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:text-[color:var(--color-primary-hover)]"
          >
            See the full FAQ <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 overflow-hidden rounded-3xl bg-[color:var(--color-primary)] px-6 py-12 text-center text-[color:var(--color-primary-fg)] sm:px-10">
        <h2 className="mx-auto max-w-xl font-serif text-2xl font-medium tracking-tight sm:text-3xl">
          Start trading in minutes
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm opacity-90 sm:text-base">
          Sign up with email, link Steam at checkout, and get your skin in
          seconds.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#4C1D95] shadow-sm transition-transform hover:scale-[1.02]"
        >
          Browse the market <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}
