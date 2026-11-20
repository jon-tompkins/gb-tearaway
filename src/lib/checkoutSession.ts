import { centsFor, type Plan, type PlanInterval } from "./plans";

/** Stripe rejects a trial_end less than 48 hours out. */
export const MIN_TRIAL_MS = 49 * 3_600_000;

const BLOCK_NEW_CHECKOUT = new Set(["active", "trialing", "past_due", "paused", "incomplete"]);

/**
 * Unix seconds for Checkout's trial_end, or null when free time is already over
 * (Checkout then charges a card immediately). A short remainder is raised to the
 * Stripe minimum so the request is accepted.
 */
export function trialEndUnix(freeUntilMs: number, nowMs: number): number | null {
  if (!(freeUntilMs - nowMs > 0)) return null;
  return Math.floor(Math.max(freeUntilMs, nowMs + MIN_TRIAL_MS) / 1000);
}

/** A live subscription should be updated, not replaced with a second Checkout. */
export function newCheckoutBlockReason(b: { subscriptionId?: string; subStatus?: string }): string | null {
  if (b.subscriptionId && b.subStatus && BLOCK_NEW_CHECKOUT.has(b.subStatus)) {
    return "You already have a plan. Add a card from the plan page instead of starting another one.";
  }
  return null;
}

/**
 * Subscription Checkout. During free time the session does not collect a card;
 * if the trial ends without one, Stripe pauses the subscription. After free
 * time, the card is collected immediately (payment_method_collection defaults
 * to always).
 */
export function buildSubscriptionCheckoutParams(input: {
  email: string;
  plan: Plan;
  interval: PlanInterval;
  customerId?: string;
  /** Unix seconds, or null when free time is already over. */
  trialEnd: number | null;
  testMode: boolean;
  site: string;
  priceId?: string;
}): Record<string, unknown> {
  const { email, plan, interval, customerId, trialEnd, testMode, site, priceId } = input;
  const price = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: centsFor(plan, interval),
          recurring: { interval },
          product_data: { name: `Back of the Box, ${plan.label.toLowerCase()} (${interval === "year" ? "yearly" : "monthly"})` },
        },
      };
  const duringFreeTime = trialEnd != null;
  return {
    mode: "subscription",
    line_items: [price],
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    client_reference_id: `user:${email}`,
    ...(duringFreeTime ? { payment_method_collection: "if_required" } : {}),
    subscription_data: {
      metadata: { userKey: `user:${email}`, plan: plan.id, interval, maxKids: String(plan.kids) },
      ...(duringFreeTime
        ? {
            trial_end: trialEnd,
            trial_settings: { end_behavior: { missing_payment_method: "pause" } },
          }
        : {}),
    },
    ...(testMode
      ? {
          custom_text: {
            submit: {
              message: duringFreeTime
                ? "TEST MODE: No card is required during your free trial, and nothing is charged. You'll add a card later, before the trial ends."
                : "TEST MODE: Back of the Box is still in testing. Pay with the fake card 4242 4242 4242 4242, any future expiry, any CVC and ZIP. Real cards won't work and nothing is charged.",
            },
          },
        }
      : {}),
    success_url: `${site}/app/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/app/billing?status=cancelled`,
  };
}
