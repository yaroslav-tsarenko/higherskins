import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "name", "sku", "price", "comparePrice", "quantity", "description",
    "shortDescription", "category", "subCategory", "subSubCategory",
    "brand", "weight", "status", "imageUrl", "gtin", "ean", "mpn",
    "googleCategory", "condition", "characteristics",
  ];

  const sampleRow = [
    "Reference Studio Monitors — Pair", "SKU-001", "1249.00", "1549.00", "20",
    "Studio-grade near-field monitors with balanced-drive tweeters, tuned for flat frequency response and low listener fatigue.",
    "Balanced 6.5\" near-field pair · 200W / channel · XLR + TRS.",
    "Audio & Headphones", "Speakers", "",
    "Higherskins Reference", "8.5", "ACTIVE", "", "", "", "", "Electronics > Audio > Speakers > Studio Monitors", "new",
    "Driver>>Woofer:6.5\" Kevlar|Driver>>Tweeter:1\" silk dome|Power>>Rating:200W per channel|Input>>Connector:XLR + TRS|Frequency>>Response:38Hz–22kHz",
  ];

  const csv = [headers.join(","), sampleRow.join(",")].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-template.csv",
    },
  });
}
