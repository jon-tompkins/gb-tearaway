import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PAYMENT_GRACE_DAYS,
  TRIAL_ENDING_BANNER_DAYS,
  accessFrom,
  cardActionFor,
  paymentGraceUntil,
  showMissingCardBanner,
  type Billing,
} from "../src/lib/billing";

const NOW = Date.parse("2026-06-15T16:00:00.000Z");
const DAY = 86_400_000;

function bill(partial: Partial<Billing> = {}): Billing {
  return {
    trialStartedAt: "2026-05-01T16:00:00.000Z",
    trialEndsAt: new Date(NOW - DAY).toISOString(),
    ...partial,
  };
}

function access(partial: Partial<Billing> = {}, opts: { enforced?: boolean; billingGraceUntil?: string | null; admin?: boolean } = {}) {
  return accessFrom(bill(partial), { now: NOW, enforced: opts.enforced ?? true, billingGraceUntil: opts.billingGraceUntil ?? null, admin: opts.admin });
}

test("plan prices and grace windows stay fixed", () => {
  assert.equal(PAYMENT_GRACE_DAYS, 3);
  assert.equal(TRIAL_ENDING_BANNER_DAYS, 7);
});

test("an open local trial has access and does not ask for a card", () => {
  const a = access({ trialEndsAt: new Date(NOW + 10 * DAY).toISOString() });
  assert.equal(a.active, true);
  assert.equal(a.reason, "trial");
  assert.equal(a.subscribed, false);
  assert.equal(a.cardAction, "none");
  assert.equal(showMissingCardBanner(a, NOW), false);
});

test("a lapsed trial with Stripe on is expired and inactive", () => {
  const a = access();
  assert.equal(a.reason, "expired");
  assert.equal(a.active, false);
  assert.equal(a.enforced, true);
});

test("a lapsed trial keeps working when Stripe is not configured", () => {
  const a = access({}, { enforced: false });
  assert.equal(a.reason, "expired");
  assert.equal(a.active, true);
  assert.equal(a.enforced, false);
});

test("active, trialing, and past_due keep paid access", () => {
  for (const subStatus of ["active", "trialing", "past_due"]) {
    const a = access({ subStatus, paidUntil: new Date(NOW + 20 * DAY).toISOString(), hasPaymentMethod: true, subscriptionId: "sub_1" });
    assert.equal(a.reason, "paid", subStatus);
    assert.equal(a.active, true, subStatus);
    assert.equal(a.subscribed, true, subStatus);
    assert.equal(a.cardAction, "none", subStatus);
  }
});

test("trialing without a card keeps access and asks for a card near the end", () => {
  const soon = access({
    subStatus: "trialing",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW + 2 * DAY).toISOString(),
  });
  assert.equal(soon.reason, "paid");
  assert.equal(soon.active, true);
  assert.equal(soon.cardAction, "add");
  assert.equal(showMissingCardBanner(soon, NOW), true);

  const early = access({
    subStatus: "trialing",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW + 20 * DAY).toISOString(),
  });
  assert.equal(early.cardAction, "add");
  assert.equal(showMissingCardBanner(early, NOW), false);
  assert.equal(Math.ceil((Date.parse(early.until!) - NOW) / DAY) > TRIAL_ENDING_BANNER_DAYS, true);
});

test("a legacy trialing row with no hasPaymentMethod flag is treated as already having a card", () => {
  const a = access({ subStatus: "trialing", subscriptionId: "sub_old", paidUntil: new Date(NOW + DAY).toISOString() });
  assert.equal(a.cardAction, "none");
  assert.equal(showMissingCardBanner(a, NOW), false);
});

test("trialing with a card does not banner, even the day before the charge", () => {
  const a = access({
    subStatus: "trialing",
    subscriptionId: "sub_1",
    hasPaymentMethod: true,
    paidUntil: new Date(NOW + DAY).toISOString(),
  });
  assert.equal(a.cardAction, "none");
  assert.equal(showMissingCardBanner(a, NOW), false);
});

test("paused with no card keeps delivery for 3 days, then stops", () => {
  const inside = access({
    subStatus: "paused",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW - DAY).toISOString(),
    maxKids: 5,
  });
  assert.equal(inside.reason, "grace");
  assert.equal(inside.active, true);
  assert.equal(inside.subscribed, false);
  assert.equal(inside.cardAction, "add");
  assert.equal(inside.maxKids, 5);
  assert.equal(showMissingCardBanner(inside, NOW), true);
  assert.equal(Date.parse(inside.until!) - Date.parse(inside.paymentGraceUntil!), 0);
  assert.equal(Date.parse(inside.until!) - (NOW - DAY), PAYMENT_GRACE_DAYS * DAY);

  const edge = access({
    subStatus: "paused",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW - PAYMENT_GRACE_DAYS * DAY).toISOString(),
  });
  assert.equal(edge.reason, "expired");
  assert.equal(edge.active, false);
  assert.equal(edge.cardAction, "add");

  const after = access({
    subStatus: "paused",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW - 4 * DAY).toISOString(),
  });
  assert.equal(after.reason, "expired");
  assert.equal(after.active, false);
});

test("paused with a saved card asks to resume instead of adding another card", () => {
  const a = access({
    subStatus: "paused",
    subscriptionId: "sub_1",
    hasPaymentMethod: true,
    paidUntil: new Date(NOW - DAY).toISOString(),
  });
  assert.equal(a.cardAction, "resume");
  assert.equal(a.reason, "grace");
  assert.equal(a.active, true);
});

test("a code still covers access after the subscription pauses", () => {
  const a = access({
    subStatus: "paused",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW - DAY).toISOString(),
    compUntil: new Date(NOW + 10 * DAY).toISOString(),
  });
  assert.equal(a.reason, "code");
  assert.equal(a.active, true);
  assert.equal(a.cardAction, "add");
});

test("incomplete, incomplete_expired, canceled, and unpaid do not grant paid access", () => {
  const ended = new Date(NOW - DAY).toISOString();
  for (const subStatus of ["incomplete", "incomplete_expired", "canceled", "unpaid"]) {
    const a = access({ subStatus, subscriptionId: "sub_1", hasPaymentMethod: false, paidUntil: ended, trialEndsAt: ended });
    assert.equal(a.subscribed, false, subStatus);
    assert.equal(a.reason, "expired", subStatus);
    assert.equal(a.active, false, subStatus);
  }
  assert.equal(cardActionFor(bill({ subStatus: "incomplete", hasPaymentMethod: false })), "add");
  assert.equal(cardActionFor(bill({ subStatus: "incomplete_expired", hasPaymentMethod: false })), "none");
  assert.equal(cardActionFor(bill({ subStatus: "canceled", hasPaymentMethod: false })), "none");
  assert.equal(cardActionFor(bill({ subStatus: "unpaid", hasPaymentMethod: false })), "none");
});

test("canceling during the local trial falls back to the trial", () => {
  const a = access({
    subStatus: "canceled",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    trialEndsAt: new Date(NOW + 5 * DAY).toISOString(),
  });
  assert.equal(a.reason, "trial");
  assert.equal(a.active, true);
  assert.equal(a.subscribed, false);
});

test("past_due without a card stays active and shows the banner", () => {
  const a = access({
    subStatus: "past_due",
    subscriptionId: "sub_1",
    hasPaymentMethod: false,
    paidUntil: new Date(NOW - DAY).toISOString(),
  });
  assert.equal(a.reason, "paid");
  assert.equal(a.active, true);
  assert.equal(a.cardAction, "add");
  assert.equal(showMissingCardBanner(a, NOW), true);
});

test("admin access ignores a paused subscription", () => {
  const a = access({ subStatus: "paused", hasPaymentMethod: false, paidUntil: new Date(NOW - 10 * DAY).toISOString() }, { admin: true });
  assert.equal(a.reason, "admin");
  assert.equal(a.active, true);
});

test("BILLING_GRACE_UNTIL still keeps an expired account active", () => {
  const a = access({}, { billingGraceUntil: new Date(NOW + DAY).toISOString() });
  assert.equal(a.reason, "expired");
  assert.equal(a.active, true);
  assert.equal(a.inGrace, true);
});

test("the launch grace still applies after the 3-day card grace ends", () => {
  const a = access(
    { subStatus: "paused", subscriptionId: "sub_1", hasPaymentMethod: false, paidUntil: new Date(NOW - 4 * DAY).toISOString() },
    { billingGraceUntil: new Date(NOW + DAY).toISOString() },
  );
  assert.equal(a.reason, "expired");
  assert.equal(a.active, true);
  assert.equal(a.inGrace, true);
});

test("payment grace anchors on trialEndsAt when paidUntil is missing", () => {
  const b = bill({
    subStatus: "paused",
    paidUntil: null,
    trialEndsAt: new Date(NOW - 2 * DAY).toISOString(),
  });
  const until = paymentGraceUntil(b);
  assert.equal(until, new Date(NOW - 2 * DAY + PAYMENT_GRACE_DAYS * DAY).toISOString());
  assert.equal(accessFrom(b, { now: NOW, enforced: true, billingGraceUntil: null }).reason, "grace");
});
