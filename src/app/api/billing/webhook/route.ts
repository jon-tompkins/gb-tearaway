import { NextResponse } from "next/server";
import { applySubscription } from "@/lib/billing";
import { stripe, verifyWebhook, type StripeSubscription } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailFromKey = (k?: string | null) => (k?.startsWith("user:") ? k.slice(5) : null);

/**
 * Stripe webhook. Subscribe these events on the endpoint
 * (https://www.backofthebox.xyz/api/billing/webhook):
 *   checkout.session.completed, customer.subscription.created,
 *   customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const event = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object;

  if (event.type === "checkout.session.completed" && obj.mode === "subscription") {
    const email = emailFromKey(obj.client_reference_id as string);
    if (email && typeof obj.subscription === "string") {
      await applySubscription(email, await stripe<StripeSubscription>("GET", `subscriptions/${obj.subscription}`));
    }
  } else if (event.type.startsWith("customer.subscription.")) {
    const sub = obj as unknown as StripeSubscription;
    const email = emailFromKey(sub.metadata?.userKey);
    if (email) await applySubscription(email, sub);
  }
  return NextResponse.json({ received: true });
}
