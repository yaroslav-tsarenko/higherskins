/**
 * Minimal BigBuy REST API client.
 *
 * Docs: https://api.bigbuy.eu/rest/doc
 *
 * Notes:
 *  - Catalog endpoints are heavily rate limited (e.g. /products is 10 req/hour,
 *    /taxonomies 24 req/hour). This client honours HTTP 429 + `Retry-After`
 *    and backs off automatically so a long import can run unattended.
 *  - The catalog is cached on BigBuy's side; a fresh key may receive HTTP 409
 *    ("No products found in cache") on the very first call — we treat that as
 *    "retry after a short wait".
 */

export type BigBuyEnv = "production" | "sandbox";

const BASE_URLS: Record<BigBuyEnv, string> = {
  production: "https://api.bigbuy.eu",
  sandbox: "https://api.sandbox.bigbuy.eu",
};

export interface BigBuyClientOptions {
  token: string;
  env?: BigBuyEnv;
  /** Max attempts per request before giving up. Default 6. */
  maxRetries?: number;
  /** Called with human-readable progress/log lines. */
  log?: (msg: string) => void;
}

/** A node in BigBuy's taxonomy tree (their "categories"). */
export interface BigBuyTaxonomy {
  id: number;
  parentTaxonomy: number | null;
  name: string;
  url?: string;
  sort?: number;
  isoCode?: string;
  // tolerant: BigBuy occasionally nests children, we flatten on read.
  [k: string]: unknown;
}

/** A product row from /catalog/products. */
export interface BigBuyProduct {
  id: number;
  sku: string;
  wholesalePrice?: number;
  retailPrice?: number;
  ean13?: string;
  manufacturer?: number;
  condition?: string;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  inShopsDisepublished?: boolean;
  [k: string]: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class BigBuyClient {
  private base: string;
  private token: string;
  private maxRetries: number;
  private log: (msg: string) => void;

  constructor(opts: BigBuyClientOptions) {
    if (!opts.token) throw new Error("BigBuyClient: missing API token");
    this.token = opts.token;
    this.base = BASE_URLS[opts.env ?? "production"];
    this.maxRetries = opts.maxRetries ?? 6;
    this.log = opts.log ?? (() => {});
  }

  private buildUrl(path: string, params: Record<string, string | number | undefined>): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const sep = path.includes("?") ? "&" : "?";
    const query = qs.toString();
    return `${this.base}${path}${query ? sep + query : ""}`;
  }

  /** Low-level GET returning parsed JSON, with rate-limit aware retries. */
  async get<T = unknown>(
    path: string,
    params: Record<string, string | number | undefined> = {}
  ): Promise<T> {
    const url = this.buildUrl(path, params);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      } catch (err) {
        const wait = Math.min(60_000, 2 ** attempt * 1000);
        this.log(`  network error (${(err as Error).message}); retry in ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }

      if (res.ok) {
        const text = await res.text();
        if (!text) return [] as unknown as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error(`BigBuy: invalid JSON from ${path}: ${text.slice(0, 200)}`);
        }
      }

      // Rate limited or cache-warming — back off and retry.
      if (res.status === 429 || res.status === 409 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(15 * 60_000, 2 ** attempt * 5000);
        this.log(
          `  HTTP ${res.status} on ${path}; waiting ${Math.round(wait / 1000)}s ` +
            `(attempt ${attempt}/${this.maxRetries})`
        );
        await sleep(wait);
        continue;
      }

      // Non-retryable.
      const body = await res.text().catch(() => "");
      throw new Error(`BigBuy: HTTP ${res.status} on ${path} — ${body.slice(0, 300)}`);
    }

    throw new Error(`BigBuy: exhausted retries on ${path}`);
  }

  /** Full taxonomy ("category") tree. */
  getTaxonomies(isoCode = "en"): Promise<BigBuyTaxonomy[]> {
    return this.get<BigBuyTaxonomy[]>("/rest/catalog/taxonomies.json", { isoCode });
  }

  /** Products, optionally scoped to a taxonomy sub-tree. pageSize max 10000. */
  getProducts(opts: {
    parentTaxonomy?: number;
    page?: number;
    pageSize?: number;
    isoCode?: string;
  } = {}): Promise<BigBuyProduct[]> {
    return this.get<BigBuyProduct[]>("/rest/catalog/products.json", {
      parentTaxonomy: opts.parentTaxonomy,
      page: opts.page,
      pageSize: opts.pageSize,
      isoCode: opts.isoCode,
    });
  }

  /** Localised product names / descriptions / urls. */
  getProductsInformation(opts: {
    isoCode?: string;
    parentTaxonomy?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Array<Record<string, unknown>>> {
    return this.get("/rest/catalog/productsinformation.json", {
      isoCode: opts.isoCode ?? "en",
      parentTaxonomy: opts.parentTaxonomy,
      page: opts.page,
      pageSize: opts.pageSize,
    });
  }

  /** Product images. */
  getProductsImages(opts: {
    parentTaxonomy?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Array<Record<string, unknown>>> {
    return this.get("/rest/catalog/productsimages.json", {
      parentTaxonomy: opts.parentTaxonomy,
      page: opts.page,
      pageSize: opts.pageSize,
    });
  }

  /** Map of product -> taxonomy/category ids. */
  getProductsCategories(opts: {
    parentTaxonomy?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Array<Record<string, unknown>>> {
    return this.get("/rest/catalog/productscategories.json", {
      parentTaxonomy: opts.parentTaxonomy,
      page: opts.page,
      pageSize: opts.pageSize,
    });
  }

  /** Available stock per product (best-effort; endpoint may vary by account). */
  getProductsStock(opts: {
    parentTaxonomy?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Array<Record<string, unknown>>> {
    return this.get("/rest/catalog/productsstockavailable.json", {
      parentTaxonomy: opts.parentTaxonomy,
      page: opts.page,
      pageSize: opts.pageSize,
    });
  }
}

/** Read a value from an object trying several possible key names. */
export function pick<T = unknown>(
  obj: Record<string, unknown> | undefined | null,
  keys: string[]
): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}
