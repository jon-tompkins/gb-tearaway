import type { Access } from "./billing";

/** Banner starts this many days before the charge date when a plan is picked and no card is on file. */
export const TRIAL_ENDING_BANNER_DAYS = 7;

const DAY = 86_400_000;

/** Global banner: trial ending soon, a failed payment, or a paused plan still inside the delivery grace. */
export function showMissingCardBanner(a: Access, now = Date.now()): boolean {
  if (!a.active || a.cardAction === "none") return false;
  if (a.subStatus === "paused" || a.subStatus === "past_due" || a.paymentGraceUntil) return true;
  const end = Date.parse(a.until ?? "");
  if (!Number.isFinite(end)) return false;
  return Math.ceil((end - now) / DAY) <= TRIAL_ENDING_BANNER_DAYS;
}
