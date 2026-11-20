import { logEvent } from "../events";
import { eventsSince } from "../events";
import { dateISOInZone } from "../dates";
import type { FreeEdition } from "./editions";
import { deletePayload, loadPayload, savePayload } from "../persist";
import { freePdfCacheKey, type FreeSubscriber } from "./subscriber";
import { listSubscribers } from "./repo";
import { renderFreeEditionPdf } from "./render";
import { sendFreeConfirmEmail, sendFreeDailyEmail } from "./mail";
import { freeTokenSecret } from "./tokens";
import { singleTestRecipient } from "./settings";

export function adminDenied(isAdminUser: boolean): 404 | null {
  return isAdminUser ? null : 404;
}

export async function auditFreeChange(actor: string, action: string, before: unknown, after: unknown): Promise<void> {
  await logEvent({
    type: "free_admin_change",
    user_key: actor.includes("@") ? `user:${actor.toLowerCase()}` : null,
    meta: { actor, action, before, after },
  });
}

export interface EditionStats {
  id: string;
  confirmed: number;
  pending: number;
  unsubscribed: number;
  paused: number;
  toCustom: number;
  toTrial: number;
}

export async function editionStats(editions: readonly FreeEdition[]): Promise<EditionStats[]> {
  const subs = await listSubscribers();
  const events = await eventsSince("2020-01-01T00:00:00.000Z").catch(() => []);
  return editions.map((e) => ({
    id: e.id,
    confirmed: subs.filter((s) => s.editionId === e.id && s.status === "confirmed").length,
    pending: subs.filter((s) => s.editionId === e.id && s.status === "pending").length,
    unsubscribed: subs.filter((s) => s.editionId === e.id && s.status === "unsubscribed").length,
    paused: subs.filter((s) => s.editionId === e.id && s.status === "paused").length,
    toCustom: events.filter((ev) => ev.type === "free_to_custom_started" && ev.meta?.editionId === e.id).length,
    toTrial: events.filter((ev) => ev.type === "free_to_trial_started" && ev.meta?.editionId === e.id).length,
  }));
}

export function editionCsv(subs: readonly FreeSubscriber[], editionId: string): string {
  const lines = ["id,status,edition,created,confirmed,last_sent,email"];
  for (const s of subs.filter((row) => row.editionId === editionId)) {
    lines.push([s.id, s.status, s.editionId, s.createdAt, s.confirmedAt ?? "", s.lastSentDate ?? "", s.email].map(csvCell).join(","));
  }
  return lines.join("\n");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function alreadySentToday(edition: FreeEdition): Promise<number> {
  const today = dateISOInZone(edition.timezone);
  const subs = await listSubscribers();
  return subs.filter((s) => s.editionId === edition.id && s.status === "confirmed" && s.lastSentDate === today).length;
}

/** Replace today's cached PDF. Does not email anyone. */
export async function regenerateEditionPdf(edition: FreeEdition, upgradeText: string): Promise<void> {
  const today = dateISOInZone(edition.timezone);
  await deletePayload(freePdfCacheKey(edition.id, today));
  await deletePayload(`free:gen:${edition.id}:${today}`);
  await renderFreeEditionPdf(edition, today, upgradeText);
}

/** One row in botb_state. The day is UTC. */
export const ADMIN_TEST_SEND_KEY = "free:admin:test-send";
export const ADMIN_TEST_GAP_MS = 30_000;
export const ADMIN_TEST_DAILY_CAP = 20;

export interface AdminTestBudget {
  lastAt: number;
  day: string;
  count: number;
}

/** At most one test send every 30 seconds, and 20 on a UTC day. */
export function decideAdminTestSend(
  current: AdminTestBudget | null,
  now: number,
): { ok: true; next: AdminTestBudget } | { ok: false; error: string } {
  const day = new Date(now).toISOString().slice(0, 10);
  const count = current?.day === day ? current.count : 0;
  if (current && now - current.lastAt < ADMIN_TEST_GAP_MS) {
    return { ok: false, error: "Wait 30 seconds between test sends." };
  }
  if (count >= ADMIN_TEST_DAILY_CAP) {
    return { ok: false, error: "Test sends are limited to 20 a day." };
  }
  return { ok: true, next: { lastAt: now, day, count: count + 1 } };
}

export async function reserveAdminTestSend(now = Date.now()): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await loadPayload<AdminTestBudget>(ADMIN_TEST_SEND_KEY);
  const decision = decideAdminTestSend(current, now);
  if (!decision.ok) return decision;
  await savePayload(ADMIN_TEST_SEND_KEY, decision.next);
  return { ok: true };
}

export async function sendAdminTest(opts: {
  to: string;
  kind: "confirm" | "edition";
  edition: FreeEdition;
  upgradeText: string;
  address: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const recipient = singleTestRecipient(opts.to);
  if (!recipient.ok) return recipient;
  const secret = freeTokenSecret();
  if (!secret) return { ok: false, error: "No token secret is set, so a test email cannot be signed." };
  if (!opts.address.trim()) return { ok: false, error: "Add a mailing address before sending. The env var is empty too." };
  const reserved = await reserveAdminTestSend();
  if (!reserved.ok) return reserved;
  const subscriber = {
    id: "fs_admin_test",
    email: recipient.email,
    editionId: opts.edition.id,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  if (opts.kind === "confirm") {
    const ok = await sendFreeConfirmEmail({ subscriber, edition: opts.edition, secret, upgradeText: opts.upgradeText, address: opts.address });
    return ok ? { ok: true } : { ok: false, error: "The email provider rejected the test." };
  }
  const today = dateISOInZone(opts.edition.timezone);
  const pdf = await renderFreeEditionPdf(opts.edition, today, opts.upgradeText);
  if (!pdf) return { ok: false, error: "Today's PDF did not render." };
  const ok = await sendFreeDailyEmail({
    subscriber: { ...subscriber, status: "confirmed" },
    edition: opts.edition,
    date: today,
    pdf,
    secret,
    address: opts.address || "Test address",
    upgradeText: opts.upgradeText,
  });
  return ok ? { ok: true } : { ok: false, error: "The email provider rejected the test." };
}
