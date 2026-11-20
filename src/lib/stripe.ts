import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Stripe client over fetch (no SDK): Checkout, the billing portal,
 * subscription reads and webhook signature checks are all we need.
 *
 * Env: STRIPE_SECRET_KEY (sk_live_… / sk_test_…), STRIPE_WEBHOOK_SECRET (whsec_…),
 * optional STRIPE_PRICE_ID_KIDS{2,5}_{YEAR,QUARTER} — without them Checkout creates the price inline from plans.ts.
 */
function stripeKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY;
}

const KEY = stripeKey();

export const stripeConfigured = !!KEY;
/** Live read, so access checks follow the env even when tests set it after import. */
export function isStripeConfigured(): boolean {
  return !!stripeKey();
}
/** Sandbox keys (sk_test_…): checkout works with test cards only and nothing real is charged. */
export const stripeTestMode = !!KEY && KEY.startsWith("sk_test_");

/** Flatten nested params into Stripe's form encoding (a[b][0][c]=…). */
function encode(params: Record<string, unknown>, prefix = "", out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === "object" ? encode(item as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === "object") encode(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

/**
 * Form body for a Stripe call. `{CHECKOUT_SESSION_ID}` is put back after
 * encoding so Stripe can substitute the real Checkout Session id.
 */
export function stripeRequestBody(params: Record<string, unknown>): string {
  return encode(params).toString().replaceAll("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
}

export async function stripe<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  params?: Record<string, unknown>,
  opts?: { version?: string },
): Promise<T> {
  const key = stripeKey();
  if (!key) throw new Error("Stripe is not configured");
  const qs = params ? stripeRequestBody(params) : "";
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" };
  if (opts?.version) headers["Stripe-Version"] = opts.version;
  const res = await fetch(`https://api.stripe.com/v1/${path}${method === "GET" && qs ? `?${qs}` : ""}`, {
    method,
    headers,
    body: method === "POST" ? qs : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Stripe HTTP ${res.status}`);
  return json;
}

/** Verify a `Stripe-Signature` header against the raw body (5-minute tolerance). */
export function verifyWebhook(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  return sigs.some((s) => {
    const got = Buffer.from(s);
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: Array<{ current_period_end?: number }> };
  metadata?: Record<string, string>;
  default_payment_method?: string | { id: string } | null;
  default_source?: string | { id: string } | null;
}

/** Stripe returns a payment method as an id string, or expanded `{ id }`. */
export function paymentMethodId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

/** Period end moved onto subscription items in newer API versions — read either. */
export function periodEnd(sub: StripeSubscription): number | null {
  return sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
}
