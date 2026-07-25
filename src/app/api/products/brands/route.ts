import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getBrands = unstable_cache(
  async (): Promise<string[]> => {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    });
    return products.map((p) => p.brand).filter(Boolean) as string[];
  },
  ["products-brands-v1"],
  { revalidate: 300, tags: ["products"] },
);

export async function GET() {
  try {
    const brands = await getBrands();
    return NextResponse.json(brands, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
