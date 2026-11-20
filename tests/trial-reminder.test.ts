import assert from "node:assert/strict";
import { after, test } from "node:test";
import { PAYMENT_GRACE_DAYS } from "../src/lib/billing";
import type { Billing } from "../src/lib/billing";
import {
  TRIAL_REMINDER_SUBJECT,
  TRIAL_REMINDER_WINDOW_MS,
  formatReminderDate,
  shouldSendTrialReminder,
  trialReminderContent,
  trialReminderEmailsEnabled,
} from "../src/lib/trialReminder";

const NOW = Date.parse("2026-06-15T16:00:00.000Z");
const DAY = 86_400_000;
const prev = process.env.BILLING_TRIAL_REMINDER_EMAIL;

after(() => {
  if (prev === undefined) delete process.env.BILLING_TRIAL_REMINDER_EMAIL;
  else process.env.BILLING_TRIAL_REMINDER_EMAIL = prev;
});

function bill(partial: Partial<Billing> = {}): Billing {
  return {
    trialStartedAt: "2026-05-16T16:00:00.000Z",
    trialEndsAt: new Date(NOW + 2 * DAY).toISOString(),
    subStatus: "trialing",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW + 2 * DAY).toISOString(),
    subscriptionId: "sub_1",
    ...partial,
  };
}

test("the reminder flag defaults off and accepts the on values", () => {
  delete process.env.BILLING_TRIAL_REMINDER_EMAIL;
  assert.equal(trialReminderEmailsEnabled(), false);
  for (const v of ["1", "true", "YES", "on"]) {
    process.env.BILLING_TRIAL_REMINDER_EMAIL = v;
    assert.equal(trialReminderEmailsEnabled(), true, v);
  }
  process.env.BILLING_TRIAL_REMINDER_EMAIL = "0";
  assert.equal(trialReminderEmailsEnabled(), false);
});

test("reminder sends only for a trialing plan with no card, inside the window", () => {
  const due = shouldSendTrialReminder(bill(), NOW, true);
  assert.equal(due.send, true);
  assert.equal(due.reason, "due");

  assert.equal(shouldSendTrialReminder(bill(), NOW, false).reason, "disabled");
  assert.equal(shouldSendTrialReminder(bill({ hasPaymentMethod: true }), NOW, true).reason, "card_on_file_or_unknown");
  assert.equal(shouldSendTrialReminder(bill({ hasPaymentMethod: undefined }), NOW, true).reason, "card_on_file_or_unknown");
  assert.equal(shouldSendTrialReminder(bill({ subStatus: "paused" }), NOW, true).reason, "not_trialing");
  assert.equal(shouldSendTrialReminder(bill({ subStatus: "active" }), NOW, true).reason, "not_trialing");
  assert.equal(shouldSendTrialReminder(bill({ paidUntil: new Date(NOW - DAY).toISOString() }), NOW, true).reason, "trial_ended");
  assert.equal(shouldSendTrialReminder(bill({ paidUntil: new Date(NOW + 10 * DAY).toISOString() }), NOW, true).reason, "too_early");
  const endIso = new Date(NOW + 2 * DAY).toISOString();
  assert.equal(shouldSendTrialReminder(bill({ trialReminderFor: endIso }), NOW, true).reason, "already_sent");

  const justInside = shouldSendTrialReminder(bill({ paidUntil: new Date(NOW + TRIAL_REMINDER_WINDOW_MS).toISOString() }), NOW, true);
  assert.equal(justInside.send, true);
  const justOutside = shouldSendTrialReminder(bill({ paidUntil: new Date(NOW + TRIAL_REMINDER_WINDOW_MS + 60_000).toISOString() }), NOW, true);
  assert.equal(justOutside.reason, "too_early");
});

test("reminder copy names the date, the billing link, and the grace, and no price", () => {
  const end = "2026-04-10T16:00:00.000Z";
  assert.equal(formatReminderDate(end), "April 10, 2026");
  const { subject, html, text } = trialReminderContent(end, "https://www.backofthebox.xyz/");
  assert.equal(subject, TRIAL_REMINDER_SUBJECT);
  for (const body of [html, text]) {
    assert.match(body, /April 10, 2026/);
    assert.match(body, /https:\/\/www\.backofthebox\.xyz\/app\/billing/);
    assert.match(body, new RegExp(`${PAYMENT_GRACE_DAYS} more days`));
    assert.match(body, /haven't charged you/);
    assert.equal(body.includes("$5"), false);
    assert.equal(body.includes("$39"), false);
  }
  assert.match(html, /Add a card/);
});
