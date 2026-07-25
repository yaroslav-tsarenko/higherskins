import { NextResponse } from "next/server";
import { importSkins } from "@/lib/skins/import";

// Long-running catalog refresh. Protect with CRON_SECRET (Authorization: Bearer …)
// so only Vercel Cron / trusted callers can trigger it.
export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // allow in dev only
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const result = await importSkins({ dryRun, limit });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return run(req);
}

// Vercel Cron uses GET.
export async function GET(req: Request) {
  return run(req);
}
