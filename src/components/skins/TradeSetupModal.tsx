"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ExternalLink, Loader2, Lock, X } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyProvider";

export type PurchaseState = "anon" | "no-steam" | "no-trade-url" | "ready";

interface Fees {
  itemPrice: number;
  serviceFee: number;
  total: number;
}

export function TradeSetupModal({
  open,
  onClose,
  initialState,
  skinName,
  price,
  priceValue,
  listingId,
  next,
}: {
  open: boolean;
  onClose: () => void;
  initialState: PurchaseState;
  skinName: string;
  price: string;
  priceValue: number;
  listingId: string;
  next: string;
}) {
  const { format } = useCurrency();
  const [state, setState] = useState<PurchaseState>(initialState);
  const [tradeUrl, setTradeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [soldOut, setSoldOut] = useState(false);
  const [needTopUp, setNeedTopUp] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const steamHref = `/api/auth/steam?next=${encodeURIComponent(next)}`;
  // Signed-in email-only buyer: attach Steam to the SAME account instead of
  // spinning up a duplicate Steam-only user.
  const steamLinkHref = `${steamHref}&link=1`;
  const authHref = `/auth?next=${encodeURIComponent(next)}`;

  // Buyer-facing fee breakdown. Mirrors computeFees() on the server; the
  // authoritative total comes back from the purchase response.
  const fees: Fees = {
    itemPrice: priceValue,
    serviceFee: 0,
    total: priceValue,
  };

  const saveTradeUrl = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/trade-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save trade URL");
        return;
      }
      setState("ready");
    } catch {
      setError("Network error, please retry");
    } finally {
      setSaving(false);
    }
  };

  const confirmPurchase = async () => {
    setBuying(true);
    setBuyError(null);
    try {
      const res = await fetch("/api/skins/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "no_steam") {
          setState("no-steam");
        } else if (json.code === "no_trade_url") {
          setState("no-trade-url");
        } else if (json.code === "sold" || json.code === "not_found") {
          setSoldOut(true);
        } else if (json.code === "insufficient_balance") {
          setNeedTopUp(true);
        }
        setBuyError(json.error ?? "Could not complete the purchase.");
        return;
      }
      setDone(true);
    } catch {
      setBuyError("Network error, please retry.");
    } finally {
      setBuying(false);
    }
  };

  const step = state === "anon" || state === "no-steam" ? 1 : state === "no-trade-url" ? 2 : 3;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass relative w-full max-w-md rounded-2xl border border-[color:var(--color-border)] p-6">
        <button onClick={onClose} className="absolute right-4 top-4 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text)]">
          <X className="h-5 w-5" />
        </button>

        {/* stepper */}
        <div className="mb-5 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step > n
                    ? "bg-[color:var(--color-success)] text-black"
                    : step === n
                      ? "bg-[color:var(--color-primary)] text-white"
                      : "bg-[color:var(--color-bg-tertiary)] text-[color:var(--color-text-tertiary)]"
                }`}
              >
                {step > n ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              {n < 3 && <span className="h-px flex-1 bg-[color:var(--color-border)]" />}
            </div>
          ))}
        </div>

        {state === "anon" && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-primary-tint)]">
              <Lock className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[color:var(--color-text)]">Sign in to buy</h3>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              Create an account to buy <span className="font-semibold text-[color:var(--color-text)]">{skinName}</span>.
              You can link Steam now or right before delivery.
            </p>
            <Link
              href={authHref}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)] hover:brightness-110"
            >
              Continue with Email
            </Link>
            <a
              href={steamHref}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171a21] px-5 py-3 text-sm font-bold text-white hover:brightness-125"
            >
              Sign in through Steam
            </a>
          </div>
        )}

        {state === "no-steam" && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-primary-tint)]">
              <Lock className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[color:var(--color-text)]">Link your Steam account</h3>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              Skins are delivered through Steam. Link your Steam account to receive{" "}
              <span className="font-semibold text-[color:var(--color-text)]">{skinName}</span> — your HigherSkins
              account stays the same.
            </p>
            <a
              href={steamLinkHref}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171a21] px-5 py-3 text-sm font-bold text-white hover:brightness-125"
            >
              Link Steam account
            </a>
            <p className="mt-2 text-center text-xs text-[color:var(--color-text-tertiary)]">
              We never see your Steam password. Auth is handled by Steam OpenID.
            </p>
          </div>
        )}

        {state === "no-trade-url" && (
          <div>
            <h3 className="font-display text-lg font-bold text-[color:var(--color-text)]">Add your Trade URL</h3>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              We send skins to your Steam via a trade offer. Paste your Trade URL below.
            </p>
            <a
              href="https://steamcommunity.com/id/me/tradeoffers/privacy"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Where do I find it?
            </a>
            <input
              value={tradeUrl}
              onChange={(e) => setTradeUrl(e.target.value)}
              placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…"
              className="mt-3 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-primary)]"
            />
            {error && <p className="mt-2 text-sm text-[color:var(--color-danger)]">{error}</p>}
            <button
              onClick={saveTradeUrl}
              disabled={saving || !tradeUrl}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & continue
            </button>
            <p className="mt-2 text-center text-xs text-[color:var(--color-text-tertiary)]">
              Make sure Steam Mobile Guard is active and your inventory is public.
            </p>
          </div>
        )}

        {state === "ready" && (
          <div>
            {done ? (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-success)]/15">
                  <Check className="h-5 w-5 text-[color:var(--color-success)]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[color:var(--color-text)]">Trade offer on its way</h3>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  We&apos;re sending <span className="font-semibold text-[color:var(--color-text)]">{skinName}</span> to your
                  Steam. Accept the offer to receive it — track progress in My Trades.
                </p>
                <Link
                  href="/account/trades"
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white"
                >
                  View my trades
                </Link>
                <button onClick={onClose} className="mt-2 w-full rounded-xl border border-[color:var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)]">
                  Keep browsing
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-bold text-[color:var(--color-text)]">Confirm purchase</h3>
                <div className="mt-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3">
                  <div className="mb-2 border-b border-[color:var(--color-border)] pb-2 text-sm font-semibold text-[color:var(--color-text)]">
                    {skinName}
                  </div>
                  <div className="flex items-center justify-between py-0.5 text-sm">
                    <span className="text-[color:var(--color-text-secondary)]">Item price</span>
                    <span className="tnum text-[color:var(--color-text)]">{format(fees.itemPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 text-sm">
                    <span className="text-[color:var(--color-text-secondary)]">Buyer protection</span>
                    <span className="tnum font-semibold text-[color:var(--color-success)]">Free</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-[color:var(--color-border)] pt-2 text-sm">
                    <span className="font-semibold text-[color:var(--color-text)]">Total</span>
                    <span className="tnum font-bold text-[color:var(--color-text)]">{format(fees.total)}</span>
                  </div>
                </div>

                {buyError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {buyError}
                  </div>
                )}

                {soldOut ? (
                  <button
                    onClick={onClose}
                    className="mt-4 w-full rounded-xl border border-[color:var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)]"
                  >
                    Browse other offers
                  </button>
                ) : needTopUp ? (
                  <Link
                    href="/account/wallet"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)]"
                  >
                    Top up your wallet
                  </Link>
                ) : (
                  <button
                    onClick={confirmPurchase}
                    disabled={buying}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)] disabled:opacity-50"
                  >
                    {buying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Pay {price}
                  </button>
                )}
                <p className="mt-2 text-center text-xs text-[color:var(--color-text-tertiary)]">
                  Skin is sent to your Steam via trade offer after payment.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
