import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { purchaseListing } from "@/lib/skins/purchase";

export const runtime = "nodejs";

// Buy a specific listing from the wallet balance. Each error path returns a
// stable `code` the client maps to a tailored message + recovery action.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthenticated", error: "Sign in through Steam to buy." },
      { status: 401 },
    );
  }

  let body: { listingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "Invalid body" }, { status: 400 });
  }
  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json(
      { code: "bad_request", error: "Missing listing." },
      { status: 400 },
    );
  }

  const result = await purchaseListing(user.id, listingId);
  if (!result.ok) {
    return NextResponse.json({ code: result.code, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, purchase: result.purchase });
}
