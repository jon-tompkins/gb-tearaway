import assert from "node:assert/strict";
import { after, test } from "node:test";
import { PAYMENT_GRACE_DAYS, subscriptionPlanInterval } from "../src/lib/billing";
import type { Billing } from "../src/lib/billing";
import { PLANS } from "../src/lib/plans";
import {
  TRIAL_REMINDER_SUBJECT,
  TRIAL_REMINDER_WINDOW_MS,
  formatReminderDate,
  reminderPrice,
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

test("reminder renders both plans with the price from the plan config", () => {
  const end = "2026-04-10T16:00:00.000Z";
  const site = "https://www.backofthebox.xyz";
  const date = "April 10, 2026";
  assert.equal(formatReminderDate(end), date);
  assert.equal(reminderPrice("month"), `$${PLANS[0].monthCents / 100}`);
  assert.equal(reminderPrice("year"), `$${PLANS[0].yearCents / 100}`);
  assert.equal(reminderPrice("month"), "$5");
  assert.equal(reminderPrice("year"), "$39");

  const cases = [
    { interval: "month" as const, plan: "monthly", price: "$5" },
    { interval: "year" as const, plan: "yearly", price: "$39" },
  ];
  for (const { interval, plan, price } of cases) {
    const { subject, html, text } = trialReminderContent(end, site, interval);
    const expected = [
      `Your free trial ends on ${date}.`,
      `You picked the ${plan} plan, and we haven't charged you anything. There's no card on file yet. Add one before ${date} and the morning pages keep coming. The first charge is on ${date}: ${price} for ${plan}.`,
      `If the trial ends without a card, pages keep arriving for ${PAYMENT_GRACE_DAYS} more days, then delivery pauses until you add one. Paused days aren't billed, and your pages and settings stay saved.`,
      `Add a card: ${site}/app/billing`,
      "You can change or cancel anytime from that page.",
      "Thanks for printing with us.",
      "— Jonto and son, Back of the Box",
    ].join("\n");
    assert.equal(subject, TRIAL_REMINDER_SUBJECT);
    assert.equal(text, expected);
    assert.match(html, new RegExp(price.replace("$", "\\$")));
    assert.match(html, new RegExp(`You picked the ${plan} plan`));
    assert.match(html, new RegExp(`${price.replace("$", "\\$")} for ${plan}`));
    assert.match(html, /Thanks for printing with us\./);
    assert.match(html, /Jonto and son, Back of the Box/);
  }
  const monthly = trialReminderContent(end, site, "month").text;
  const yearly = trialReminderContent(end, site, "year").text;
  assert.equal(monthly.includes("$39"), false);
  assert.equal(yearly.includes("$5"), false);
});

test("plan interval is read from the subscription", () => {
  assert.equal(subscriptionPlanInterval({ id: "sub", status: "trialing", customer: "cus", metadata: { interval: "year" } }), "year");
  assert.equal(
    subscriptionPlanInterval({
      id: "sub",
      status: "trialing",
      customer: "cus",
      items: { data: [{ price: { recurring: { interval: "month" } } }] },
    }),
    "month",
  );
  assert.equal(subscriptionPlanInterval({ id: "sub", status: "trialing", customer: "cus", plan: { interval: "year" } }), "year");
  assert.equal(subscriptionPlanInterval({ id: "sub", status: "trialing", customer: "cus" }), undefined);
});
