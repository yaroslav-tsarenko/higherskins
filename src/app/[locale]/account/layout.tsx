"use client";

import { useAuth } from "@/providers/AuthProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar/AccountSidebar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { useTranslations, useLocale } from "next-intl";
import { useEffect } from "react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useTranslations("nav");
  const t = useTranslations("account");
  const locale = useLocale();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = `/${locale}/auth/login`;
    }
  }, [loading, user, locale]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("title") }]} />
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[240px_1fr] md:gap-8">
        <AccountSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}
