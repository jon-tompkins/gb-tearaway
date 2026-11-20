import { PAYMENT_GRACE_DAYS, getBilling, saveBilling, type Billing } from "./billing";
import { sendEmail } from "./email";
import { PLANS, centsFor, type PlanInterval } from "./plans";
import { claimPayload, deletePayload } from "./persist";

const DAY = 86_400_000;
/** Stripe sends customer.subscription.trial_will_end three days before trial end. */
export const TRIAL_REMINDER_DAYS = 3;
/** Half-day slack so a once-a-day cron still covers Stripe's 3-day webhook. */
export const TRIAL_REMINDER_WINDOW_MS = (TRIAL_REMINDER_DAYS + 0.5) * DAY;

export const TRIAL_REMINDER_SUBJECT = "Add a card before your Back of the Box trial ends";

/** Off unless BILLING_TRIAL_REMINDER_EMAIL is 1, true, yes, or on. */
export function trialReminderEmailsEnabled(): boolean {
  const v = (process.env.BILLING_TRIAL_REMINDER_EMAIL ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function formatReminderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

/** "monthly" or "yearly", matching the subscription interval. */
export function reminderPlanName(interval: PlanInterval): "monthly" | "yearly" {
  return interval === "year" ? "yearly" : "monthly";
}

/** Dollar price for that interval, from plans.ts. */
export function reminderPrice(interval: PlanInterval): string {
  const dollars = centsFor(PLANS[0], interval) / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function trialReminderContent(
  endIso: string,
  site: string,
  interval: PlanInterval,
): { subject: string; html: string; text: string } {
  const date = formatReminderDate(endIso);
  const url = `${site.replace(/\/$/, "")}/app/billing`;
  const plan = reminderPlanName(interval);
  const price = reminderPrice(interval);
  const text = [
    `Your free trial ends on ${date}.`,
    `You picked the ${plan} plan, and we haven't charged you anything. There's no card on file yet. Add one before ${date} and the morning pages keep coming. The first charge is on ${date}: ${price} for ${plan}.`,
    `If the trial ends without a card, pages keep arriving for ${PAYMENT_GRACE_DAYS} more days, then delivery pauses until you add one. Paused days aren't billed, and your pages and settings stay saved.`,
    `Add a card: ${url}`,
    "You can change or cancel anytime from that page.",
    "Thanks for printing with us.",
    "— Jonto and son, Back of the Box",
  ].join("\n");
  const paragraphs = text
    .split("\n")
    .map((line) => {
      if (line.startsWith("Add a card: ")) {
        return `<p style="margin:0 0 14px">Add a card: <a href="${esc(url)}">${esc(url)}</a></p>`;
      }
      return `<p style="margin:0 0 14px">${esc(line)}</p>`;
    })
    .join("");
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f4eee3;font-family:Georgia,'Times New Roman',serif;color:#1c1915">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eee3;padding:28px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#faf6ec;border:1px solid #e3d9c4;border-radius:14px;padding:32px">
        <tr><td align="center" style="padding-bottom:8px">
          <div style="font-size:26px;font-weight:700;letter-spacing:-.01em">Back of the Box</div>
        </td></tr>
        <tr><td style="padding:18px 8px 6px;font-size:16px;line-height:1.55">
          ${paragraphs}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject: TRIAL_REMINDER_SUBJECT, html, text };
}

export function shouldSendTrialReminder(
  b: Billing,
  now: number,
  enabled = trialReminderEmailsEnabled(),
): { send: boolean; reason: string; endIso?: string; endMs?: number } {
  if (!enabled) return { send: false, reason: "disabled" };
  if (b.subStatus !== "trialing") return { send: false, reason: "not_trialing" };
  if (b.hasPaymentMethod !== false) return { send: false, reason: "card_on_file_or_unknown" };
  const endMs = Date.parse(b.paidUntil ?? "") || Date.parse(b.trialEndsAt);
  if (!Number.isFinite(endMs)) return { send: false, reason: "no_end" };
  const endIso = new Date(endMs).toISOString();
  if (b.trialReminderFor === endIso) return { send: false, reason: "already_sent" };
  const ms = endMs - now;
  if (ms <= 0) return { send: false, reason: "trial_ended" };
  if (ms > TRIAL_REMINDER_WINDOW_MS) return { send: false, reason: "too_early" };
  return { send: true, reason: "due", endIso, endMs };
}

/** One reminder per trial end. No-ops when the env flag is off or a card is already on file. */
export async function sendTrialEndReminder(email: string, now = Date.now()): Promise<"sent" | "skipped" | "failed"> {
  if (!trialReminderEmailsEnabled()) return "skipped";
  const b = await getBilling(email);
  const decision = shouldSendTrialReminder(b, now, true);
  const interval = b.planInterval;
  if (!decision.send || !decision.endIso || decision.endMs == null) return "skipped";
  if (interval !== "month" && interval !== "year") return "skipped";
  const claimKey = `remind:${email}:${decision.endMs}`;
  const claimed = await claimPayload(claimKey, { at: new Date(now).toISOString() });
  if (!claimed) return "skipped";
  const site = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";
  const { subject, html } = trialReminderContent(decision.endIso, site, interval);
  const ok = await sendEmail({ to: email, subject, html });
  if (!ok) {
    await deletePayload(claimKey);
    return "failed";
  }
  const latest = await getBilling(email);
  await saveBilling(email, { ...latest, trialReminderFor: decision.endIso });
  return "sent";
}
