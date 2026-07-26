"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  Wallet,
  LogOut,
  User as UserIcon,
  Repeat,
  Link2,
  BarChart3,
  Tag,
  LayoutGrid,
  Shield,
  ArrowRight,
  Loader2,
  Swords,
  Hand,
  Crosshair,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { AnimatePresence, motion } from "framer-motion";
import { HigherskinsLogo } from "../HigherskinsLogo";
import { CurrencySwitcher } from "./CurrencySwitcher";

interface SkinSuggestion {
  id: string;
  name: string;
  weapon: string;
  category: string;
  rarityColor: string;
  imageUrl: string | null;
  lowestPrice: number | null;
}

const NAV: { href: string; label: string; Icon: React.ElementType }[] = [
  { href: "/catalog", label: "Market", Icon: LayoutGrid },
  { href: "/sell", label: "Sell", Icon: Tag },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
];

const QUICK_CATEGORIES: { value: string; label: string; Icon: React.ElementType }[] = [
  { value: "Knives", label: "Knives", Icon: Swords },
  { value: "Gloves", label: "Gloves", Icon: Hand },
  { value: "Rifles", label: "Rifles", Icon: Crosshair },
  { value: "Pistols", label: "Pistols", Icon: Target },
  { value: "SMGs", label: "SMGs", Icon: Zap },
  { value: "Heavy", label: "Heavy", Icon: Shield },
];

function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);
  return ref;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const { symbol } = useCurrency();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SkinSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // Collapse the header on scroll with a small hysteresis gap.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled((prev) => (prev ? y > 2 : y > 8));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Debounced skin-name autocomplete against the DB.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/skins/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { suggestions: [] }))
        .then((data) => setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 180);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setHighlight(-1);
  }, []);

  const searchRefDesktop = useDismiss(closeSearch);
  const searchRefMobile = useDismiss(closeSearch);
  const accountRef = useDismiss(() => setAccountOpen(false));

  const submitSearch = (q: string) => {
    const term = q.trim();
    if (!term) return;
    closeSearch();
    setMobileOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(term)}`);
  };

  const goToSkin = (id: string) => {
    closeSearch();
    setMobileOpen(false);
    setQuery("");
    router.push(`/skin/${id}`);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && suggestions[highlight]) {
        e.preventDefault();
        goToSkin(suggestions[highlight].id);
      }
    }
  };

  const currentPath = pathname || "/";
  const authHref = `/auth?next=${encodeURIComponent(currentPath)}`;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const displayName = user?.steam?.personaName || user?.name || user?.email || "Trader";
  const avatar = user?.steam?.avatarFull || user?.steam?.avatar || null;

  const searchDropdown = (variant: "desktop" | "mobile") =>
    searchOpen && query.trim().length >= 2 ? (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={[
          "absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]",
          variant === "mobile" ? "" : "",
        ].join(" ")}
        role="listbox"
      >
        {searchLoading && suggestions.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-[color:var(--color-text-tertiary)]">
            <Loader2 size={15} className="animate-spin" /> Searching skins…
          </div>
        ) : suggestions.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-[color:var(--color-text-tertiary)]">
            No skins match “{query.trim()}”.
          </div>
        ) : (
          <>
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  goToSkin(s.id);
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                  i === highlight
                    ? "bg-[color:var(--color-primary-tint)]"
                    : "hover:bg-[color:var(--color-bg-secondary)]",
                ].join(" ")}
              >
                <span
                  className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--color-bg-secondary)]"
                  style={{ boxShadow: `inset 0 -2px 0 0 ${s.rarityColor}` }}
                >
                  {s.imageUrl && (
                    <Image src={s.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[color:var(--color-text)]">
                    {s.name}
                  </span>
                  <span className="block truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
                    {s.weapon}
                  </span>
                </span>
                {s.lowestPrice != null && (
                  <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-[color:var(--color-accent)]">
                    {symbol}
                    {s.lowestPrice.toFixed(2)}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                submitSearch(query);
              }}
              className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary-tint)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Search size={13} /> See all results for “{query.trim()}”
              </span>
              <ArrowRight size={13} />
            </button>
          </>
        )}
      </motion.div>
    ) : null;

  return (
    <>
      <header
        className={[
          "sticky top-0 z-40 w-full border-b bg-[color:var(--color-bg)] transition-all duration-300",
          scrolled
            ? "border-[color:var(--color-border)] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]"
            : "border-transparent",
        ].join(" ")}
        role="banner"
      >
        <div
          className={[
            "mx-auto flex max-w-[1320px] items-center gap-3 px-4 transition-[padding] duration-300 sm:px-6 lg:gap-5 lg:px-8",
            scrolled ? "py-2.5" : "py-3.5",
          ].join(" ")}
        >
          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)] lg:hidden"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link href="/" aria-label="HigherSkins — home" className="shrink-0">
            <HigherskinsLogo size={scrolled ? 19 : 21} />
          </Link>

          {/* Primary nav */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold transition-colors",
                    active
                      ? "bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"
                      : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-secondary)] hover:text-[color:var(--color-text)]",
                  ].join(" ")}
                >
                  <item.Icon size={15} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search — desktop */}
          <div ref={searchRefDesktop} className="relative hidden min-w-0 flex-1 lg:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(query);
              }}
              className={[
                "flex h-11 items-center overflow-hidden rounded-full border bg-[color:var(--color-bg-elevated)] pl-4 pr-1.5 transition-all",
                searchOpen
                  ? "border-[color:var(--color-accent)] shadow-[0_0_0_4px_rgba(34,211,238,0.12)]"
                  : "border-[color:var(--color-border)]",
              ].join(" ")}
            >
              <Search size={16} className="shrink-0 text-[color:var(--color-text-tertiary)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                  setHighlight(-1);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search skins — AWP Dragon Lore, ★ Karambit, AK-47 Redline…"
                aria-label="Search skins"
                className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[color:var(--color-primary)] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110"
              >
                Search
              </button>
            </form>
            <AnimatePresence>{searchDropdown("desktop")}</AnimatePresence>
          </div>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {/* Currency */}
            <div className="hidden items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-1.5 py-1 md:flex">
              <CurrencySwitcher />
            </div>

            {/* Wallet balance placeholder */}
            {user && (
              <Link
                href="/account"
                className="hidden h-10 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-[color:var(--color-text)] transition-colors hover:border-[color:var(--color-accent)] sm:inline-flex"
                aria-label="Wallet balance"
              >
                <Wallet size={16} className="text-[color:var(--color-accent)]" />
                <span className="font-mono text-[12.5px] font-bold tabular-nums">
                  {symbol}0.00
                </span>
              </Link>
            )}

            {/* Auth zone */}
            {!user ? (
              <Link
                href={authHref}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-4 text-[13px] font-bold text-white shadow-[var(--shadow-glow-violet)] transition hover:brightness-110"
              >
                <UserIcon size={15} />
                <span className="hidden sm:inline">Sign in</span>
                <span className="sm:hidden">Sign in</span>
              </Link>
            ) : (
              <div
                ref={accountRef}
                className="relative"
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] py-1 pl-1 pr-2.5 transition-colors hover:border-[color:var(--color-primary)]"
                >
                  <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                    {avatar ? (
                      <Image src={avatar} alt="" fill sizes="32px" className="object-cover" />
                    ) : (
                      <UserIcon size={16} />
                    )}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-[13px] font-semibold text-[color:var(--color-text)] sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown size={14} className="hidden text-[color:var(--color-text-tertiary)] sm:inline" />
                </button>
                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      className="absolute right-0 top-full z-40 mt-1.5 w-64 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]"
                    >
                      <div className="mb-2 flex items-center gap-3 rounded-xl bg-[color:var(--color-bg-secondary)] p-3">
                        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                          {avatar ? (
                            <Image src={avatar} alt="" fill sizes="40px" className="object-cover" />
                          ) : (
                            <UserIcon size={18} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[color:var(--color-text)]">
                            {displayName}
                          </span>
                          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
                            {user.steam?.tradeUrlVerified ? "Trade ready" : "Trade URL needed"}
                          </span>
                        </span>
                      </div>
                      {[
                        { href: "/account", icon: UserIcon, label: "Profile" },
                        { href: "/account/trades", icon: Repeat, label: "My Trades" },
                        { href: "/account/trade-url", icon: Link2, label: "Trade URL settings" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-primary-tint)] hover:text-[color:var(--color-primary)]"
                        >
                          <item.icon size={15} className="text-[color:var(--color-primary)]" />
                          {item.label}
                        </Link>
                      ))}
                      {isAdmin && (
                        <NextLink
                          href="/admin"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-primary-tint)] hover:text-[color:var(--color-primary)]"
                        >
                          <Shield size={15} className="text-[color:var(--color-primary)]" />
                          Admin panel
                        </NextLink>
                      )}
                      <div className="my-1.5 h-px bg-[color:var(--color-border)]" />
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          signOut();
                        }}
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-danger)]/10 hover:text-[color:var(--color-danger)]"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Quick categories */}
        <div className="border-t border-[color:var(--color-border)]">
          <div className="mx-auto flex max-w-[1320px] items-center gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
            {QUICK_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/catalog?category=${encodeURIComponent(c.value)}`}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] px-3 text-[12.5px] font-semibold text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-text)]"
              >
                <c.Icon size={13} />
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Search — mobile row */}
        <div ref={searchRefMobile} className="relative border-t border-[color:var(--color-border)] px-4 py-2 lg:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(query);
            }}
            className="flex h-10 items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] pl-4 pr-1"
          >
            <Search size={15} className="shrink-0 text-[color:var(--color-text-tertiary)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
                setHighlight(-1);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search skins"
              aria-label="Search skins"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="inline-flex h-8 items-center rounded-full bg-[color:var(--color-primary)] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white"
            >
              Go
            </button>
          </form>
          <AnimatePresence>{searchDropdown("mobile")}</AnimatePresence>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-[#05060A]/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-[color:var(--color-bg)] shadow-xl lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
                <HigherskinsLogo size={19} />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-secondary)] hover:text-[color:var(--color-text)]"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)]"
                  >
                    <item.Icon size={18} className="text-[color:var(--color-primary)]" />
                    {item.label}
                  </Link>
                ))}

                {user && (
                  <>
                    <div className="my-2 h-px bg-[color:var(--color-border)]" />
                    {[
                      { href: "/account", icon: UserIcon, label: "Profile" },
                      { href: "/account/trades", icon: Repeat, label: "My Trades" },
                      { href: "/account/trade-url", icon: Link2, label: "Trade URL settings" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)]"
                      >
                        <item.icon size={18} className="text-[color:var(--color-primary)]" />
                        {item.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <NextLink
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)]"
                      >
                        <Shield size={18} className="text-[color:var(--color-primary)]" />
                        Admin panel
                      </NextLink>
                    )}
                  </>
                )}
              </nav>

              <div className="border-t border-[color:var(--color-border)] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-1.5 py-1">
                    <CurrencySwitcher />
                  </div>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[color:var(--color-border)] text-sm font-semibold text-[color:var(--color-text)]"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                ) : (
                  <Link
                    href={authHref}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] text-sm font-bold text-white"
                  >
                    <UserIcon size={16} /> Sign in
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
