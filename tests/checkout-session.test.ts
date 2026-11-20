import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSubscriptionCheckoutParams, newCheckoutBlockReason, trialEndUnix, MIN_TRIAL_MS } from "../src/lib/checkoutSession";
import { PLANS, centsFor } from "../src/lib/plans";
import { stripeRequestBody } from "../src/lib/stripe";

const NOW = Date.parse("2026-06-15T16:00:00.000Z");
const PLAN = PLANS[0];

test("published prices stay $5 a month and $39 a year", () => {
  assert.equal(PLANS.length, 1);
  assert.equal(PLANS[0].id, "kids5");
  assert.equal(PLANS[0].monthCents, 500);
  assert.equal(PLANS[0].yearCents, 3900);
  assert.equal(centsFor(PLANS[0], "month"), 500);
  assert.equal(centsFor(PLANS[0], "year"), 3900);
});

test("trial end is unchanged, except the Stripe 49-hour floor", () => {
  assert.equal(trialEndUnix(NOW - 1000, NOW), null);
  assert.equal(trialEndUnix(NOW, NOW), null);
  const inTenDays = NOW + 10 * 86_400_000;
  assert.equal(trialEndUnix(inTenDays, NOW), Math.floor(inTenDays / 1000));
  assert.equal(trialEndUnix(NOW + 60 * 60_000, NOW), Math.floor((NOW + MIN_TRIAL_MS) / 1000));
});

test("in-trial checkout does not collect a card and pauses if none is added", () => {
  const trialEnd = Math.floor((NOW + 10 * 86_400_000) / 1000);
  const params = buildSubscriptionCheckoutParams({
    email: "parent@example.com",
    plan: PLAN,
    interval: "month",
    trialEnd,
    testMode: false,
    site: "https://www.backofthebox.xyz",
  });
  const sub = params.subscription_data as {
    trial_end?: number;
    trial_settings?: { end_behavior: { missing_payment_method: string } };
  };
  const line = (params.line_items as Array<{ price_data: { unit_amount: number } }>)[0];
  assert.equal(params.mode, "subscription");
  assert.equal((params.subscription_data as { metadata: { interval: string } }).metadata.interval, "month");
  assert.equal(params.payment_method_collection, "if_required");
  assert.equal(sub.trial_end, trialEnd);
  assert.equal(sub.trial_settings?.end_behavior.missing_payment_method, "pause");
  assert.equal(line.price_data.unit_amount, 500);
  const body = stripeRequestBody(params);
  assert.match(body, /payment_method_collection=if_required/);
  assert.match(body, /missing_payment_method(?:%5D|\])=pause/);
  assert.match(body, /\{CHECKOUT_SESSION_ID\}/);
  assert.equal(body.includes("%7BCHECKOUT_SESSION_ID%7D"), false);
});

test("yearly in-trial checkout keeps the yearly amount", () => {
  const params = buildSubscriptionCheckoutParams({
    email: "parent@example.com",
    plan: PLAN,
    interval: "year",
    trialEnd: Math.floor((NOW + 10 * 86_400_000) / 1000),
    testMode: true,
    site: "https://www.backofthebox.xyz",
  });
  const line = (params.line_items as Array<{ price_data: { unit_amount: number } }>)[0];
  assert.equal(line.price_data.unit_amount, 3900);
  const text = JSON.stringify(params.custom_text);
  assert.match(text, /No card is required/);
  assert.equal(text.includes("4242"), false);
});

test("checkout after the trial still collects a card and does not set a trial", () => {
  const params = buildSubscriptionCheckoutParams({
    email: "parent@example.com",
    plan: PLAN,
    interval: "year",
    customerId: "cus_123",
    trialEnd: null,
    testMode: true,
    site: "https://www.backofthebox.xyz",
  });
  assert.equal("payment_method_collection" in params, false);
  const sub = params.subscription_data as { trial_end?: number; trial_settings?: unknown };
  assert.equal(sub.trial_end, undefined);
  assert.equal(sub.trial_settings, undefined);
  assert.equal(params.customer, "cus_123");
  const line = (params.line_items as Array<{ price_data: { unit_amount: number } }>)[0];
  assert.equal(line.price_data.unit_amount, 3900);
  const body = stripeRequestBody(params);
  assert.equal(body.includes("payment_method_collection"), false);
  assert.equal(body.includes("trial_settings"), false);
  assert.equal(body.includes("trial_end"), false);
  assert.match(JSON.stringify(params.custom_text), /4242 4242 4242 4242/);
});

test("a live subscription blocks a second checkout", () => {
  for (const subStatus of ["active", "trialing", "past_due", "paused", "incomplete"]) {
    assert.equal(typeof newCheckoutBlockReason({ subscriptionId: "sub_1", subStatus }), "string", subStatus);
  }
  assert.equal(newCheckoutBlockReason({ subscriptionId: "sub_1", subStatus: "canceled" }), null);
  assert.equal(newCheckoutBlockReason({ subscriptionId: "sub_1", subStatus: "incomplete_expired" }), null);
  assert.equal(newCheckoutBlockReason({ subscriptionId: "sub_1", subStatus: "unpaid" }), null);
  assert.equal(newCheckoutBlockReason({ subStatus: "trialing" }), null);
});
