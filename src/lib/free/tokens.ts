import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type FreeTokenPurpose = "confirm" | "unsubscribe" | "switch" | "open";

export interface FreeTokenPayload {
  p: FreeTokenPurpose;
  /** Subscriber id. Never an email address. */
  s: string;
  /** Edition id, for confirm and open links. */
  e?: string;
  /** Local date (YYYY-MM-DD) for the open/PDF link. */
  d?: string;
  /** Expiry, unix milliseconds. */
  exp: number;
}

/** Confirmation links die after 72 hours. */
export const CONFIRM_TTL_MS = 72 * 60 * 60 * 1000;
/** Unsubscribe, switch, and PDF links stay valid for a little over a year. */
export const LINK_TTL_MS = 400 * 24 * 60 * 60 * 1000;

/**
 * Signing secret. Prefer FREE_EDITION_TOKEN_SECRET; otherwise reuse a secret
 * the app already has so a deploy does not need a new value to confirm mail.
 */
export function freeTokenSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.FREE_EDITION_TOKEN_SECRET || env.AUTH_SECRET || env.CRON_SECRET;
  const trimmed = s?.trim();
  return trimmed ? trimmed : null;
}

export function signFreeToken(payload: FreeTokenPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function mintFreeToken(
  purpose: FreeTokenPurpose,
  fields: { s: string; e?: string; d?: string },
  secret: string,
  nowMs: number,
): string {
  const ttl = purpose === "confirm" ? CONFIRM_TTL_MS : LINK_TTL_MS;
  return signFreeToken({ p: purpose, ...fields, exp: nowMs + ttl }, secret);
}

/** Returns the payload, or null when the signature, purpose, or expiry fails. */
export function verifyFreeToken(
  token: string,
  secret: string,
  nowMs: number,
  purpose?: FreeTokenPurpose,
): FreeTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: FreeTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as FreeTokenPayload;
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || typeof payload.s !== "string" || !payload.s) return null;
  if (payload.exp <= nowMs) return null;
  if (purpose && payload.p !== purpose) return null;
  return payload;
}

/** Consent-trail hash. The raw IP is not stored. */
export function hashIp(ip: string, secret: string): string {
  return createHash("sha256").update(`botb-free-consent|${secret}|${ip.trim()}`).digest("hex");
}
