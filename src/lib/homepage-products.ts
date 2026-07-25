export interface HomepageProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  comparePrice?: number | string | null;
  images: { url: string; alt?: string | null }[];
  categories?: { category: { name: string; slug: string } }[];
  quantity?: number;
  status?: string;
  isFeatured?: boolean;
  brand?: string | null;
  createdAt?: string | Date;
}

export interface HomepageCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  children?: HomepageCategory[];
  _count?: { products: number };
}

export function getFeaturedProducts(products: HomepageProduct[], limit = 10): HomepageProduct[] {
  return products.filter((p) => p.isFeatured).slice(0, limit);
}

export function getSaleProducts(products: HomepageProduct[], limit = 10): HomepageProduct[] {
  return products
    .filter((p) => {
      if (!p.comparePrice) return false;
      return Number(p.comparePrice) > Number(p.price);
    })
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, limit);
}

export function getNewProducts(products: HomepageProduct[], limit = 10): HomepageProduct[] {
  return [...products]
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
}

export function getPopularProducts(products: HomepageProduct[], limit = 10): HomepageProduct[] {
  return [...products]
    .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
    .slice(0, limit);
}

export function getProductsByCategory(products: HomepageProduct[], categorySlug: string): HomepageProduct[] {
  return products.filter((p) =>
    p.categories?.some((c) => c.category.slug === categorySlug)
  );
}

export function getProductsByBrand(products: HomepageProduct[], brandName: string): HomepageProduct[] {
  return products.filter((p) => p.brand?.toLowerCase() === brandName.toLowerCase());
}

export function getDiscountPercent(product: HomepageProduct): number {
  const price = Number(product.price);
  const compare = product.comparePrice ? Number(product.comparePrice) : null;
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export interface CategorySection {
  category: HomepageCategory;
  products: HomepageProduct[];
  tabs: CategoryTab[];
  totalCount?: number;
}

export interface CategoryTab {
  label: string;
  slugs: string[];
}

function collectCategorySlugs(category: HomepageCategory): string[] {
  return [
    category.slug,
    ...(category.children || []).flatMap((child) => collectCategorySlugs(child)),
  ];
}

export function getHomepageCategorySections(
  products: HomepageProduct[],
  categories: HomepageCategory[],
  maxPerCategory = 10,
  maxSections?: number,
): CategorySection[] {
  const sections = categories
    .map((cat) => {
      const catProducts = getProductsByCategory(products, cat.slug);
      const childSlugs = (cat.children || []).flatMap((c) => collectCategorySlugs(c));
      const fromChildren = childSlugs.length > 0
        ? products.filter((p) =>
            p.categories?.some((c) => childSlugs.includes(c.category.slug))
          )
        : [];
      const merged = [...catProducts, ...fromChildren];
      const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values());

      const tabs = cat.children?.length
        ? [
            { label: "All", slugs: collectCategorySlugs(cat) },
            ...cat.children.map((c) => ({ label: c.name, slugs: collectCategorySlugs(c) })),
          ]
        : [];

      return {
        category: cat,
        products: unique.slice(0, maxPerCategory),
        tabs,
        totalCount: unique.length,
      };
    })
    .filter((s) => s.products.length > 0)
    .sort((a, b) => b.totalCount - a.totalCount);

  const limited = maxSections ? sections.slice(0, maxSections) : sections;
  return limited.map((section) => ({
    category: section.category,
    products: section.products,
    tabs: section.tabs,
    totalCount: section.totalCount,
  }));
}

export interface BrandSection {
  brand: string;
  products: HomepageProduct[];
}

export function getBrandSections(
  products: HomepageProduct[],
  brandNames: string[],
  limit = 8,
): BrandSection[] {
  return brandNames
    .map((brand) => ({
      brand,
      products: getProductsByBrand(products, brand).slice(0, limit),
    }))
    .filter((s) => s.products.length > 0);
}

export const TOP_BRANDS = [
  "Apple", "Samsung", "Sony", "Nike", "Adidas",
  "Dyson", "Garmin", "The North Face", "Bose", "LG",
  "KitchenAid", "Under Armour", "Lenovo", "ASUS",
];
