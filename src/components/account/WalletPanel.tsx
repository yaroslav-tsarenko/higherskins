"use client";

import { useState } from "react";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyProvider";

export interface WalletTx {
  id: string;
  type: string;
  status: string;
  amount: number; // signed, EUR base
  description: string | null;
  createdAt: string;
}

const PRESETS = [10, 25, 50, 100, 250];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
  completed: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  failed: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]",
};

const TYPE_LABELS: Record<string, string> = {
  topup: "Top-up",
  purchase: "Purchase",
  refund: "Refund",
};

export function WalletPanel({
  balanceEur,
  transactions,
  hasAddress,
}: {
  balanceEur: number;
  transactions: WalletTx[];
  hasAddress: boolean;
}) {
  const { format, symbol, currency, rates } = useCurrency();
  const [amount, setAmount] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startTopUp() {
    setError(null);
    if (!hasAddress) {
      setError("Add a billing address in your account before topping up.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Enter an amount to top up.");
      return;
    }
    setSubmitting(true);
    try {
      // Presets are in the display currency; the wallet is held in EUR.
      const rate = rates[currency] || 1;
      const amountEur = Math.round((amount / rate) * 100) / 100;
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountEur }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start the top-up.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
          <Wallet size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--color-text)]">Wallet</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Top up your balance to buy skins instantly.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <div className="relative p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(70% 90% at 100% 0%, rgba(124,58,237,0.18) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
              Available balance
            </span>
            <div className="mt-1 font-display text-4xl font-extrabold tabular-nums text-[color:var(--color-text)]">
              {format(balanceEur)}
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--color-border)] p-6">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
            Add funds
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((v) => {
              const active = amount === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold tabular-nums transition-colors ${
                    active
                      ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"
                      : "border-[color:var(--color-border)] text-[color:var(--color-text)] hover:border-[color:var(--color-primary)]"
                  }`}
                >
                  {symbol}
                  {v}
                </button>
              );
            })}
            <div className="flex items-center gap-1 rounded-xl border border-[color:var(--color-border)] px-3">
              <span className="text-sm font-bold text-[color:var(--color-text-tertiary)]">{symbol}</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-20 bg-transparent py-2 text-sm font-bold tabular-nums text-[color:var(--color-text)] outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-[13px] font-semibold text-[color:var(--color-danger)]">{error}</p>
          )}

          <button
            type="button"
            onClick={startTopUp}
            disabled={submitting}
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-6 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Redirecting…
              </>
            ) : (
              <>
                <Plus size={16} /> Add {symbol}
                {amount}
              </>
            )}
          </button>
          <p className="mt-2 text-[12px] text-[color:var(--color-text-tertiary)]">
            Secured card payment. Funds are available the moment your payment clears.
          </p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold text-[color:var(--color-text)]">
        Transaction history
      </h2>
      {transactions.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8 text-center text-sm text-[color:var(--color-text-secondary)]">
          No transactions yet. Add funds to get started.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {transactions.map((tx) => {
            const credit = tx.amount >= 0;
            return (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      credit
                        ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
                        : "bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text-secondary)]"
                    }`}
                  >
                    {credit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                      {tx.description || TYPE_LABELS[tx.type] || tx.type}
                    </div>
                    <div className="font-mono text-[11px] text-[color:var(--color-text-tertiary)]">
                      {new Date(tx.createdAt).toLocaleDateString()} · {TYPE_LABELS[tx.type] || tx.type}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      credit ? "text-[color:var(--color-success)]" : "text-[color:var(--color-text)]"
                    }`}
                  >
                    {credit ? "+" : "−"}
                    {format(Math.abs(tx.amount))}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${
                      STATUS_STYLES[tx.status] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
