import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { HigherskinsLogo } from "@/components/layout/HigherskinsLogo";
import { ShieldCheck, TrendingUp, Zap, Mail, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: `Sign in — ${brand.displayName}`,
};

const PERKS = [
  { icon: TrendingUp, text: "Full price history & market analytics" },
  { icon: Zap, text: "Instant trades via your Steam account" },
  { icon: ShieldCheck, text: "Buyer protection on every purchase" },
];

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getSessionUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/account");

  const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
  const steamHref = `/api/auth/steam${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <HigherskinsLogo size={40} />
          <h1 className="mt-5 font-display text-2xl font-bold text-[color:var(--color-text)]">
            Sign in to {brand.displayName}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            Browse the market with email — link Steam whenever you&apos;re ready to trade.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 px-3 py-2 text-center text-sm text-[color:var(--color-danger)]">
            Steam sign-in failed. Please try again.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={`/auth/login${nextParam}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)] transition hover:brightness-110"
          >
            <Mail className="h-4 w-4" />
            Continue with Email
          </Link>
          <a
            href={steamHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171a21] px-5 py-3 text-sm font-bold text-white transition hover:brightness-125"
          >
            <SteamIcon />
            Sign in through Steam
          </a>
        </div>

        <p className="mt-4 text-center text-sm text-[color:var(--color-text-secondary)]">
          New here?{" "}
          <Link
            href={`/auth/register${nextParam}`}
            className="inline-flex items-center gap-1 font-semibold text-[color:var(--color-accent)] hover:opacity-80"
          >
            Create an account <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>

        <div className="my-6 h-px bg-[color:var(--color-border)]" />

        <ul className="flex flex-col gap-2">
          {PERKS.map((p) => (
            <li key={p.text} className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
              <p.icon className="h-4 w-4 shrink-0 text-[color:var(--color-accent)]" />
              {p.text}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-[color:var(--color-text-tertiary)]">
          We never see your Steam password. Auth is handled by Steam OpenID.{" "}
          <Link href="/policies/privacy" className="underline hover:text-[color:var(--color-text)]">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.98 2C6.65 2 2.28 6.1 2 11.36l5.36 2.22a2.79 2.79 0 0 1 1.57-.49h.14l2.38-3.46v-.05a3.72 3.72 0 1 1 3.72 3.72h-.09l-3.4 2.43v.13a2.8 2.8 0 0 1-5.58.2L2.5 14.4A10 10 0 1 0 11.98 2Zm-3.7 15.18-1.23-.5a2.1 2.1 0 0 0 1.08 1.03 2.1 2.1 0 0 0 2.75-1.13 2.1 2.1 0 0 0 0-1.6 2.1 2.1 0 0 0-1.14-1.14 2.09 2.09 0 0 0-1.6.02l1.27.53a1.54 1.54 0 1 1-1.13 2.86Zm8.6-7.87a2.48 2.48 0 1 0-4.96 0 2.48 2.48 0 0 0 4.96 0Zm-4.34 0a1.86 1.86 0 1 1 3.72 0 1.86 1.86 0 0 1-3.72 0Z" />
    </svg>
  );
}
