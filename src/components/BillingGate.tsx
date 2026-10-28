"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppNav";
import { daysLeft, shortDate, useBilling } from "@/lib/useBilling";

/**
 * Wraps the parent app. Once a signed-in user's free month (and any code time)
 * runs out without a subscription, every /app page shows the paywall instead —
 * except the plan page itself, where they subscribe or enter a code. Fails open
 * while loading or if the billing check errors.
 */
export function BillingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useBilling();
  const onPlanPage = pathname.startsWith("/app/billing");
  if (status && !status.access.active && !onPlanPage) return <Paywall />;
  const a = status?.access;
  if (a?.enforced && a.reason === "trial" && !onPlanPage) {
    const left = daysLeft(a.until);
    return (
      <>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          <span>
            <strong>Free trial:</strong> {left} {left === 1 ? "day" : "days"} left (ends {shortDate(a.until)}). Your pages are active now, but you&rsquo;ll need a plan to keep them coming after that.
          </span>
          <Link href="/app/billing" className="font-semibold underline">
            Choose a plan
          </Link>
        </div>
        {children}
      </>
    );
  }
  return children;
}

function Paywall() {
  return (
    <AppShell title="Your free month is up">
      <div className="card max-w-xl space-y-4">
        <p className="text-ink-soft">
          Thanks for trying Back of the Box. Keep the morning pages coming from $20 a year (or $6 a quarter). Your pages and settings are saved and pick up right where they left off.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/billing" className="btn-primary">
            Subscribe
          </Link>
          <Link href="/app/billing#code" className="btn-secondary">
            I have a code
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
