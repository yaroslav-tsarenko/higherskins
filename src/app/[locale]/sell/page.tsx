import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getSessionUser } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { Tag, Wallet, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: `Sell skins — ${brand.displayName}`,
  description: `List your CS2 skins on ${brand.displayName} and get paid fast. Competitive fees, instant Steam delivery, buyer protection.`,
};

const STEPS = [
  { icon: Zap, title: "Sign in through Steam", text: "Link your account in seconds — no password, no email." },
  { icon: Tag, title: "Pick items & set prices", text: "We suggest a fair price from live cross-market data. You stay in control." },
  { icon: Wallet, title: "Get paid on sale", text: "Funds land in your HigherSkins balance the moment a buyer completes the trade." },
];

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const user = await getSessionUser();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-bg-elevated)] via-[color:var(--color-bg)] to-[color:var(--color-bg-elevated)] p-8 sm:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary-tint)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
          <Tag size={12} /> Sell on HigherSkins
        </span>
        <h1 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-[color:var(--color-text)] sm:text-4xl">
          Turn your inventory into balance — fast, fair, and secure.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
          List straight from your Steam inventory with prices benchmarked against
          Steam, Buff, CSFloat and more. No listing fees to get started.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link
              href="/account"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Go to my inventory <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/auth"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Start selling <ArrowRight size={16} />
            </Link>
          )}
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] px-5 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-primary)]"
          >
            Browse the market
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                <s.icon size={18} />
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
                Step {i + 1}
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-[color:var(--color-text)]">
              {s.title}
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {s.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)] p-5 text-sm text-[color:var(--color-text-secondary)]">
        <ShieldCheck size={20} className="shrink-0 text-[color:var(--color-accent)]" />
        Every trade is delivered through Steam’s official trade system with buyer
        and seller protection. HigherSkins never holds your items outside a live sale.
      </div>
    </div>
  );
}
