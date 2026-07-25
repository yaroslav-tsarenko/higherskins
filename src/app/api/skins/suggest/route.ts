import { NextResponse } from "next/server";
import { getSkinSuggestions } from "@/lib/skins/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  try {
    const suggestions = await getSkinSuggestions(q, 8);
    return NextResponse.json({ suggestions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load suggestions" },
      { status: 500 },
    );
  }
}
