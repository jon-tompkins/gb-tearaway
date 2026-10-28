"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppNav";
import { useBilling } from "@/lib/useBilling";

/**
 * Wraps the parent app. Once a signed-in user's free month (and any code time)
 * runs out without a subscription, every /app page shows the paywall instead —
 * except the plan page itself, where they subscribe or enter a code. Fails open
 * while loading or if the billing check errors.
 */
export function BillingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useBilling();
  if (!status || status.access.active || pathname.startsWith("/app/billing")) return children;
  return (
    <AppShell title="Your free month is up">
      <div className="card max-w-xl space-y-4">
        <p className="text-ink-soft">
          Thanks for trying Back of the Box. Keep the morning pages coming from $20 a year (or $6 a quarter). Your dispatches and settings are saved and pick up right where they left off.
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
