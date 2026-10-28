"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AppShell } from "@/components/AppNav";
import { daysLeft, goToStripe, shortDate, useBilling } from "@/lib/useBilling";
import type { Access } from "@/lib/billing";
import { PLANS, type PlanInterval } from "@/lib/plans";
import { useAppStore } from "@/lib/clientStore";
import { NOUN } from "@/lib/copy";

function planLine(a: Access): string {
  const left = daysLeft(a.until);
  switch (a.reason) {
    case "admin":
      return "Owner account. Always free.";
    case "paid":
      return a.cancelAtPeriodEnd
        ? `Subscribed. Cancels on ${shortDate(a.until)}.`
        : a.until && Date.parse(a.until) <= Date.parse(a.trialEndsAt ?? "")
          ? `Subscribed. Your first charge is on ${shortDate(a.until)}.`
          : `Subscribed. Renews ${shortDate(a.until)}.`;
    case "code":
      return a.until ? `Free with a code until ${shortDate(a.until)} (${left} days left).` : "Free with a code. No end date.";
    case "trial":
      return `Free month: ${left} day${left === 1 ? "" : "s"} left (ends ${shortDate(a.until)}).`;
    default:
      return "Your free month is over.";
  }
}

function BillingInner() {
  const params = useSearchParams();
  const { status, setStatus } = useBilling();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(
    params.get("status") === "success" ? { ok: true, text: "You're subscribed. Thank you!" } : null,
  );
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState<string>(PLANS[0].id);
  const [interval, setIntervalChoice] = useState<PlanInterval>("year");
  const { save } = useAppStore();
  const activated = useRef(false);

  // A dispatch was waiting on a plan ("Save & activate" with no plan) → turn it on once they're back and covered.
  const covered = !!status?.access.active;
  useEffect(() => {
    if (activated.current || !covered) return;
    const id = sessionStorage.getItem("botb.activate");
    if (!id) return;
    activated.current = true;
    save({ kid: { id, status: "active" } })
      .then(() => {
        sessionStorage.removeItem("botb.activate");
        setMsg({ ok: true, text: `Your ${NOUN.one} is active.` });
      })
      .catch(() => {
        // Stripe's webhook can lag a few seconds; the Activate button on the dashboard covers that.
      });
  }, [covered, save]);

  async function stripeGo(path: "/api/billing/checkout" | "/api/billing/portal", interval?: "year" | "quarter", plan?: string) {
    setBusy(true);
    const err = await goToStripe(path, interval, plan);
    if (err) setMsg({ ok: false, text: err });
    setBusy(false);
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/billing/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = (await r.json()) as { access?: Access; error?: string };
      if (j.access && status) {
        setStatus({ ...status, access: j.access });
        setMsg({ ok: true, text: "Code applied." });
        setCode("");
      } else setMsg({ ok: false, text: j.error ?? "That didn't work." });
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <p className="text-ink-soft">Loading your plan…</p>;

  if (!status.signedIn) {
    return (
      <div className="card max-w-xl space-y-3">
        <p className="text-ink-soft">Sign in to start your free month.</p>
        <button type="button" className="btn-primary" onClick={() => void signIn("google", { callbackUrl: "/app/billing" })}>
          Sign in with Google
        </button>
      </div>
    );
  }

  const a = status.access;
  return (
    <div className="max-w-xl space-y-4">
      {msg ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-paper text-ink" : "bg-stamp/10 text-stamp"}`}>
          {msg.text}{" "}
          {msg.ok ? (
            <Link href="/app" className="font-semibold text-stamp hover:underline">
              Go to dashboard
            </Link>
          ) : null}
        </p>
      ) : null}

      <section className="card space-y-3">
        <h2 className="font-display text-xl text-ink">Pick a plan</h2>
        <p className="text-sm text-ink-soft">
          Every account starts with a free month. After that, pick a plan by how many {NOUN.many} you need and how you&rsquo;d like to pay: yearly (best value) or quarterly. Cancel any time.
        </p>
        <p className="font-semibold text-ink">{planLine(a)}</p>
        {a.reason === "admin" ? null : a.subscribed ? (
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void stripeGo("/api/billing/portal")}>
            Manage billing
          </button>
        ) : (
          <>
            <div className="space-y-2" role="radiogroup" aria-label="Plan">
              {PLANS.map((p) => (
                <div key={p.id} className="rounded-xl border border-rule bg-paper p-3">
                  <p className="mb-2 text-sm font-semibold text-ink">{p.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {(["year", "quarter"] as PlanInterval[]).map((iv) => {
                      const on = planId === p.id && interval === iv;
                      const cents = iv === "year" ? p.yearCents : p.quarterCents;
                      return (
                        <button
                          key={iv}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            setPlanId(p.id);
                            setIntervalChoice(iv);
                          }}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            on ? "border-ink bg-ink text-cream" : "border-rule bg-cream text-ink hover:border-ink/40"
                          }`}
                        >
                          ${cents / 100}/{iv === "year" ? "year" : "quarter"}
                          {iv === "year" ? " · best value" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {status.testMode ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <b>Still in testing.</b> Payments are in Stripe&rsquo;s sandbox, so real cards won&rsquo;t work and nothing is charged.
                At checkout, use the fake card <code className="font-mono">4242 4242 4242 4242</code>, any future expiry, any 3-digit CVC and any ZIP.
              </div>
            ) : null}
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void stripeGo("/api/billing/checkout", interval, planId)}
            >
              Checkout with Stripe
            </button>
            {a.reason === "trial" || a.reason === "code" ? (
              <p className="text-xs text-ink-soft">
                Subscribing now won&rsquo;t cut your free time short. The first charge is on {shortDate(a.until) || "the day it ends"}.
              </p>
            ) : null}
          </>
        )}
        {a.subscribed && a.reason === "paid" && a.codes.length ? (
          <p className="text-xs text-ink-soft">You also have code time. Cancel in Manage billing if you&rsquo;d rather use it first.</p>
        ) : null}
      </section>

      <section id="code" className="card space-y-3">
        <h2 className="font-display text-lg text-ink">Have an access code?</h2>
        <form onSubmit={redeem} className="flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BOX-XXXX-XXXX"
            className="min-w-0 flex-1 rounded-lg border border-rule bg-cream px-3 py-2 font-mono text-sm uppercase tracking-wider"
            autoCapitalize="characters"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary" disabled={busy || !code.trim()}>
            Apply
          </button>
        </form>
        {a.codes.length ? <p className="text-xs text-ink-soft">Used: {a.codes.join(", ")}</p> : null}
      </section>
    </div>
  );
}

export default function BillingPage() {
  return (
    <AppShell title="Plan" subtitle="Your subscription and access codes.">
      <Suspense fallback={<p className="text-ink-soft">Loading your plan…</p>}>
        <BillingInner />
      </Suspense>
    </AppShell>
  );
}
