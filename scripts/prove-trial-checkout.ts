/**
 * Prove the no-card trial Checkout against Stripe test mode or stripe-mock.
 * Refuses live keys. Never talks to api.stripe.com unless STRIPE_SECRET_KEY is sk_test_….
 *
 * stripe-mock (spec check only — it does not run the trial state machine):
 *   stripe-mock
 *   STRIPE_API_BASE=http://127.0.0.1:12111 STRIPE_SECRET_KEY=sk_test_mock npx tsx scripts/prove-trial-checkout.ts
 *
 * Real test mode, including a test clock that pauses at trial end:
 *   STRIPE_SECRET_KEY=sk_test_… npx tsx scripts/prove-trial-checkout.ts
 */
import { PLANS } from "../src/lib/plans";
import { buildSubscriptionCheckoutParams, trialEndUnix } from "../src/lib/checkoutSession";
import { stripeRequestBody } from "../src/lib/stripe";

const key = process.env.STRIPE_SECRET_KEY ?? "";
const base = (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");

if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) {
  console.error("Refusing to run with a live Stripe key.");
  process.exit(1);
}
if (base.includes("api.stripe.com") && !key.startsWith("sk_test_")) {
  console.error("Set STRIPE_SECRET_KEY to an sk_test_ key, or point STRIPE_API_BASE at stripe-mock.");
  process.exit(1);
}
if (!key) {
  console.error("STRIPE_SECRET_KEY is empty.");
  process.exit(1);
}

async function stripe(method: "GET" | "POST" | "DELETE", path: string, params?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const qs = params ? stripeRequestBody(params) : "";
  const res = await fetch(`${base}/v1/${path}${method === "GET" && qs ? `?${qs}` : ""}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "POST" ? qs : undefined,
  });
  const json = (await res.json()) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`);
  if (json.livemode === true) throw new Error("Stripe returned livemode=true. Stopping.");
  return json;
}

async function proveSetupSession(): Promise<void> {
  const session = await stripe("POST", "checkout/sessions", {
    mode: "setup",
    customer: "cus_proof",
    currency: "usd",
    client_reference_id: "user:trial-proof@example.com",
    metadata: { userKey: "user:trial-proof@example.com" },
    success_url: "https://www.backofthebox.xyz/app/billing?status=card&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://www.backofthebox.xyz/app/billing?status=cancelled",
  });
  console.log(`setup session ${session.id} mode=${String(session.mode)}`);
  if (base.includes("api.stripe.com") && session.mode !== "setup") throw new Error(`expected setup mode, got ${String(session.mode)}`);
}

async function proveCheckoutBody(): Promise<void> {
  const now = Date.now();
  const trialEnd = trialEndUnix(now + 10 * 86_400_000, now);
  const params = buildSubscriptionCheckoutParams({
    email: "trial-proof@example.com",
    plan: PLANS[0],
    interval: "month",
    trialEnd,
    testMode: true,
    site: "https://www.backofthebox.xyz",
  });
  const body = stripeRequestBody(params);
  if (!body.includes("payment_method_collection=if_required")) throw new Error("request is missing if_required");
  if (!body.includes("missing_payment_method") || !body.includes("pause")) throw new Error("request is missing pause end behavior");
  const session = await stripe("POST", "checkout/sessions", params);
  const collection = session.payment_method_collection;
  console.log(`checkout session ${session.id} payment_method_collection=${String(collection)} mode=${String(session.mode)}`);
  if (base.includes("api.stripe.com") && collection !== "if_required") {
    throw new Error(`Stripe kept payment_method_collection=${String(collection)}, expected if_required`);
  }
  const amount = PLANS[0].monthCents;
  console.log(`checkout used unit_amount ${amount} (monthly plan, unchanged)`);
}

async function proveTestClockPause(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const trialEnd = now + 5 * 86_400;
  const clock = await stripe("POST", "test_helpers/test_clocks", { frozen_time: now, name: "botb no-card trial" });
  const clockId = String(clock.id);
  try {
    const customer = await stripe("POST", "customers", { email: "trial-clock@example.com", test_clock: clockId });
    const sub = await stripe("POST", "subscriptions", {
      customer: customer.id,
      trial_end: trialEnd,
      trial_settings: { end_behavior: { missing_payment_method: "pause" } },
      items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PLANS[0].monthCents,
            recurring: { interval: "month" },
            product_data: { name: "Back of the Box, up to 5 (monthly)" },
          },
        },
      ],
    });
    console.log(`subscription ${sub.id} status=${String(sub.status)} default_payment_method=${String(sub.default_payment_method)}`);
    if (sub.status !== "trialing") throw new Error(`expected trialing, got ${String(sub.status)}`);
    if (sub.default_payment_method) throw new Error("trial subscription collected a payment method");
    await stripe("POST", `test_helpers/test_clocks/${clockId}/advance`, { frozen_time: trialEnd + 3600 });
    let status = "";
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const current = await stripe("GET", `subscriptions/${sub.id}`);
      status = String(current.status);
      console.log(`after trial end, poll ${i + 1}: ${status}`);
      if (status === "paused") break;
    }
    if (status !== "paused") throw new Error(`expected paused after trial end, got ${status}`);
    console.log("trial end with no card paused the subscription and did not charge");
  } finally {
    await stripe("DELETE", `test_helpers/test_clocks/${clockId}`).catch((e) => console.error(String(e)));
  }
}

async function main(): Promise<void> {
  await proveCheckoutBody();
  await proveSetupSession();
  if (base.includes("api.stripe.com")) await proveTestClockPause();
  else console.log("stripe-mock accepted the Checkout body. It does not simulate trial-end pause; that needs sk_test_.");
  console.log("ok");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
