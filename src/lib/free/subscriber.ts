import { dateISOInZone, partsInZone } from "../dates";
import type { FreeEdition } from "./editions";

export type FreeSubscriberStatus = "pending" | "confirmed" | "unsubscribed" | "paused";
export type FreePauseReason = "custom_page" | "trial" | "billing";

/** One parent email on one shared edition. No child fields. */
export interface FreeSubscriber {
  id: string;
  email: string;
  editionId: string;
  status: FreeSubscriberStatus;
  createdAt: string;
  /** Edition chosen on a later signup, applied when the confirm link is opened. */
  pendingEditionId?: string;
  confirmedAt?: string;
  consentAt?: string;
  /** SHA-256 of the confirming request's IP. Never the raw address. */
  consentIpHash?: string;
  unsubscribedAt?: string;
  pausedAt?: string;
  pauseReason?: FreePauseReason;
  /** Parent asked to keep the free edition after starting a custom page or trial. */
  keepFree?: boolean;
  keptAt?: string;
  /** Local date (edition timezone) of the last successful send. */
  lastSentDate?: string;
  trialEventAt?: string;
  customEventAt?: string;
}

export interface FreeSendJob {
  subscriberId: string;
  editionId: string;
  date: string;
  cacheKey: string;
  claimKey: string;
}

export interface FreeSendPlan {
  outcome: "disabled" | "no-address" | "ok";
  jobs: FreeSendJob[];
  /** Confirmed subscribers whose local send hour has passed. Zero when the flag is off. */
  dueCount: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validEmail(email: string): boolean {
  return email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function freePdfCacheKey(editionId: string, date: string): string {
  return `free:pdf:${editionId}:${date}`;
}

export function freeSendClaimKey(subscriberId: string, date: string): string {
  return `free:sent:${subscriberId}:${date}`;
}

export function claimIsStale(at: string | undefined, nowMs: number, staleMs: number): boolean {
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && nowMs - t > staleMs;
}

/**
 * Who would get a free edition on this cron tick.
 * Flag off → no jobs. Missing mailing address → no jobs (dueCount still reports
 * how many we refused). Already sent today, or an existing claim, → skipped.
 */
export function planFreeSends(args: {
  enabled: boolean;
  mailingAddress: string;
  now: Date;
  editions: readonly FreeEdition[];
  subscribers: readonly FreeSubscriber[];
  claimed?: ReadonlySet<string>;
}): FreeSendPlan {
  if (!args.enabled) return { outcome: "disabled", jobs: [], dueCount: 0 };
  const byId = new Map(args.editions.map((e) => [e.id, e]));
  const claimed = args.claimed ?? new Set<string>();
  const jobs: FreeSendJob[] = [];
  let dueCount = 0;
  for (const sub of args.subscribers) {
    if (sub.status !== "confirmed") continue;
    const edition = byId.get(sub.editionId);
    if (!edition?.live || edition.paused || edition.archived) continue;
    const date = dateISOInZone(edition.timezone, args.now);
    const { hour, minute } = partsInZone(edition.timezone, args.now);
    const sendMinute = edition.sendMinute ?? 0;
    if (hour < edition.sendHour || (hour === edition.sendHour && minute < sendMinute)) continue;
    dueCount++;
    if (sub.lastSentDate === date) continue;
    const claimKey = freeSendClaimKey(sub.id, date);
    if (claimed.has(claimKey)) continue;
    jobs.push({
      subscriberId: sub.id,
      editionId: edition.id,
      date,
      cacheKey: freePdfCacheKey(edition.id, date),
      claimKey,
    });
  }
  if (!args.mailingAddress.trim()) return { outcome: "no-address", jobs: [], dueCount };
  return { outcome: "ok", jobs, dueCount };
}

export function applyConfirm(
  sub: FreeSubscriber,
  editionId: string,
  at: string,
  ipHash: string,
): { subscriber: FreeSubscriber; log: boolean } {
  const editionChanged = sub.editionId !== editionId || sub.pendingEditionId === editionId;
  const next: FreeSubscriber = {
    ...sub,
    editionId,
    pendingEditionId: undefined,
    consentAt: at,
    consentIpHash: ipHash,
    confirmedAt: sub.confirmedAt ?? at,
  };
  if (sub.status === "paused" && !sub.keepFree) {
    return { subscriber: { ...next, status: "paused" }, log: !sub.confirmedAt };
  }
  const log = sub.status !== "confirmed" || editionChanged;
  return {
    subscriber: { ...next, status: "confirmed", unsubscribedAt: undefined },
    log,
  };
}

export function applyUnsubscribe(sub: FreeSubscriber, at: string): { subscriber: FreeSubscriber; log: boolean } {
  if (sub.status === "unsubscribed") return { subscriber: sub, log: false };
  return {
    subscriber: {
      ...sub,
      status: "unsubscribed",
      unsubscribedAt: at,
      pendingEditionId: undefined,
    },
    log: true,
  };
}

export function applySwitch(sub: FreeSubscriber, editionId: string): FreeSubscriber | null {
  if (sub.status === "unsubscribed") return null;
  if (sub.editionId === editionId && !sub.pendingEditionId) return sub;
  return { ...sub, editionId, pendingEditionId: undefined };
}

/**
 * Stop the free edition when a custom page or a trial/checkout starts.
 * A parent who already chose to keep it is left alone.
 */
export function applyUpgradeStop(
  sub: FreeSubscriber,
  reason: FreePauseReason,
  at: string,
): { subscriber: FreeSubscriber; changed: boolean } {
  if (sub.keepFree || sub.status === "unsubscribed" || sub.status === "paused") {
    return { subscriber: sub, changed: false };
  }
  if (sub.status !== "confirmed" && sub.status !== "pending") return { subscriber: sub, changed: false };
  return {
    subscriber: { ...sub, status: "paused", pauseReason: reason, pausedAt: at },
    changed: true,
  };
}

/** Record the free-to-trial metric once per subscriber. */
export function noteTrialStart(sub: FreeSubscriber, at: string): { subscriber: FreeSubscriber; log: boolean } {
  if (sub.trialEventAt) return { subscriber: sub, log: false };
  return { subscriber: { ...sub, trialEventAt: at }, log: true };
}

export function applyKeep(sub: FreeSubscriber, at: string): FreeSubscriber {
  const confirmed = sub.status === "confirmed" || !!sub.confirmedAt;
  const status: FreeSubscriberStatus = sub.status === "unsubscribed" ? "unsubscribed" : confirmed ? "confirmed" : "pending";
  return {
    ...sub,
    keepFree: true,
    keptAt: at,
    status,
    pauseReason: undefined,
    pausedAt: undefined,
  };
}

export type SignupGate = "off" | "honeypot" | "email" | "edition" | "ok";

export function rejectSignup(input: {
  enabled: boolean;
  company?: string;
  email: string;
  editionLive: boolean;
}): SignupGate {
  if (!input.enabled) return "off";
  if (typeof input.company === "string" && input.company.trim()) return "honeypot";
  if (!validEmail(input.email)) return "email";
  if (!input.editionLive) return "edition";
  return "ok";
}
