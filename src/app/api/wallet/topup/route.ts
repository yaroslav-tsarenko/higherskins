import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { extractClientIp } from "@/lib/paynt";
import { requestBaseUrl, startCardPayment } from "@/lib/wallet";

export const runtime = "nodejs";

const MIN_TOPUP = 5;
const MAX_TOPUP = 10_000;

// Start a wallet top-up. Amounts are handled in the EUR base currency; the
// balance is credited only when the provider confirms the deposit.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthenticated", error: "Sign in to top up your wallet." },
      { status: 401 },
    );
  }

  let body: { amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "Invalid body" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    return NextResponse.json(
      { code: "bad_amount", error: `Enter an amount between €${MIN_TOPUP} and €${MAX_TOPUP}.` },
      { status: 400 },
    );
  }

  const result = await startCardPayment({
    user,
    amount,
    description: "Wallet top-up",
    baseUrl: requestBaseUrl(request.headers),
    clientIp: extractClientIp(request.headers),
  });
  if (!result.ok) {
    return NextResponse.json({ code: result.code, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    ok: true,
    redirectUrl: result.redirectUrl,
    transactionId: result.transactionId,
  });
}
