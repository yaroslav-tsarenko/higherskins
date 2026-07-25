"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid/ProductGrid";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";

export default function SearchPage() {
  const t = useTranslations("common");
  const nav = useTranslations("nav");
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
        .then((res) => res.json())
        .then((d) => setResults(Array.isArray(d) ? d : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("search") }]} />

      <div className="mb-7 text-center">
        <span className="eyebrow">{t("search")}</span>
        <h1 className="mb-4 mt-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
          Search
        </h1>
        <div className="relative mx-auto max-w-lg">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]">
            <Search size={20} />
          </div>
          <input
            placeholder={nav("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] py-3.5 pl-11 pr-4 text-base text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : results.length > 0 ? (
        <ProductGrid products={results} />
      ) : query.length >= 2 ? (
        <EmptyState title={t("noResults")} actionLabel={nav("catalog")} actionHref="/catalog" />
      ) : null}
    </div>
  );
}
