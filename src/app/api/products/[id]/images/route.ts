import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { uploadToR2, isR2Configured, deleteFromR2 } from "@/lib/r2";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const maxSort = await prisma.productImage.findFirst({
      where: { productId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    let nextSort = (maxSort?.sortOrder ?? -1) + 1;

    const uploaded: { id: string; url: string; alt: string | null; sortOrder: number }[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      let url: string;
      if (isR2Configured()) {
        url = await uploadToR2(buffer, fileName, file.type, "products");
      } else {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), buffer);
        url = `/uploads/products/${fileName}`;
      }

      const image = await prisma.productImage.create({
        data: {
          url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          sortOrder: nextSort++,
          productId: id,
        },
      });

      uploaded.push(image);
    }

    return NextResponse.json({ images: uploaded });
  } catch (error) {
    console.error("Error uploading product images:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await params;
    const { imageId } = await request.json();

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (isR2Configured() && image.url.startsWith("http")) {
      try {
        await deleteFromR2(image.url);
      } catch {
        // continue even if R2 delete fails
      }
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
