// Thin server-side client for the SIH (SkinsInHood) market API.
// Docs: https://docs.sih.app/guide/ — all requests authenticate via the
// `apikey` header. Prices are decimals in SIH's account currency (USD).
//
// Nothing here spends money on its own: `createOrder` only debits the SIH
// merchant balance when `test` is false. We default to test mode unless
// `SIH_LIVE=1` is explicitly set, so dev and previews never place real orders.

const BASE_URL = process.env.SIH_API_BASE_URL || "https://api.sih.market/api/v1";
const API_KEY = process.env.SIH_API_KEY || "";

export const CS2_APP_ID = 730;

export function sihConfigured(): boolean {
  return API_KEY.length > 0;
}

// Live orders only when SIH_LIVE=1. Anything else (dev, preview, unset) runs
// SIH in simulation so no merchant balance is ever debited by accident.
export function sihLiveMode(): boolean {
  return process.env.SIH_LIVE === "1";
}

async function sihFetch<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: API_KEY,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body
  }
  if (!res.ok) {
    const apiError =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: unknown }).error)
        : "";
    const message = apiError || `SIH ${path} responded ${res.status}`;
    throw new SihError(message, res.status, json);
  }
  return json as T;
}

export class SihError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "SihError";
  }
}

export interface SihMinItem {
  price: number; // lowest ask on SIH, in account currency
  count: number; // units available
}

interface GetMinItemResponse {
  success: boolean;
  items?: Record<string, { price: number; count: number } | number>;
}

// Lowest available price + stock for a single market_hash_name. The API keys
// the result by item name; a missing entry means it is not listed on SIH.
export async function getMinItem(
  marketHashName: string,
  appId: number = CS2_APP_ID,
): Promise<SihMinItem | null> {
  const data = await sihFetch<GetMinItemResponse>("/get-min-item", {
    query: { appId, item: marketHashName },
  });
  const entry = data.items?.[marketHashName];
  if (entry == null) return null;
  if (typeof entry === "number") return { price: entry, count: 1 };
  if (typeof entry.price !== "number") return null;
  return { price: entry.price, count: entry.count ?? 0 };
}

export interface SihItem {
  price: number; // lowest ask on SIH, in account currency (USD)
  count: number; // units available
  image?: string; // steaminventoryhelper.com CDN url
  color?: string; // rarity hex
}

interface GetItemsResponse {
  success: boolean;
  items?: Record<string, { price: number; count: number; image?: string; color?: string } | number>;
}

// The full SIH catalog for an app, keyed by market_hash_name. ~18k CS2 entries.
// `extended` adds the CDN image + rarity color per item. We join this against
// our structured skin metadata so the catalog only lists items SIH can deliver.
export async function getItems(
  appId: number = CS2_APP_ID,
): Promise<Map<string, SihItem>> {
  const data = await sihFetch<GetItemsResponse>("/get-items", {
    query: { appId, extended: true },
  });
  const out = new Map<string, SihItem>();
  for (const [name, entry] of Object.entries(data.items ?? {})) {
    if (entry == null) continue;
    if (typeof entry === "number") {
      out.set(name, { price: entry, count: 1 });
      continue;
    }
    if (typeof entry.price !== "number") continue;
    out.set(name, {
      price: entry.price,
      count: entry.count ?? 0,
      image: entry.image,
      color: entry.color,
    });
  }
  return out;
}

export interface CreateOrderInput {
  steamId: string; // buyer SteamID64
  token: string; // trade-offer token from the buyer's trade URL
  amount: number; // ceiling price we are willing to pay on SIH
  item: string; // market_hash_name
  customId: string; // our SkinPurchase id
  appId?: number;
  test?: boolean; // simulation — no merchant balance debit
}

export interface CreateOrderResult {
  success: boolean;
  id: number; // SIH order id
  balance: number; // remaining SIH merchant balance
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const raw = await sihFetch<Record<string, unknown>>("/create-order", {
    method: "POST",
    body: JSON.stringify({
      steamId: input.steamId,
      token: input.token,
      amount: input.amount,
      item: input.item,
      customId: input.customId,
      appId: input.appId ?? CS2_APP_ID,
      test: input.test ?? !sihLiveMode(),
    }),
  });
  // Tolerate both a flat envelope and one nested under `order`/`data`.
  const body = unwrap(raw);
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    throw new SihError("SIH create-order returned no order id", 502, raw);
  }
  return { success: raw.success !== false, id, balance: Number(body.balance) || 0 };
}

export type SihOrderStatus =
  | "created" // awaiting item search
  | "processing" // item found, awaiting seller trade
  | "sent" // seller sent the trade offer
  | "finished" // buyer accepted — delivered
  | "failed"
  | "penalized";

export interface SihOrder {
  id: number;
  customId?: string;
  status: SihOrderStatus;
  amount?: number;
}

export async function getOrder(ref: { id?: number; customId?: string }): Promise<SihOrder | null> {
  const raw = await sihFetch<Record<string, unknown>>("/get-order", {
    query: { id: ref.id, customId: ref.customId },
  });
  const body = unwrap(raw);
  if (typeof body.status !== "string") return null;
  return {
    id: Number(body.id),
    customId: typeof body.customId === "string" ? body.customId : undefined,
    status: body.status as SihOrderStatus,
    amount: typeof body.amount === "number" ? body.amount : undefined,
  };
}

// SIH sometimes wraps the payload under `order` or `data`; peel one level so
// callers can read fields uniformly whether the envelope is flat or nested.
function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["order", "data"]) {
    const nested = raw[key];
    if (nested && typeof nested === "object") return nested as Record<string, unknown>;
  }
  return raw;
}
