import { hashString, mulberry32, shuffle } from "../rng";

export interface RotateKey {
  dateISO: string;
  /** Kid's first name — each kid walks the bank in their own order. */
  kid: string;
  /** "Shuffle" bumps this to step to the next item on the same day. */
  nonce: number;
}

/**
 * Pick from a static bank without repeats: the bank is put in a fixed shuffled
 * order per kid, and each calendar day takes the next item. Nothing repeats
 * until the whole pool has been used (a seeded random pick repeats within weeks).
 */
export function pickRotating<T>(pool: readonly T[], key: RotateKey, salt: string): T {
  if (pool.length === 0) throw new Error("pickRotating() on empty pool");
  const order = shuffle(mulberry32(hashString(`${key.kid.trim().toLowerCase()}|${salt}`)), pool);
  const day = Math.floor(Date.parse(`${key.dateISO}T00:00:00Z`) / 86_400_000);
  const step = (Number.isFinite(day) ? day : 0) + key.nonce;
  return order[((step % order.length) + order.length) % order.length];
}
