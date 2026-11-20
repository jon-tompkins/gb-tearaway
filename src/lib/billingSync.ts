import { isAdminEmail } from "./admin";
import { accessFrom, applySubscription, getBilling, saveBilling, subscriptionRecordHasCard, type Access } from "./billing";
import { isStripeConfigured, paymentMethodId, stripe, type StripeSubscription } from "./stripe";

interface StripeCustomer {
  id: string;
  metadata?: Record<string, string>;
  default_source?: unknown;
  invoice_settings?: { default_payment_method?: unknown };
}

interface StripeSetupIntent {
  status: string;
  payment_method?: unknown;
}

interface StripeCheckoutSession {
  mode?: string;
  customer?: unknown;
  client_reference_id?: string | null;
  subscription?: unknown;
  setup_intent?: unknown;
}

export class BillingOwnerError extends Error {
  constructor() {
    super("That checkout session is for a different account.");
    this.name = "BillingOwnerError";
  }
}

function cardFromCustomer(customer: StripeCustomer): string | null {
  return paymentMethodId(customer.invoice_settings?.default_payment_method) || paymentMethodId(customer.default_source);
}

function isRequestShapeError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message.toLowerCase() : "";
  return /unknown parameter|billing_cycle_anchor|unrecognized|no such|invalid request|missing required/i.test(msg);
}

async function stampCustomer(email: string, customerId: string, paymentMethod?: string): Promise<void> {
  await stripe("POST", `customers/${customerId}`, {
    metadata: { userKey: `user:${email}` },
    ...(paymentMethod ? { invoice_settings: { default_payment_method: paymentMethod } } : {}),
  });
}

/**
 * Resume a subscription Stripe paused because the trial ended with no card.
 * The new period starts today. Tries the current API shape, then the older
 * string form of billing_cycle_anchor. A card decline does not fall through
 * into a second resume.
 */
async function resumePaused(id: string): Promise<StripeSubscription> {
  const attempts: Array<{ params: Record<string, unknown>; version?: string }> = [
    {
      version: "2026-11-18.endive",
      params: {
        billing_cycle_anchor: { type: "now" },
        payment_behavior: "resume_on_payment_success",
      },
    },
    {
      params: {
        billing_cycle_anchor: "now",
        payment_behavior: "resume_on_payment_success",
        proration_behavior: "none",
      },
    },
  ];
  let last: unknown;
  for (const attempt of attempts) {
    try {
      await stripe("POST", `subscriptions/${id}/resume`, attempt.params, { version: attempt.version });
      const sub = await stripe<StripeSubscription>("GET", `subscriptions/${id}`);
      if (sub.status === "paused") {
        throw new Error("The card was saved, but the charge didn't go through. Try another card.");
      }
      return sub;
    } catch (e) {
      last = e;
      const current = await stripe<StripeSubscription>("GET", `subscriptions/${id}`).catch(() => null);
      if (current && current.status !== "paused") return current;
      if (!isRequestShapeError(e)) break;
    }
  }
  throw last instanceof Error ? last : new Error("Could not resume the subscription");
}

/**
 * Whether a card is on the subscription or its customer.
 * Undefined when Stripe could not be read — callers must not treat that as "no card".
 */
export async function subscriptionHasCard(sub: StripeSubscription): Promise<boolean | undefined> {
  if (subscriptionRecordHasCard(sub)) return true;
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return false;
  try {
    const customer = await stripe<StripeCustomer>("GET", `customers/${customerId}`);
    return !!cardFromCustomer(customer);
  } catch {
    return undefined;
  }
}

/** Apply a finished Checkout Session (new plan, or a card added in setup mode). */
export async function applyCheckoutSession(email: string, sessionId: string): Promise<void> {
  const session = await stripe<StripeCheckoutSession>("GET", `checkout/sessions/${sessionId}`);
  const b = await getBilling(email);
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const owns = session.client_reference_id === `user:${email}` || (!!customerId && customerId === b.customerId);
  if (!owns) throw new BillingOwnerError();
  if (customerId) await stampCustomer(email, customerId).catch(() => {});

  if (session.mode === "subscription") {
    const subId = typeof session.subscription === "string" ? session.subscription : null;
    if (!subId) return;
    const sub = await stripe<StripeSubscription>("GET", `subscriptions/${subId}`);
    const has = await subscriptionHasCard(sub);
    await applySubscription(email, sub, has === undefined ? {} : { hasPaymentMethod: has });
    return;
  }

  if (session.mode === "setup") {
    const setupId = typeof session.setup_intent === "string" ? session.setup_intent : null;
    if (!setupId || !customerId) throw new Error("No card was saved.");
    const intent = await stripe<StripeSetupIntent>("GET", `setup_intents/${setupId}`);
    const pm = paymentMethodId(intent.payment_method);
    if (intent.status !== "succeeded" || !pm) throw new Error("No card was saved.");
    await stampCustomer(email, customerId, pm);
    const subId = (await getBilling(email)).subscriptionId;
    if (!subId) {
      const latest = await getBilling(email);
      await saveBilling(email, { ...latest, customerId, hasPaymentMethod: true });
      return;
    }
    let sub = await stripe<StripeSubscription>("POST", `subscriptions/${subId}`, { default_payment_method: pm });
    if (sub.status === "paused") sub = await resumePaused(sub.id);
    await applySubscription(email, sub, { hasPaymentMethod: true });
  }
}

/**
 * Mirror Stripe onto the local record. Does not resume or charge.
 * A paused plan with a card stays paused until the parent hits Resume.
 */
export async function refreshBillingFromStripe(email: string): Promise<Access> {
  const admin = isAdminEmail(email);
  const b = await getBilling(email);
  if (!isStripeConfigured() || (!b.customerId && !b.subscriptionId)) return accessFrom(b, { admin });
  try {
    let has = b.hasPaymentMethod === true;
    let customerPm: string | null = null;
    if (b.customerId) {
      const customer = await stripe<StripeCustomer>("GET", `customers/${b.customerId}`);
      customerPm = cardFromCustomer(customer);
      has = has || !!customerPm;
    }
    if (b.subscriptionId) {
      let sub = await stripe<StripeSubscription>("GET", `subscriptions/${b.subscriptionId}`);
      has = has || subscriptionRecordHasCard(sub);
      if (
        customerPm &&
        !paymentMethodId(sub.default_payment_method) &&
        sub.status !== "canceled" &&
        sub.status !== "incomplete_expired" &&
        sub.status !== "paused"
      ) {
        sub = await stripe<StripeSubscription>("POST", `subscriptions/${b.subscriptionId}`, { default_payment_method: customerPm });
        has = true;
      }
      await applySubscription(email, sub, { hasPaymentMethod: has });
    } else {
      const latest = await getBilling(email);
      await saveBilling(email, { ...latest, hasPaymentMethod: has });
    }
  } catch {
    // Keep the local mirror when Stripe can't be reached.
  }
  return accessFrom(await getBilling(email), { admin });
}

/** Charge the saved card and start a new period on a paused subscription. */
export async function resumePausedSubscription(email: string): Promise<Access> {
  const b = await getBilling(email);
  if (!b.subscriptionId || !b.customerId) throw new Error("Pick a plan first.");
  const customer = await stripe<StripeCustomer>("GET", `customers/${b.customerId}`);
  let sub = await stripe<StripeSubscription>("GET", `subscriptions/${b.subscriptionId}`);
  const pm = paymentMethodId(sub.default_payment_method) || cardFromCustomer(customer);
  if (!pm) throw new Error("Add a card first.");
  if (!paymentMethodId(sub.default_payment_method)) {
    sub = await stripe<StripeSubscription>("POST", `subscriptions/${b.subscriptionId}`, { default_payment_method: pm });
  }
  if (sub.status === "paused") sub = await resumePaused(sub.id);
  await applySubscription(email, sub, { hasPaymentMethod: true });
  return accessFrom(await getBilling(email), { admin: isAdminEmail(email) });
}
