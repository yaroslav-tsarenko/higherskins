"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Currency = "USD" | "GBP" | "EUR";

interface Rates {
  USD: number;
  GBP: number;
  EUR: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (amountInEur: number) => number;
  symbol: string;
  rates: Rates;
}

const DEFAULT_RATES: Rates = { EUR: 1, USD: 1.08, GBP: 0.85 };

const SYMBOLS: Record<Currency, string> = { GBP: "£", USD: "$", EUR: "€" };

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("GBP");
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);

  useEffect(() => {
    const stored = localStorage.getItem("currency") as Currency | null;
    if (stored && ["EUR", "USD", "GBP"].includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/exchange-rates")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.rates) return;
        const usd = Number(data.rates.USD);
        const gbp = Number(data.rates.GBP);
        if (Number.isFinite(usd) && Number.isFinite(gbp) && usd > 0 && gbp > 0) {
          setRates({ EUR: 1, USD: usd, GBP: gbp });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  };

  const convert = useCallback(
    (amountInEur: number) => {
      if (currency === "EUR") return amountInEur;
      return Math.round(amountInEur * rates[currency] * 100) / 100;
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, convert, rates, symbol: SYMBOLS[currency] }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
