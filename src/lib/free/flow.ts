import { logEvent } from "../events";
import { alertFreeFailure } from "./alert";
import { editionById, type FreeEdition } from "./editions";
import { freeTokenSecret, hashIp, verifyFreeToken } from "./tokens";
import { freeRuntime } from "./runtime";
import { sendFreeConfirmEmail } from "./mail";
import { findSubscriberByEmail, loadSubscriber, newSubscriberId, saveSubscriber } from "./repo";
import {
  applyConfirm,
  applyKeep,
  applySwitch,
  applyUnsubscribe,
  normalizeEmail,
  type FreeSubscriber,
} from "./subscriber";

const GENERIC_OK = { ok: true as const };

export async function startFreeSignup(emailRaw: string, edition: FreeEdition): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const runtime = await freeRuntime();
  if (!runtime.active) return { ok: false, status: 404, error: "not found" };
  const address = runtime.address;
  const secret = freeTokenSecret();
  if (!address) {
    console.error("[free-editions] FREE_EDITION_MAILING_ADDRESS is empty; refusing to send");
    await alertFreeFailure("no-mailing-address", "FREE_EDITION_MAILING_ADDRESS is empty. Refused to email a free-edition confirmation.");
    return { ok: false, status: 503, error: "Free editions aren't sending yet." };
  }
  if (!secret) {
    console.error("[free-editions] no token secret (set FREE_EDITION_TOKEN_SECRET, AUTH_SECRET, or CRON_SECRET)");
    await alertFreeFailure("no-token-secret", "No FREE_EDITION_TOKEN_SECRET, AUTH_SECRET, or CRON_SECRET. Refused to email a confirmation.");
    return { ok: false, status: 503, error: "Free editions aren't sending yet." };
  }

  const email = normalizeEmail(emailRaw);
  const now = new Date().toISOString();
  let sub = await findSubscriberByEmail(email);
  let send = true;
  if (!sub) {
    sub = { id: newSubscriberId(), email, editionId: edition.id, status: "pending", createdAt: now };
    await saveSubscriber(sub);
  } else if (sub.status === "confirmed" && sub.editionId === edition.id && !sub.pendingEditionId) {
    send = false;
  } else if (sub.status === "paused" && sub.editionId === edition.id && !sub.pendingEditionId) {
    send = false;
  } else {
    sub = { ...sub, pendingEditionId: edition.id };
    await saveSubscriber(sub);
  }

  if (send) {
    const mailed = await sendFreeConfirmEmail({
      subscriber: { ...sub, editionId: edition.id },
      edition,
      secret,
      upgradeText: runtime.upgradeText,
      address: runtime.address,
    });
    if (!mailed) return { ok: false, status: 502, error: "We couldn't send the confirmation email. Please try again." };
    await logEvent({
      type: "free_signup_started",
      meta: { subscriberId: sub.id, editionId: edition.id },
    });
  }
  return GENERIC_OK;
}

export async function confirmFreeSignup(
  token: string,
  ip: string,
): Promise<{ status: "ok"; editionId: string } | { status: "invalid" }> {
  const runtime = await freeRuntime();
  if (!runtime.active) return { status: "invalid" };
  const secret = freeTokenSecret();
  if (!secret) return { status: "invalid" };
  const payload = verifyFreeToken(token, secret, Date.now(), "confirm");
  if (!payload?.e) return { status: "invalid" };
  const edition = runtime.editions.find((e) => e.id === payload.e) ?? editionById(payload.e);
  if (!edition?.live || edition.archived) return { status: "invalid" };
  const sub = await loadSubscriber(payload.s);
  if (!sub) return { status: "invalid" };
  const at = new Date().toISOString();
  const next = applyConfirm(sub, edition.id, at, hashIp(ip, secret));
  await saveSubscriber(next.subscriber);
  if (next.log) {
    await logEvent({
      type: "free_signup_confirmed",
      meta: { subscriberId: sub.id, editionId: edition.id },
    });
  }
  return { status: "ok", editionId: edition.id };
}

export async function unsubscribeFree(token: string): Promise<"ok" | "invalid"> {
  if (!(await freeRuntime()).active) return "invalid";
  const secret = freeTokenSecret();
  if (!secret) return "invalid";
  const payload = verifyFreeToken(token, secret, Date.now(), "unsubscribe");
  if (!payload) return "invalid";
  const sub = await loadSubscriber(payload.s);
  if (!sub) return "invalid";
  const next = applyUnsubscribe(sub, new Date().toISOString());
  if (next.log) {
    await saveSubscriber(next.subscriber);
    await logEvent({
      type: "free_unsubscribed",
      meta: { subscriberId: sub.id, editionId: sub.editionId },
    });
  }
  return "ok";
}

export async function switchFreeEdition(token: string, editionId: string): Promise<"ok" | "invalid"> {
  const runtime = await freeRuntime();
  if (!runtime.active) return "invalid";
  const secret = freeTokenSecret();
  if (!secret) return "invalid";
  const edition = runtime.editions.find((e) => e.id === editionId) ?? editionById(editionId);
  if (!edition?.live || edition.archived) return "invalid";
  const payload = verifyFreeToken(token, secret, Date.now(), "switch");
  if (!payload) return "invalid";
  const sub = await loadSubscriber(payload.s);
  if (!sub) return "invalid";
  const next = applySwitch(sub, edition.id);
  if (!next) return "invalid";
  if (next !== sub) await saveSubscriber(next);
  return "ok";
}

export async function keepFreeForEmail(email: string): Promise<boolean> {
  const sub = await findSubscriberByEmail(email);
  if (!sub || sub.status === "unsubscribed") return false;
  await saveSubscriber(applyKeep(sub, new Date().toISOString()));
  return true;
}

export async function freeNoticeForEmail(email: string | null): Promise<{ show: boolean; label?: string }> {
  const runtime = await freeRuntime();
  if (!email || !runtime.active) return { show: false };
  const sub = await findSubscriberByEmail(email);
  if (!sub || sub.keepFree || sub.status !== "paused") return { show: false };
  return { show: true, label: runtime.editions.find((e) => e.id === sub.editionId)?.label ?? editionById(sub.editionId)?.label };
}

export async function noteFreeCustomStart(email: string | null, editionId: string | null): Promise<void> {
  const runtime = await freeRuntime();
  if (!runtime.active) return;
  const edition = editionId ? runtime.editions.find((e) => e.id === editionId) ?? editionById(editionId) : undefined;
  let subscriberId: string | undefined;
  if (email) {
    const sub = await findSubscriberByEmail(email);
    if (sub) {
      subscriberId = sub.id;
      if (sub.customEventAt) return;
      await saveSubscriber({ ...sub, customEventAt: new Date().toISOString() });
    }
  }
  await logEvent({
    type: "free_to_custom_started",
    meta: {
      ...(subscriberId ? { subscriberId } : {}),
      ...(edition ? { editionId: edition.id } : {}),
    },
  });
}

export function readSwitchToken(token: string | undefined) {
  if (!token) return null;
  const secret = freeTokenSecret();
  if (!secret) return null;
  return verifyFreeToken(token, secret, Date.now(), "switch");
}

export function clientIp(req: Request): string {
  const raw = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  return raw.split(",")[0].trim() || "unknown";
}

/** Subscriber resolved from a signed open/PDF token. */
export async function subscriberFromOpenToken(token: string): Promise<{ sub: FreeSubscriber; editionId: string; date: string } | null> {
  const secret = freeTokenSecret();
  if (!secret) return null;
  const payload = verifyFreeToken(token, secret, Date.now(), "open");
  if (!payload?.e || !payload.d) return null;
  const sub = await loadSubscriber(payload.s);
  if (!sub) return null;
  return { sub, editionId: payload.e, date: payload.d };
}
