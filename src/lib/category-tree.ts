import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

interface CategoryLink {
  id: string;
  parentId: string | null;
}

const getCategoryLinks = unstable_cache(
  async (): Promise<CategoryLink[]> => {
    return prisma.category.findMany({
      select: { id: true, parentId: true },
    });
  },
  ["category-links-v1"],
  { revalidate: 300, tags: ["categories"] },
);

export async function getDescendantCategoryIds(categoryId: string): Promise<string[]> {
  const categories = await getCategoryLinks();
  return collectDescendantCategoryIds(categoryId, categories);
}

export function collectDescendantCategoryIds(
  categoryId: string,
  categories: CategoryLink[],
): string[] {
  const byParent = new Map<string | null, string[]>();

  for (const category of categories) {
    const children = byParent.get(category.parentId) || [];
    children.push(category.id);
    byParent.set(category.parentId, children);
  }

  const result: string[] = [];
  const stack = [categoryId];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;

    seen.add(current);
    result.push(current);

    for (const childId of byParent.get(current) || []) {
      stack.push(childId);
    }
  }

  return result;
}
