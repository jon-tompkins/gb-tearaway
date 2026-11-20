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
      if (a.cardAction === "add") return `Plan picked. No card yet, so nothing is charged until ${shortDate(a.until)}.`;
      return a.cancelAtPeriodEnd
        ? `Subscribed. Cancels on ${shortDate(a.until)}.`
        : a.until && Date.parse(a.until) <= Date.parse(a.trialEndsAt ?? "")
          ? `Subscribed. Your first charge is on ${shortDate(a.until)}.`
          : `Subscribed. Renews ${shortDate(a.until)}.`;
    case "grace":
      return `No card on file. Pages continue until ${shortDate(a.until)} (${left} day${left === 1 ? "" : "s"}), then pause.`;
    case "code":
      return a.until ? `Free with a code until ${shortDate(a.until)} (${left} days left).` : "Free with a code. No end date.";
    case "trial":
      return `Free month: ${left} day${left === 1 ? "" : "s"} left (ends ${shortDate(a.until)}).`;
    default:
      return a.subStatus === "paused"
        ? "Delivery is paused because there's no card on file. Add one to resume the plan you picked."
        : "Your free month is over.";
  }
}

function BillingInner() {
  const params = useSearchParams();
  const { status, setStatus } = useBilling();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState<string>(PLANS[0].id);
  const [interval, setIntervalChoice] = useState<PlanInterval>("year");
  const { save } = useAppStore();
  const activated = useRef(false);
  const sessionId = params.get("session_id");
  const returnStatus = params.get("status");

  // Coming back from Checkout, or sitting on a plan with no card: refresh Stripe.
  // A plain sync never charges. Adding a card (session_id) can resume a paused plan.
  useEffect(() => {
    if (!status?.signedIn) return;
    const should = !!sessionId || returnStatus === "success" || returnStatus === "card" || status.access.cardAction !== "none";
    if (!should) return;
    const ac = new AbortController();
    let ignore = false;
    fetch("/api/billing/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId ?? undefined }),
      signal: ac.signal,
    })
      .then(async (r) => {
        if (ignore) return;
        const j = (await r.json().catch(() => ({}))) as { access?: Access; error?: string };
        if (!r.ok) {
          if (returnStatus === "success" || returnStatus === "card") {
            setMsg({ ok: false, text: j.error ?? "We couldn't confirm the update yet. Refresh in a moment." });
          }
          return;
        }
        if (j.access) setStatus((s) => (s ? { ...s, access: j.access as Access } : s));
        if (returnStatus === "card") {
          setMsg({
            ok: true,
            text: j.access?.cardAction === "none" ? "Card saved. Thank you." : "Card saved. If the plan is still paused, use Resume plan.",
          });
        } else if (returnStatus === "success") {
          setMsg({
            ok: true,
            text:
              j.access?.cardAction === "add"
                ? "Plan saved. You won't be charged until you add a card and the trial ends."
                : "You're subscribed. Thank you!",
          });
        }
      })
      .catch(() => {
        // Aborted, or the network blip. The webhook still applies the session.
      });
    return () => {
      ignore = true;
      ac.abort();
    };
  }, [status?.signedIn, status?.access.cardAction, status?.access.subStatus, sessionId, returnStatus, setStatus]);

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

  async function resumePlan() {
    setBusy(true);
    try {
      const r = await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume: true }),
      });
      const j = (await r.json().catch(() => ({}))) as { access?: Access; error?: string };
      if (j.access && status) setStatus({ ...status, access: j.access });
      setMsg(r.ok ? { ok: true, text: "Your plan is active. Thank you." } : { ok: false, text: j.error ?? "Could not resume." });
    } finally {
      setBusy(false);
    }
  }

  async function stripeGo(path: "/api/billing/checkout" | "/api/billing/portal" | "/api/billing/setup", interval?: "year" | "month", plan?: string) {
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
          Every account starts with a free month. After that, one simple plan covers up to five {NOUN.many}: $5 a month or $39 a year (best value). Cancel any time.
        </p>
        <p className="font-semibold text-ink">{planLine(a)}</p>
        {a.reason === "admin" ? null : a.cardAction !== "none" ? (
          <>
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {a.cardAction === "resume" ? (
                <>Your card is saved. Resuming charges the plan you picked, starting today. Paused days are not billed.</>
              ) : a.subStatus === "paused" ? (
                <>
                  No card on file, so the plan is paused.{" "}
                  {a.active ? (
                    <>
                      Pages continue until <strong>{shortDate(a.until)}</strong>, then stop.
                    </>
                  ) : (
                    <>Delivery is paused until you add one.</>
                  )}
                </>
              ) : (
                <>
                  No card on file yet. Nothing is charged until <strong>{shortDate(a.until) || "the trial ends"}</strong>.
                </>
              )}
            </div>
            {status.testMode && a.cardAction === "add" ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <b>Still in testing.</b> Use the fake card <code className="font-mono">4242 4242 4242 4242</code>, any future expiry, any CVC and ZIP.
              </div>
            ) : null}
            {a.cardAction === "resume" ? (
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void resumePlan()}>
                Resume plan
              </button>
            ) : (
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void stripeGo("/api/billing/setup")}>
                Add a card
              </button>
            )}
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void stripeGo("/api/billing/portal")}>
              Manage billing
            </button>
            {a.cardAction === "add" && a.subStatus !== "paused" ? (
              <p className="text-xs text-ink-soft">
                Adding a card now does not charge you today. The first charge is on {shortDate(a.until) || "the day the trial ends"}.
              </p>
            ) : null}
            {a.cardAction === "add" && a.subStatus === "paused" ? (
              <p className="text-xs text-ink-soft">
                Adding a card resumes the plan and charges it for the next period, starting today.
              </p>
            ) : null}
          </>
        ) : a.subscribed ? (
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void stripeGo("/api/billing/portal")}>
            Manage billing
          </button>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Billing">
              {(["year", "month"] as PlanInterval[]).map((iv) => {
                const on = interval === iv;
                const cents = iv === "year" ? PLANS[0].yearCents : PLANS[0].monthCents;
                return (
                  <button
                    key={iv}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setIntervalChoice(iv)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      on ? "border-ink bg-ink text-cream" : "border-rule bg-cream text-ink hover:border-ink/40"
                    }`}
                  >
                    ${cents / 100}/{iv}
                    {iv === "year" ? " · best value" : ""}
                  </button>
                );
              })}
            </div>
            {status.testMode ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {a.reason === "trial" || a.reason === "code" ? (
                  <>
                    <b>Still in testing.</b> Checkout won&rsquo;t ask for a card during free time, and nothing is charged.
                  </>
                ) : (
                  <>
                    <b>Still in testing.</b> Payments are in Stripe&rsquo;s sandbox, so real cards won&rsquo;t work and nothing is charged.
                    At checkout, use the fake card <code className="font-mono">4242 4242 4242 4242</code>, any future expiry, any 3-digit CVC and any ZIP.
                  </>
                )}
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
                Subscribing now won&rsquo;t cut your free time short, and Checkout won&rsquo;t ask for a card yet. The first charge is on {shortDate(a.until) || "the day it ends"}, once a card is on file.
              </p>
            ) : (
              <p className="text-xs text-ink-soft">Your free time is over. Checkout asks for a card and the first charge is today.</p>
            )}
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
