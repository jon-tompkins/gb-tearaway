"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AppShell } from "@/components/AppNav";
import { daysLeft, goToStripe, shortDate, useBilling } from "@/lib/useBilling";
import type { Access } from "@/lib/billing";

function planLine(a: Access): string {
  const left = daysLeft(a.until);
  switch (a.reason) {
    case "admin":
      return "Owner account. Always free.";
    case "paid":
      return a.cancelAtPeriodEnd
        ? `Subscribed. Cancels on ${shortDate(a.until)}.`
        : a.until && Date.parse(a.until) <= Date.parse(a.trialEndsAt ?? "")
          ? `Subscribed. Your first $${a.priceCents / 100} charge is on ${shortDate(a.until)}.`
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

  async function stripeGo(path: "/api/billing/checkout" | "/api/billing/portal", interval?: "year") {
    setBusy(true);
    const err = await goToStripe(path, interval);
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
  const price = `$${a.priceCents / 100}`;
  return (
    <div className="max-w-xl space-y-4">
      {msg ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-paper text-ink" : "bg-stamp/10 text-stamp"}`}>{msg.text}</p>
      ) : null}

      <section className="card space-y-3">
        <h2 className="font-display text-xl text-ink">{price} a month</h2>
        <p className="text-sm text-ink-soft">
          Every account starts with a free month. After that it&rsquo;s {price} a month for all your dispatches, every
          kid included. Cancel any time.
        </p>
        <p className="font-semibold text-ink">{planLine(a)}</p>
        {a.reason === "admin" ? null : a.subscribed ? (
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void stripeGo("/api/billing/portal")}>
            Manage billing
          </button>
        ) : (
          <>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void stripeGo("/api/billing/checkout")}>
              Subscribe for {price}/month
            </button>
            <button type="button" className="btn-secondary ml-2" disabled={busy} onClick={() => void stripeGo("/api/billing/checkout", "year")}>
              Or ${a.annualPriceCents / 100}/year (2 months free)
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
