import { NextResponse } from "next/server";
import type { Billing } from "@/lib/billing";
import { cronAuthorized } from "@/lib/cronAuth";
import { listPayloadFields } from "@/lib/persist";
import { sendTrialEndReminder, shouldSendTrialReminder, trialReminderEmailsEnabled } from "@/lib/trialReminder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily backup for the trial-end card reminder. Stripe's
 * customer.subscription.trial_will_end webhook is the primary send.
 * No-ops unless BILLING_TRIAL_REMINDER_EMAIL is on.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!trialReminderEmailsEnabled()) return NextResponse.json({ enabled: false, sent: 0, skipped: 0, failed: 0 });

  const rows = await listPayloadFields(
    "billing:",
    ["subStatus", "hasPaymentMethod", "paidUntil", "trialEndsAt", "trialReminderFor", "subscriptionId"],
    2000,
  );
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rows) {
    const email = row.key.startsWith("billing:") ? row.key.slice("billing:".length) : "";
    if (!email) continue;
    const billing: Billing = {
      trialStartedAt: "",
      trialEndsAt: row.trialEndsAt || "",
      subStatus: row.subStatus || undefined,
      hasPaymentMethod: row.hasPaymentMethod === "false" ? false : row.hasPaymentMethod === "true" ? true : undefined,
      paidUntil: row.paidUntil,
      trialReminderFor: row.trialReminderFor || undefined,
      subscriptionId: row.subscriptionId || undefined,
    };
    if (!shouldSendTrialReminder(billing, Date.now(), true).send) {
      skipped++;
      continue;
    }
    const result = await sendTrialEndReminder(email);
    if (result === "sent") sent++;
    else if (result === "failed") failed++;
    else skipped++;
  }
  return NextResponse.json({ enabled: true, sent, skipped, failed });
}
