import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/utils/slugify";

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

type CategoryNode = Awaited<ReturnType<typeof getCategoriesFlat>>[number] & {
  children: CategoryNode[];
};

const getCategoriesFlat = unstable_cache(
  async () => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },
  ["api-categories-flat-v1"],
  { revalidate: 300, tags: ["categories"] },
);

function buildCategoryTree(categories: Awaited<ReturnType<typeof getCategoriesFlat>>): CategoryNode[] {
  const nodeMap = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const category of categories) {
    nodeMap.set(category.id, { ...category, children: [] });
  }

  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) sortTree(node.children);
  };

  sortTree(roots);
  return roots;
}

function subtreeCount(cat: CategoryNode): number {
  const own = cat._count?.products || 0;
  return own + cat.children.reduce((sum, child) => sum + subtreeCount(child), 0);
}

function pruneEmpty(categories: CategoryNode[]): CategoryNode[] {
  return categories
    .filter((category) => subtreeCount(category) > 0)
    .map((category) => ({
      ...category,
      children: pruneEmpty(category.children),
    }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get("flat") === "true";
    const includeEmpty = searchParams.get("includeEmpty") === "true";

    const categories = await getCategoriesFlat();

    if (flat) {
      return NextResponse.json(categories);
    }

    const categoryTree = buildCategoryTree(categories);

    return NextResponse.json(includeEmpty ? categoryTree : pruneEmpty(categoryTree));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = categorySchema.parse(body);

    const slug = validated.parentId
      ? await (async () => {
          const parent = await prisma.category.findUnique({ where: { id: validated.parentId! }, select: { slug: true } });
          return parent ? slugify(`${parent.slug}-${validated.name}`) : slugify(validated.name);
        })()
      : slugify(validated.name);

    const category = await prisma.category.create({
      data: { ...validated, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
