"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { openCookieSettings } from "@/components/shared/CookieConsent/CookieConsent";
import { FaDiscord, FaXTwitter, FaInstagram } from "react-icons/fa6";
import {
  ArrowRight,
  Mail,
  ShieldCheck,
  Zap,
  Globe,
  LayoutGrid,
  BarChart3,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  Info,
  Route,
  Swords,
  Hand,
  Crosshair,
  Lock,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { HigherskinsLogo } from "../HigherskinsLogo";
import { brand } from "@/lib/brand";
import { useCurrency } from "@/providers/CurrencyProvider";

interface Group {
  key: string;
  title: string;
  items: Array<{ href: string; label: string; Icon?: React.ElementType }>;
}

const groups: Group[] = [
  {
    key: "shop",
    title: "Shop",
    items: [
      { href: "/catalog", label: "Browse skins", Icon: LayoutGrid },
      { href: "/analytics", label: "Price charts & analytics", Icon: BarChart3 },
    ],
  },
  {
    key: "categories",
    title: "Categories",
    items: [
      { href: "/catalog?category=Knives", label: "Knives", Icon: Swords },
      { href: "/catalog?category=Gloves", label: "Gloves", Icon: Hand },
      { href: "/catalog?category=Rifles", label: "Rifles", Icon: Crosshair },
      { href: "/catalog?category=Pistols", label: "Pistols", Icon: Crosshair },
      { href: "/catalog?category=SMGs", label: "SMGs", Icon: Crosshair },
    ],
  },
  {
    key: "company",
    title: "Company",
    items: [
      { href: "/about", label: "About us", Icon: Info },
      { href: "/how-it-works", label: "How it works", Icon: Route },
      { href: "/faq", label: "FAQ", Icon: HelpCircle },
      { href: "/contact", label: "Contact us", Icon: MessageSquare },
    ],
  },
];

const trustBadges = [
  { icon: Zap, label: "Instant Steam delivery" },
  { icon: ShieldCheck, label: "Buyer protection guarantee" },
  { icon: Lock, label: "Secure escrow checkout" },
];

// Card networks and the compliance standard our checkout adheres to.
const PAYMENT_METHODS = ["Visa", "Mastercard", "PCI DSS"];

const socialLinks = [
  { icon: FaDiscord, label: "Discord", href: "/coming-soon", external: false },
  { icon: FaXTwitter, label: "X (Twitter)", href: "/coming-soon", external: false },
  { icon: FaInstagram, label: "Instagram", href: brand.social.instagram, external: true },
];

function LinkGroup({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[color:var(--color-text)]/10 md:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left md:hidden"
      >
        <span className="font-display text-[15.5px] font-semibold tracking-tight text-[color:var(--color-text)]">
          {group.title}
        </span>
        <ChevronDown
          size={15}
          className={`text-[color:var(--color-accent)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <h3 className="hidden pb-5 font-display text-[16px] font-semibold tracking-tight text-[color:var(--color-text)] md:block">
        <span className="relative inline-block after:absolute after:-bottom-2 after:left-0 after:h-px after:w-8 after:rounded-full after:bg-[color:var(--color-primary)]">
          {group.title}
        </span>
      </h3>
      <ul
        className={`grid grid-cols-1 gap-y-2.5 pb-4 md:gap-y-3 ${open ? "grid" : "hidden md:grid"}`}
        aria-hidden={!open}
      >
        {group.items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="inline-flex items-center gap-2 text-[13.5px] text-[color:var(--color-text)]/70 transition-colors hover:text-[color:var(--color-primary)]"
            >
              {it.Icon && <it.Icon size={13} className="text-[color:var(--color-text-tertiary)]" />}
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalGroup() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[color:var(--color-text)]/10 md:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left md:hidden"
      >
        <span className="font-display text-[15.5px] font-semibold tracking-tight text-[color:var(--color-text)]">
          Legal
        </span>
        <ChevronDown
          size={15}
          className={`text-[color:var(--color-accent)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <h3 className="hidden pb-5 font-display text-[16px] font-semibold tracking-tight text-[color:var(--color-text)] md:block">
        <span className="relative inline-block after:absolute after:-bottom-2 after:left-0 after:h-px after:w-8 after:rounded-full after:bg-[color:var(--color-primary)]">
          Legal
        </span>
      </h3>
      <ul
        className={`grid grid-cols-1 gap-y-2.5 pb-4 md:gap-y-3 ${open ? "grid" : "hidden md:grid"}`}
        aria-hidden={!open}
      >
        <li>
          <Link href="/policies/terms" className="text-[13.5px] text-[color:var(--color-text)]/70 transition-colors hover:text-[color:var(--color-primary)]">
            Terms of service
          </Link>
        </li>
        <li>
          <Link href="/policies/privacy" className="text-[13.5px] text-[color:var(--color-text)]/70 transition-colors hover:text-[color:var(--color-primary)]">
            Privacy policy
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={openCookieSettings}
            className="text-left text-[13.5px] text-[color:var(--color-text)]/70 transition-colors hover:text-[color:var(--color-primary)]"
          >
            Cookie preferences
          </button>
        </li>
      </ul>
    </div>
  );
}

function CommunityGroup() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[color:var(--color-text)]/10 md:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left md:hidden"
      >
        <span className="font-display text-[15.5px] font-semibold tracking-tight text-[color:var(--color-text)]">
          Community
        </span>
        <ChevronDown
          size={15}
          className={`text-[color:var(--color-accent)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <h3 className="hidden pb-5 font-display text-[16px] font-semibold tracking-tight text-[color:var(--color-text)] md:block">
        <span className="relative inline-block after:absolute after:-bottom-2 after:left-0 after:h-px after:w-8 after:rounded-full after:bg-[color:var(--color-primary)]">
          Community
        </span>
      </h3>
      <ul
        className={`grid grid-cols-1 gap-y-2.5 pb-4 md:gap-y-3 ${open ? "grid" : "hidden md:grid"}`}
        aria-hidden={!open}
      >
        {socialLinks.map(({ icon: Icon, label, href, external }) => {
          const cls =
            "inline-flex items-center gap-2 text-[13.5px] text-[color:var(--color-text)]/70 transition-colors hover:text-[color:var(--color-primary)]";
          return (
            <li key={label}>
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  <Icon size={14} className="text-[color:var(--color-text-tertiary)]" />
                  {label}
                </a>
              ) : (
                <Link href={href} className={cls}>
                  <Icon size={14} className="text-[color:var(--color-text-tertiary)]" />
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const { currency, symbol } = useCurrency();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto" role="contentinfo">
      {/* ── Brand + navigation tier ─────────────────────────────── */}
      <div className="relative overflow-hidden border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text)]">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0.45 }}
          animate={{ opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(50% 70% at 12% 0%, rgba(124,58,237,0.16) 0%, transparent 62%), radial-gradient(45% 65% at 88% 100%, rgba(34,211,238,0.12) 0%, transparent 62%)",
          }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid opacity-40" />
        <div className="relative mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_2.3fr] lg:gap-14 lg:px-8">
          {/* Brand block */}
          <div className="flex flex-col gap-5">
            <Link href="/" aria-label={brand.displayName}>
              <HigherskinsLogo size={26} />
            </Link>
            <p className="max-w-sm text-[14.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {brand.displayName} is a modern CS2 skins store — browse thousands
              of skins with live float, pattern and cross-market price data, then
              get them delivered instantly to your Steam account.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 py-2 text-[12.5px] text-[color:var(--color-text)]/85"
                >
                  <Icon size={13} className="shrink-0 text-[color:var(--color-accent)]" />
                  <span className="line-clamp-1">{label}</span>
                </div>
              ))}
            </div>

            <a
              href={`mailto:${brand.contact.email}`}
              className="inline-flex w-fit items-center gap-2 text-[13.5px] text-[color:var(--color-text-secondary)] transition-colors hover:text-[color:var(--color-primary)]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-bg-elevated)] text-[color:var(--color-accent)]">
                <Mail size={13} />
              </span>
              {brand.contact.email}
            </a>

            <Link
              href="/catalog"
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 text-[12.5px] font-bold text-white transition-all hover:brightness-110"
            >
              Browse the market <ArrowRight size={12} />
            </Link>
          </div>

          {/* Link groups */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-0 md:grid-cols-2 lg:grid-cols-5">
            {groups.map((g) => (
              <LinkGroup key={g.key} group={g} />
            ))}
            <LegalGroup />
            <CommunityGroup />
          </div>
        </div>

        {/* ── Security & payment strip ──────────────────────────── */}
        <div className="relative mx-auto max-w-[1320px] px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                <Lock size={15} />
              </span>
              <div>
                <div className="text-[13px] font-bold text-[color:var(--color-text)]">
                  Escrowed checkout, TLS everywhere
                </div>
                <div className="text-[12px] text-[color:var(--color-text-secondary)]">
                  We never ask for your Steam password or API key — only a trade link.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                <CreditCard size={12} /> Payments
              </span>
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m}
                  className="inline-flex h-8 items-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--color-text-secondary)]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legal bar ───────────────────────────────────────────── */}
      <div className="relative bg-[color:var(--color-bg)] text-[color:var(--color-text)]/70">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 border-t border-[color:var(--color-border)] px-4 py-6 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
          <div className="flex flex-col gap-1.5 text-[12px]">
            <p>{t("copyright", { year: currentYear, storeName: brand.displayName })}</p>
            <p className="max-w-xl text-[11.5px] leading-relaxed text-[color:var(--color-text)]/55">
              Not affiliated with Valve Corporation. Counter-Strike is a trademark
              of Valve Corporation. All skin names and images are the property of
              their respective owners.
            </p>
            <p className="text-[11.5px] text-[color:var(--color-text)]/45">
              {brand.company.legalName} · Company No. {brand.company.number} ·{" "}
              {brand.company.address.city}, {brand.company.address.country}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <div className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-text)]/85">
              <Globe size={11} className="text-[color:var(--color-primary)]" />
              <span>{currency} {symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href, external }) => {
                const cls =
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text)]/75 transition-all hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]";
                return external ? (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                  >
                    <Icon size={14} />
                  </a>
                ) : (
                  <Link key={label} href={href} aria-label={label} className={cls}>
                    <Icon size={14} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
