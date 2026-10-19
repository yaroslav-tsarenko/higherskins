import { ALL_COUNTRIES } from "@/lib/countries";

/**
 * PayNT / OPPWA Payment Gateway Client
 * Implements Copy & Pay (SAQ-A PCI DSS) flow for secure card payments.
 */

export interface PrepareCheckoutParams {
  amount: number | string;
  currency: string;
  merchantTransactionId: string;
  shopperResultUrl: string;
  paymentType?: "DB" | "PA";
  customer?: {
    email?: string | null;
    givenName?: string | null;
    surname?: string | null;
    phone?: string | null;
    ip?: string | null;
  };
  billing?: {
    street1?: string | null;
    street2?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
    state?: string | null;
  };
}

export interface PrepareCheckoutResult {
  checkoutId: string;
  integrity: string;
  scriptUrl: string;
  shopperResultUrl: string;
  result: {
    code: string;
    description: string;
  };
  buildNumber?: string;
  timestamp?: string;
  ndc?: string;
}

export interface OppwaPaymentStatusResult {
  id: string;
  paymentType?: string;
  paymentBrand?: string;
  amount?: string;
  currency?: string;
  result: {
    code: string;
    description: string;
  };
  merchantTransactionId?: string;
  timestamp?: string;
  buildNumber?: string;
  card?: {
    bin?: string;
    last4Digits?: string;
    holder?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };
  threeDSecure?: {
    eci?: string;
  };
  customParameters?: Record<string, string>;
}

/**
 * Validates and retrieves the PayNT Bearer Token.
 * Throws early if empty or containing non-ASCII characters to prevent Node.js ByteString errors.
 */
export function getValidToken(): string {
  const token = (process.env.PAYNT_BEARER_TOKEN || "").trim();
  if (!token) {
    throw new Error("PAYNT_BEARER_TOKEN is not configured in environment variables.");
  }
  // Check for non-ASCII characters (codes > 127) which crash Node.js fetch header parser
  if (/[^\x00-\x7F]/.test(token)) {
    throw new Error(
      "PAYNT_BEARER_TOKEN contains non-ASCII characters. Check for Cyrillic or special characters in .env."
    );
  }
  return token;
}

/**
 * Returns the PayNT / OPPWA API base URL (defaults to test environment if not set).
 */
export function getValidBaseUrl(): string {
  const url = (process.env.PAYNT_BASE_URL || "https://eu-test.oppwa.com").trim();
  return url.replace(/\/+$/, "");
}

/**
 * Returns the PayNT Channel Entity ID.
 */
export function getValidEntityId(): string {
  const entityId = (process.env.PAYNT_ENTITY_ID || "").trim();
  if (!entityId) {
    throw new Error("PAYNT_ENTITY_ID is not configured in environment variables.");
  }
  return entityId;
}

/**
 * Maps country strings (names or codes) to ISO 3166-1 alpha-2 uppercase code (e.g., "GB", "US").
 * OPPWA rejects country names or invalid formats.
 */
export function toCountryCode2(countryInput?: string | null): string {
  if (!countryInput) return "GB";
  const trimmed = countryInput.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const normalized = trimmed.toLowerCase();
  const match = ALL_COUNTRIES.find(
    (c) => c.name.toLowerCase() === normalized || c.code.toLowerCase() === normalized
  );

  if (match) {
    return match.code.toUpperCase();
  }

  // Fallbacks for common variations
  const map: Record<string, string> = {
    "united kingdom": "GB",
    "uk": "GB",
    "great britain": "GB",
    "england": "GB",
    "scotland": "GB",
    "wales": "GB",
    "united states": "US",
    "usa": "US",
    "united states of america": "US",
    "germany": "DE",
    "france": "FR",
    "latvia": "LV",
    "estonia": "EE",
    "lithuania": "LT",
    "spain": "ES",
    "italy": "IT",
    "netherlands": "NL",
    "poland": "PL",
    "ukraine": "UA",
  };

  return map[normalized] || "GB";
}

/**
 * Sanitizes client IP address for OPPWA 3D Secure 2.0.
 * In local development (127.0.0.1 / ::1), substitutes a valid public IPv4
 * fallback so OPPWA does not reject transactions with error 100.900.400.
 */
export function sanitizeClientIp(ip?: string | null): string {
  const trimmed = (ip || "").trim();
  if (
    !trimmed ||
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "localhost" ||
    trimmed.startsWith("192.168.") ||
    trimmed.startsWith("10.") ||
    trimmed.startsWith("172.16.") ||
    trimmed.startsWith("fe80:")
  ) {
    return "93.177.100.1";
  }
  return trimmed;
}

/**
 * Extracts and sanitizes the client IP from request headers.
 */
export function extractClientIp(headers: Headers | { get: (name: string) => string | null }): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return sanitizeClientIp(cf);

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return sanitizeClientIp(first);
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return sanitizeClientIp(realIp);

  return sanitizeClientIp(null);
}

/**
 * Prepare Checkout (Step 1 of Copy & Pay)
 * POSTs to /v1/checkouts with application/x-www-form-urlencoded
 */
export async function prepareCheckout(
  params: PrepareCheckoutParams
): Promise<PrepareCheckoutResult> {
  const token = getValidToken();
  const baseUrl = getValidBaseUrl();
  const entityId = getValidEntityId();

  // OPPWA amount must be strictly 2 decimals
  const numAmount = typeof params.amount === "number" ? params.amount : parseFloat(params.amount);
  const formattedAmount = Number.isFinite(numAmount) ? numAmount.toFixed(2) : "0.00";

  const formParams = new URLSearchParams();
  formParams.append("entityId", entityId);
  formParams.append("amount", formattedAmount);
  formParams.append("currency", (params.currency || "EUR").toUpperCase());
  formParams.append("paymentType", params.paymentType || "DB");
  formParams.append("integrity", "true");
  formParams.append("merchantTransactionId", params.merchantTransactionId);
  // NOTE: In Copy & Pay, shopperResultUrl is passed ONLY in HTML <form action="...">, NOT in POST body!

  // Strictly mandatory for 3D Secure on live channels: customer.ip
  const clientIp = sanitizeClientIp(params.customer?.ip);
  formParams.append("customer.ip", clientIp);

  // Optional 3D Secure 2.0 and Anti-fraud fields
  if (params.customer?.email) {
    formParams.append("customer.email", params.customer.email.trim());
  }
  if (params.customer?.givenName) {
    formParams.append("customer.givenName", params.customer.givenName.trim());
  }
  if (params.customer?.surname) {
    formParams.append("customer.surname", params.customer.surname.trim());
  }
  if (params.customer?.phone) {
    formParams.append("customer.phone", params.customer.phone.trim());
  }

  if (params.billing) {
    if (params.billing.street1) {
      formParams.append("billing.street1", params.billing.street1.trim());
    }
    if (params.billing.street2) {
      formParams.append("billing.street2", params.billing.street2.trim());
    }
    if (params.billing.city) {
      formParams.append("billing.city", params.billing.city.trim());
    }
    if (params.billing.postcode) {
      formParams.append("billing.postcode", params.billing.postcode.trim());
    }
    const isoCountry = toCountryCode2(params.billing.country);
    formParams.append("billing.country", isoCountry);
    if (params.billing.state) {
      formParams.append("billing.state", params.billing.state.trim());
    }
  }

  const endpoint = `${baseUrl}/v1/checkouts`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: formParams.toString(),
  });

  const data = await response.json();

  if (!response.ok || !data.id) {
    const errorMsg =
      data.result?.description ||
      data.message ||
      `PayNT checkout creation failed with status ${response.status}`;
    console.error("[PayNT prepareCheckout] Error:", data);
    throw new Error(errorMsg);
  }

  return {
    checkoutId: data.id,
    integrity: data.integrity || "",
    scriptUrl: `${baseUrl}/v1/paymentWidgets.js?checkoutId=${data.id}`,
    shopperResultUrl: params.shopperResultUrl,
    result: data.result,
    buildNumber: data.buildNumber,
    timestamp: data.timestamp,
    ndc: data.ndc,
  };
}

/**
 * Get Payment Status (Step 3 of Copy & Pay)
 * GETs {baseUrl}{resourcePath}?entityId={entityId}
 * NOTE: Respect OPPWA rate limits! Do not poll more than 2 times/minute per checkoutId.
 */
export async function getPaymentStatus(
  resourcePath: string
): Promise<OppwaPaymentStatusResult> {
  const token = getValidToken();
  const baseUrl = getValidBaseUrl();
  const entityId = getValidEntityId();

  // Clean resourcePath
  const cleanPath = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  const separator = cleanPath.includes("?") ? "&" : "?";
  const url = `${baseUrl}${cleanPath}${separator}entityId=${encodeURIComponent(entityId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok && !data.result) {
    const errorMsg =
      data.result?.description ||
      data.message ||
      `Failed to fetch PayNT payment status (status ${response.status})`;
    console.error("[PayNT getPaymentStatus] Error:", data);
    throw new Error(errorMsg);
  }

  return data as OppwaPaymentStatusResult;
}

/**
 * Checks whether an OPPWA result code corresponds to a successful transaction.
 * Examples of success codes:
 * - 000.000.000 (Live mode success)
 * - 000.100.110, 000.100.112 (Integrator/Test mode success)
 * - 000.300..., 000.600... (Success with conditions)
 */
export function isPaymentSuccessful(code?: string | null): boolean {
  if (!code) return false;
  return /^(000\.000\.|000\.100\.1|000\.[36])/.test(code);
}

/**
 * Checks whether an OPPWA result code indicates a pending state (e.g. waiting for shopper / 3DS).
 */
export function isPaymentPending(code?: string | null): boolean {
  if (!code) return false;
  return /^(000\.200)/.test(code);
}
