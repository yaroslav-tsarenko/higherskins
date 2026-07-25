import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveDiscount } from "@/lib/discounts";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const code = request.nextUrl.searchParams.get("code");

  const discount = await resolveDiscount({
    userId: user?.id ?? null,
    email: user?.email ?? null,
    code,
  });

  if (!discount) {
    return NextResponse.json({ discount: null });
  }

  return NextResponse.json({
    discount: {
      type: discount.type,
      percent: discount.percent,
      code: discount.code,
      source: discount.source,
    },
  });
}
