import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcilePurchase } from "@/lib/skins/delivery";

// Settles SIH deliveries that are still in-flight. Background polling does not
// survive serverless cold starts, so a cron hits this to advance any purchase
// left pending. Protect with CRON_SECRET (Authorization: Bearer …).
export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // allow in dev only
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.skinPurchase.findMany({
    where: {
      provider: "sih",
      providerOrderId: { not: null },
      status: { in: ["pending", "trade_sent"] },
    },
    select: { id: true },
    take: 200,
  });

  let settled = 0;
  for (const p of pending) {
    const done = await reconcilePurchase(p.id).catch(() => false);
    if (done) settled += 1;
  }

  return NextResponse.json({ ok: true, checked: pending.length, settled });
}

export async function POST(req: Request) {
  return run(req);
}

// Vercel Cron uses GET.
export async function GET(req: Request) {
  return run(req);
}
