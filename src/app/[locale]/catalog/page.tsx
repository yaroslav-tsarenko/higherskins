import { Suspense } from "react";
import type { Metadata } from "next";
import { getCatalogFacets } from "@/lib/skins/queries";
import { CatalogClient } from "@/components/skins/CatalogClient";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Catalog — ${brand.displayName}`,
  description: "Browse thousands of CS2 skins with live float, pattern and price data.",
};

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const facets = await getCatalogFacets();

  return (
    <Suspense fallback={null}>
      <CatalogClient facets={facets} locale={locale} />
    </Suspense>
  );
}
