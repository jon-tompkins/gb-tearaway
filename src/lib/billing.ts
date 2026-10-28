import { randomInt } from "node:crypto";
import { isAdminEmail } from "./admin";
import { ANNUAL_PLANS } from "./plans";
import { listPayloadFields, loadPayload, savePayload } from "./persist";
import { periodEnd, stripeConfigured, type StripeSubscription } from "./stripe";

/**
 * Plans: every account gets a free first month, then $5/month through Stripe.
 * Access codes grant free time (N months, or forever) on top of that.
 *
 * Billing lives beside each user's state in botb_state under `billing:<email>`;
 * codes under `code:<CODE>`. Neither matches `user:*`, so the delivery cron's
 * user scan never sees them.
 *
 * Nothing is enforced until STRIPE_SECRET_KEY is set — before then there's no
 * way to pay, so expired trials keep working (the clock still runs).
 *
 * BILLING_GRACE_UNTIL (ISO date, e.g. 2026-12-01) softens the switch-on: until
 * then, expired trials keep working even with Stripe live, so existing families
 * get time to subscribe instead of being cut off the day the key goes in.
 */
export const PRICE_CENTS = 500;
/** Entry annual price (1 kid). Tiers for 2 and 5 kids live in plans.ts. */
export const ANNUAL_PRICE_CENTS = ANNUAL_PLANS[0].cents;
export const TRIAL_DAYS = 30;

const DAY = 86_400_000;
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

function graceActive(now: number): boolean {
  const until = Date.parse(process.env.BILLING_GRACE_UNTIL ?? "");
  return Number.isFinite(until) && until > now;
}

export interface Billing {
  trialStartedAt: string;
  trialEndsAt: string;
  customerId?: string;
  subscriptionId?: string;
  subStatus?: string;
  paidUntil?: string | null;
  cancelAtPeriodEnd?: boolean;
  /** Kid cap from the yearly plan they bought (undefined = no cap, e.g. monthly). */
  maxKids?: number;
  /** Free time from access codes. */
  compUntil?: string | null;
  compForever?: boolean;
  codes?: string[];
}

export interface Access {
  active: boolean;
  enforced: boolean;
  reason: "demo" | "admin" | "paid" | "code" | "trial" | "expired";
  /** When the current free/paid access runs out (null = no end). */
  until: string | null;
  trialEndsAt: string | null;
  subscribed: boolean;
  cancelAtPeriodEnd: boolean;
  codes: string[];
  priceCents: number;
  annualPriceCents: number;
  /** Most kids this account may have (null = no cap). */
  maxKids: number | null;
  /** Expired, but still active because BILLING_GRACE_UNTIL hasn't passed. */
  inGrace?: boolean;
}

export interface AccessCode {
  code: string;
  /** Months of free access per redemption; 0 = free forever. */
  months: number;
  /** Total redemptions allowed; 0 = unlimited. */
  maxUses: number;
  uses: number;
  note?: string;
  disabled?: boolean;
  createdAt: string;
  redeemedBy?: string[];
}

const emailOf = (userKey: string) => (userKey.startsWith("user:") ? userKey.slice(5) : null);
const billingKey = (email: string) => `billing:${email}`;
const codeKey = (code: string) => `code:${code}`;

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/** The user's billing record; the first read starts their free month. */
export async function getBilling(email: string): Promise<Billing> {
  const existing = await loadPayload<Billing>(billingKey(email));
  if (existing) return existing;
  const now = Date.now();
  const fresh: Billing = {
    trialStartedAt: new Date(now).toISOString(),
    trialEndsAt: new Date(now + TRIAL_DAYS * DAY).toISOString(),
  };
  await savePayload(billingKey(email), fresh);
  return fresh;
}

export async function saveBilling(email: string, b: Billing): Promise<void> {
  await savePayload(billingKey(email), b);
}

export function accessFrom(b: Billing, opts: { admin?: boolean; now?: number } = {}): Access {
  const now = opts.now ?? Date.now();
  const subscribed = !!b.subStatus && PAID_STATUSES.has(b.subStatus);
  const base = {
    enforced: stripeConfigured,
    trialEndsAt: b.trialEndsAt,
    subscribed,
    cancelAtPeriodEnd: !!b.cancelAtPeriodEnd,
    codes: b.codes ?? [],
    priceCents: PRICE_CENTS, annualPriceCents: ANNUAL_PRICE_CENTS,
    maxKids: subscribed && b.maxKids ? b.maxKids : null,
  };
  const later = (iso?: string | null) => !!iso && Date.parse(iso) > now;
  let reason: Access["reason"] = "expired";
  let until: string | null = null;
  if (opts.admin) reason = "admin";
  else if (subscribed) [reason, until] = ["paid", b.paidUntil ?? null];
  else if (b.compForever) reason = "code";
  else if (later(b.compUntil)) [reason, until] = ["code", b.compUntil!];
  else if (later(b.trialEndsAt)) [reason, until] = ["trial", b.trialEndsAt];
  const inGrace = reason === "expired" && stripeConfigured && graceActive(now);
  const active = reason !== "expired" || !stripeConfigured || inGrace;
  return { ...base, active, reason, until, ...(inGrace ? { inGrace } : {}) };
}

/** Access for a storage key (`user:<email>`, or the shared demo). */
export async function accessFor(userKey: string): Promise<Access> {
  const email = emailOf(userKey);
  if (!email) {
    return {
      active: true, enforced: stripeConfigured, reason: "demo", until: null, trialEndsAt: null,
      subscribed: false, cancelAtPeriodEnd: false, codes: [], priceCents: PRICE_CENTS, annualPriceCents: ANNUAL_PRICE_CENTS, maxKids: null,
    };
  }
  return accessFrom(await getBilling(email), { admin: isAdminEmail(email) });
}

/** Mirror a Stripe subscription onto the user's billing record. */
export async function applySubscription(email: string, sub: StripeSubscription): Promise<void> {
  const b = await getBilling(email);
  const end = periodEnd(sub);
  await saveBilling(email, {
    ...b,
    customerId: sub.customer,
    subscriptionId: sub.id,
    subStatus: sub.status,
    paidUntil: end ? new Date(end * 1000).toISOString() : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    maxKids: Number(sub.metadata?.maxKids) > 0 ? Number(sub.metadata?.maxKids) : undefined,
  });
}

// ---- Access codes ----

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

export function generateCode(): string {
  const part = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `BOX-${part()}-${part()}`;
}

export async function getCode(code: string): Promise<AccessCode | null> {
  return loadPayload<AccessCode>(codeKey(normalizeCode(code)));
}

export async function createCode(input: { code?: string; months: number; maxUses: number; note?: string }): Promise<AccessCode> {
  const code = normalizeCode(input.code || "") || generateCode();
  if (code.length < 4) throw new Error("Code must be at least 4 letters or numbers.");
  if (await getCode(code)) throw new Error(`${code} already exists.`);
  const c: AccessCode = {
    code,
    months: Math.max(0, Math.floor(input.months)),
    maxUses: Math.max(0, Math.floor(input.maxUses)),
    uses: 0,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
    redeemedBy: [],
  };
  await savePayload(codeKey(code), c);
  return c;
}

export async function setCodeDisabled(code: string, disabled: boolean): Promise<AccessCode | null> {
  const c = await getCode(code);
  if (!c) return null;
  const next = { ...c, disabled };
  await savePayload(codeKey(c.code), next);
  return next;
}

export async function listCodes(): Promise<AccessCode[]> {
  const rows = await listPayloadFields("code:", ["code", "months", "maxUses", "uses", "note", "disabled", "createdAt"], 500);
  return rows
    .map((r) => ({
      code: r.code ?? r.key.slice(5),
      months: Number(r.months ?? 0),
      maxUses: Number(r.maxUses ?? 0),
      uses: Number(r.uses ?? 0),
      note: r.note ?? undefined,
      disabled: r.disabled === "true",
      createdAt: r.createdAt ?? "",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Redeem a code for a signed-in user: stacks months onto any free time they already have. */
export async function redeemCode(email: string, raw: string): Promise<{ ok: true; access: Access } | { ok: false; error: string }> {
  const c = await getCode(raw);
  if (!c || c.disabled) return { ok: false, error: "That code isn't valid." };
  const b = await getBilling(email);
  if (b.codes?.includes(c.code)) return { ok: false, error: "You've already used this code." };
  if (c.maxUses > 0 && c.uses >= c.maxUses) return { ok: false, error: "That code has been used up." };

  const now = Date.now();
  const next: Billing = { ...b, codes: [...(b.codes ?? []), c.code] };
  if (c.months === 0) next.compForever = true;
  else {
    // Code time starts after whatever free time is left (trial or earlier codes).
    const start = Math.max(now, Date.parse(b.compUntil ?? "") || 0, Date.parse(b.trialEndsAt) || 0);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + c.months);
    next.compUntil = end.toISOString();
  }
  await saveBilling(email, next);
  await savePayload(codeKey(c.code), { ...c, uses: c.uses + 1, redeemedBy: [...(c.redeemedBy ?? []), email] });
  return { ok: true, access: accessFrom(next, { admin: isAdminEmail(email) }) };
}
