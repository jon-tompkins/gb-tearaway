import { NextResponse } from "next/server";
import { applySubscription, getBilling, saveBilling } from "@/lib/billing";
import { applyCheckoutSession, subscriptionHasCard } from "@/lib/billingSync";
import { paymentMethodId, stripe, verifyWebhook, type StripeSubscription } from "@/lib/stripe";
import { sendTrialEndReminder } from "@/lib/trialReminder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailFromKey = (k?: string | null) => (k?.startsWith("user:") ? k.slice(5) : null);

/**
 * Stripe webhook. Subscribe these events on the endpoint
 * (https://www.backofthebox.xyz/api/billing/webhook):
 *   checkout.session.completed, customer.subscription.created,
 *   customer.subscription.updated, customer.subscription.deleted,
 *   customer.subscription.trial_will_end, customer.updated
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const event = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const email = emailFromKey(obj.client_reference_id as string);
    const sessionId = typeof obj.id === "string" ? obj.id : null;
    if (email && sessionId) await applyCheckoutSession(email, sessionId);
  } else if (event.type.startsWith("customer.subscription.")) {
    const sub = obj as unknown as StripeSubscription;
    const email = emailFromKey(sub.metadata?.userKey);
    if (email) {
      const has = await subscriptionHasCard(sub);
      await applySubscription(email, sub, has === undefined ? {} : { hasPaymentMethod: has });
      if (event.type === "customer.subscription.trial_will_end") {
        try {
          await sendTrialEndReminder(email);
        } catch {
          // The reminder is best-effort. Subscription state is already saved.
        }
      }
    }
  } else if (event.type === "customer.updated") {
    await onCustomerUpdated(obj);
  }
  return NextResponse.json({ received: true });
}

/** A card added in the Customer Portal. Does not resume a paused plan (that charges). */
async function onCustomerUpdated(obj: Record<string, unknown>): Promise<void> {
  const metadata = obj.metadata as { userKey?: string } | undefined;
  const email = emailFromKey(metadata?.userKey);
  if (!email) return;
  const invoiceSettings = obj.invoice_settings as { default_payment_method?: unknown } | undefined;
  const pm = paymentMethodId(invoiceSettings?.default_payment_method) || paymentMethodId(obj.default_source);
  if (!pm) return;
  const b = await getBilling(email);
  if (!b.subscriptionId) {
    await saveBilling(email, {
      ...b,
      customerId: typeof obj.id === "string" ? obj.id : b.customerId,
      hasPaymentMethod: true,
    });
    return;
  }
  const sub = await stripe<StripeSubscription>("GET", `subscriptions/${b.subscriptionId}`);
  if (!paymentMethodId(sub.default_payment_method) && sub.status !== "paused" && sub.status !== "canceled" && sub.status !== "incomplete_expired") {
    const updated = await stripe<StripeSubscription>("POST", `subscriptions/${b.subscriptionId}`, { default_payment_method: pm });
    await applySubscription(email, updated, { hasPaymentMethod: true });
    return;
  }
  await applySubscription(email, sub, { hasPaymentMethod: true });
}
