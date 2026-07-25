"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  lv: "LV",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-primary-tint)] hover:text-[color:var(--color-primary)]"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${LOCALE_LABELS[locale] ?? locale}`}
      >
        <Globe size={13} strokeWidth={1.75} />
        <span>{LOCALE_LABELS[locale] ?? locale.toUpperCase()}</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[6rem] overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] shadow-lg"
        >
          {Object.entries(LOCALE_LABELS).map(([key, label]) => (
            <button
              key={key}
              role="option"
              aria-selected={key === locale}
              onClick={() => switchLocale(key)}
              className={`block w-full cursor-pointer border-none px-4 py-2 text-left text-sm transition-colors ${
                key === locale
                  ? "bg-[color:var(--color-primary-tint)] font-semibold text-[color:var(--color-primary)]"
                  : "bg-transparent text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
