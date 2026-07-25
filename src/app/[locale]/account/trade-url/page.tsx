"use client";

import { useEffect, useState } from "react";
import { Link2, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";

interface SteamStatus {
  steamId64: string;
  personaName: string | null;
  avatar: string | null;
  tradeUrl: string | null;
  tradeUrlVerified: boolean;
}

export default function TradeUrlPage() {
  const [status, setStatus] = useState<SteamStatus | null>(null);
  const [tradeUrl, setTradeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/account/trade-url")
      .then((r) => (r.ok ? r.json() : { steam: null }))
      .then((data) => {
        if (data.steam) {
          setStatus(data.steam);
          setTradeUrl(data.steam.tradeUrl || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/trade-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save your trade URL.");
      } else {
        setSaved(true);
        setStatus((s) => (s ? { ...s, tradeUrl, tradeUrlVerified: true } : s));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-[color:var(--color-text-tertiary)]">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
          <Link2 size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--color-text)]">
            Trade URL
          </h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Required so buyers and our bot can send you trade offers.
          </p>
        </div>
      </div>

      {status?.tradeUrlVerified && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10 px-4 py-3 text-sm font-semibold text-[color:var(--color-success)]">
          <Check size={16} /> Your trade URL is verified and ready.
        </div>
      )}

      <form onSubmit={save} className="mt-5">
        <label className="mb-2 block text-[13px] font-semibold text-[color:var(--color-text)]">
          Steam trade URL
        </label>
        <input
          type="url"
          value={tradeUrl}
          onChange={(e) => setTradeUrl(e.target.value)}
          placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…"
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none"
        />

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {saved && !error && (
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-success)]">
            <Check size={15} /> Saved.
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || !tradeUrl.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-6 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save trade URL
          </button>
          <a
            href="https://steamcommunity.com/id/me/tradeoffers/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--color-accent)] hover:underline"
          >
            Find your trade URL on Steam <ExternalLink size={13} />
          </a>
        </div>
      </form>
    </div>
  );
}
