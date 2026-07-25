"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { LayoutDashboard, Package, User, MapPin, Heart, LogOut } from "lucide-react";

const navItems = [
  { href: "/account", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, labelKey: "title" as const },
  { href: "/account/orders", icon: <Package size={18} strokeWidth={1.5} />, labelKey: "orders" as const },
  { href: "/account/profile", icon: <User size={18} strokeWidth={1.5} />, labelKey: "profile" as const },
  { href: "/account/addresses", icon: <MapPin size={18} strokeWidth={1.5} />, labelKey: "addresses" as const },
  { href: "/account/wishlist", icon: <Heart size={18} strokeWidth={1.5} />, labelKey: "wishlist" as const },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const t = useTranslations("account");
  const { user, signOut } = useAuth();

  return (
    <aside className="w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] py-4 md:sticky md:top-8 md:h-fit md:w-60 md:py-6">
      <div className="mb-3 flex items-center gap-3 border-b border-[color:var(--color-line)] px-4 pb-3 md:px-5 md:pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-base font-bold text-white">
          {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-[color:var(--color-text)]">{user?.name || "User"}</p>
          <p className="max-w-[150px] truncate text-xs text-[color:var(--color-text-tertiary)]">{user?.email}</p>
        </div>
      </div>
      <nav className="flex flex-row gap-1.5 overflow-x-auto px-3 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive =
            pathname.endsWith(item.href) ||
            (item.href !== "/account" && pathname.includes(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] transition-colors md:flex-shrink md:px-3 md:py-2.5 md:text-sm ${
                isActive
                  ? "bg-[color:var(--color-primary-tint)] font-semibold text-[color:var(--color-primary)]"
                  : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-secondary)] hover:text-[color:var(--color-text)]"
              }`}
            >
              {item.icon}
              {t(item.labelKey)}
            </Link>
          );
        })}
        <button
          className="flex flex-shrink-0 cursor-pointer items-center gap-3 whitespace-nowrap rounded-md border-none bg-transparent px-3.5 py-2 text-left text-[13px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-bg-secondary)] md:mt-2 md:w-full md:flex-shrink md:px-3 md:py-2.5 md:text-sm"
          onClick={signOut}
        >
          <LogOut size={18} strokeWidth={1.5} />
          {t("logout")}
        </button>
      </nav>
    </aside>
  );
}
