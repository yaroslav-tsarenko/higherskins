import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators/product";
import { PRODUCTS_PER_PAGE } from "@/lib/utils/constants";
import { slugify } from "@/lib/utils/slugify";
import { getDescendantCategoryIds } from "@/lib/category-tree";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || String(PRODUCTS_PER_PAGE));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "newest";
    const status = searchParams.get("status") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const featured = searchParams.get("featured");
    const brand = searchParams.get("brand") || "";
    const onSale = searchParams.get("onSale");

    const where: Prisma.ProductWhereInput = {};
    const andClauses: Prisma.ProductWhereInput[] = [];

    const isPublicQuery = !status || (status !== "ALL" && status === "ACTIVE");

    if (status && status !== "ALL") {
      where.status = status as Prisma.EnumProductStatusFilter;
    } else if (!status) {
      where.status = "ACTIVE";
    }

    // Hide products without images on the public-facing catalog.
    // Admin/all-status queries still see them so they can be fixed.
    if (isPublicQuery) {
      where.images = { some: {} };
    }

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (category) {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
        select: { id: true },
      });
      if (cat) {
        const categoryIds = await getDescendantCategoryIds(cat.id);
        where.categories = {
          some: { categoryId: { in: categoryIds } },
        };
      } else {
        where.categories = {
          some: { category: { slug: category } },
        };
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (inStock === "true") {
      andClauses.push({
        OR: [{ trackInventory: false }, { quantity: { gt: 0 } }],
      });
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (brand) {
      where.brand = { equals: brand, mode: "insensitive" };
    }

    if (onSale === "true") {
      andClauses.push({ comparePrice: { gt: 0 } });
    }

    if (andClauses.length) {
      where.AND = andClauses;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (sort) {
        case "price-asc": return [{ price: "asc" }];
        case "price-desc": return [{ price: "desc" }];
        case "name-asc": return [{ name: "asc" }];
        case "popular":
          return [
            { orderItems: { _count: "desc" } },
            { isFeatured: "desc" },
            { quantity: "desc" },
            { createdAt: "desc" },
          ];
        default: return [{ createdAt: "desc" }];
      }
    })();

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          description: isPublicQuery ? false : true,
          price: true,
          comparePrice: true,
          quantity: true,
          status: true,
          isFeatured: true,
          brand: true,
          createdAt: true,
          images: {
            select: { url: true, alt: true },
            orderBy: { sortOrder: "asc" },
            take: 2,
          },
          categories: {
            select: { category: { select: { id: true, name: true, slug: true } } },
            take: 3,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = productSchema.parse(body);

    const slug = slugify(validated.name);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        sku: validated.sku,
        description: validated.description,
        shortDescription: validated.shortDescription,
        price: validated.price,
        comparePrice: validated.comparePrice,
        costPrice: validated.costPrice,
        trackInventory: validated.trackInventory,
        quantity: validated.quantity,
        lowStockAlert: validated.lowStockAlert,
        weight: validated.weight,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        status: validated.status,
        isFeatured: validated.isFeatured,
        brand: validated.brand,
        gtin: validated.gtin,
        ean: validated.ean || undefined,
        mpn: validated.mpn,
        characteristics: validated.characteristics ?? undefined,
        googleCategory: validated.googleCategory,
        condition: validated.condition,
        categories: validated.categoryIds
          ? {
              create: validated.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        categories: { include: { category: true } },
      },
    });

    revalidateTag("products", "max");
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
