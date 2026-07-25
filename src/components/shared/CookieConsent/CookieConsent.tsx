"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Cookie, Check, Shield, BarChart3, Sparkles } from "lucide-react";

type ConsentValue = "all" | "essential" | "custom";

export interface StoredConsent {
  value: ConsentValue;
  categories: { essential: true; analytics: boolean; marketing: boolean };
  timestamp: string;
}

const STORAGE_KEY = "higherskins-cookie-consent-v1";
export const COOKIE_SETTINGS_EVENT = "higherskins:cookie-settings";

function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredConsent) : null;
  } catch {
    return null;
  }
}

function writeConsent(consent: StoredConsent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    // Let analytics loaders react without a full reload.
    window.dispatchEvent(new CustomEvent("higherskins:consent-updated", { detail: consent }));
  } catch {
    /* noop */
  }
}

// Read a single category's consent (analytics loaders should call this before firing).
export function hasConsent(category: "analytics" | "marketing"): boolean {
  return readConsent()?.categories[category] ?? false;
}

// Programmatically reopen the banner (used by the footer link).
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      const timer = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, []);

  // Reopen when the footer (or anywhere) requests cookie settings.
  useEffect(() => {
    const reopen = () => {
      const existing = readConsent();
      if (existing) {
        setAnalytics(existing.categories.analytics);
        setMarketing(existing.categories.marketing);
      }
      setDetailsOpen(true);
      setOpen(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setDetailsOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    writeConsent({
      value: "all",
      categories: { essential: true, analytics: true, marketing: true },
      timestamp: new Date().toISOString(),
    });
    close();
  }, [close]);

  const acceptEssential = useCallback(() => {
    writeConsent({
      value: "essential",
      categories: { essential: true, analytics: false, marketing: false },
      timestamp: new Date().toISOString(),
    });
    close();
  }, [close]);

  const saveCustom = useCallback(() => {
    writeConsent({
      value: "custom",
      categories: { essential: true, analytics, marketing },
      timestamp: new Date().toISOString(),
    });
    close();
  }, [analytics, marketing, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ds-cookie-card"
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 16, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          role="dialog"
          aria-modal="false"
          aria-labelledby="ds-cookie-title"
          className="glass fixed bottom-4 left-4 z-[70] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-[color:var(--color-border)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]"
        >
          <div className="relative p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white">
                <Cookie size={18} strokeWidth={1.75} />
              </span>
              <div className="flex-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                  Your privacy
                </span>
                <h2
                  id="ds-cookie-title"
                  className="mt-0.5 font-display text-lg font-bold leading-tight text-[color:var(--color-text)]"
                >
                  We use cookies
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
                  Essential cookies keep sign-in and trades working. With your
                  permission we also use analytics to improve HigherSkins.{" "}
                  <Link
                    href="/policies/cookies"
                    className="font-semibold text-[color:var(--color-primary)] underline hover:opacity-80"
                  >
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {detailsOpen && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid gap-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-2">
                    <ConsentRow icon={Shield} title="Essential" description="Sign-in, trades, security." checked disabled />
                    <ConsentRow icon={BarChart3} title="Analytics" description="Anonymous usage stats." checked={analytics} onChange={setAnalytics} />
                    <ConsentRow icon={Sparkles} title="Marketing" description="Relevant offers & remarketing." checked={marketing} onChange={setMarketing} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[color:var(--color-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-glow-violet)] transition hover:brightness-110"
              >
                <Check size={13} /> Accept all
              </button>
              {detailsOpen ? (
                <button
                  type="button"
                  onClick={saveCustom}
                  className="flex-1 rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-xs font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-primary)]"
                >
                  Save choices
                </button>
              ) : (
                <button
                  type="button"
                  onClick={acceptEssential}
                  className="flex-1 rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-xs font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-primary)]"
                >
                  Necessary only
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)] transition hover:text-[color:var(--color-text)]"
              >
                {detailsOpen ? "Hide options" : "Customize"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ConsentRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}

function ConsentRow({ icon: Icon, title, description, checked, disabled, onChange }: ConsentRowProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors ${
        disabled ? "cursor-not-allowed opacity-90" : "cursor-pointer hover:bg-[color:var(--color-bg-secondary)]"
      }`}
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
        <Icon size={14} />
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-[13px] font-semibold text-[color:var(--color-text)]">{title}</span>
          {disabled && (
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
              Always on
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {description}
        </span>
      </span>
      <span
        aria-hidden
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-bg-secondary)] ring-1 ring-inset ring-[color:var(--color-border)]"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} className="sr-only" />
    </label>
  );
}
