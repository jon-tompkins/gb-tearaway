"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FreeEditionNotice } from "./FreeEditionNotice";
import { AppShell } from "./AppNav";
import type { Access } from "@/lib/billing";
import { showMissingCardBanner } from "@/lib/billingView";
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
  const a = status?.access;
  let body: React.ReactNode = children;
  if (status && !status.access.active && !onPlanPage) body = <Paywall access={status.access} />;
  else if (a?.enforced && !onPlanPage && showMissingCardBanner(a)) {
    body = (
      <>
        <CardBanner access={a} />
        {children}
      </>
    );
  } else if (a?.enforced && a.reason === "trial" && !onPlanPage) {
    const left = daysLeft(a.until);
    body = (
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
  return (
    <>
      <FreeEditionNotice />
      {body}
    </>
  );
}

function CardBanner({ access }: { access: Access }) {
  const left = daysLeft(access.until);
  const when = shortDate(access.until);
  const resume = access.cardAction === "resume";
  const paused = access.reason === "grace" || access.subStatus === "paused";
  const text = resume
    ? "Your card is saved and the plan is paused. Resume it so the pages keep coming."
    : access.subStatus === "past_due"
      ? "A payment didn't go through. Add a card so the pages keep coming."
      : access.reason === "code"
        ? `No card on file, so the plan is paused. Your code keeps pages going until ${when}.`
        : paused
          ? `No card on file. Pages keep coming until ${when}, then they pause.`
          : `Trial ends ${when}${left != null ? ` (${left} ${left === 1 ? "day" : "days"})` : ""}. Add a card or the pages pause when it ends.`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      <span>{text}</span>
      <Link href="/app/billing" className="font-semibold underline">
        {resume ? "Resume plan" : "Add a card"}
      </Link>
    </div>
  );
}

function Paywall({ access }: { access: Access }) {
  const needsCard = access.cardAction !== "none" || access.subStatus === "paused";
  return (
    <AppShell title={needsCard ? "Pages are paused" : "Your 30 days are up"}>
      <div className="card max-w-xl space-y-4">
        <p className="text-ink-soft">
          {access.cardAction === "resume"
            ? "Your card is saved, but the plan is still paused. Resume it to start the next period. You'll be charged today. Your pages and settings are saved."
            : needsCard
              ? "The trial ended without a card, so delivery is paused. Your pages and settings are saved. Add a card to resume the plan you already picked. You'll be charged for the next period, starting today."
              : "Thanks for trying Back of the Box. Keep the morning pages coming for $5 a month or $39 a year. Your pages and settings are saved and pick up right where they left off."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/billing" className="btn-primary">
            {access.cardAction === "resume" ? "Resume plan" : needsCard ? "Add a card" : "Subscribe"}
          </Link>
          <Link href="/app/billing#code" className="btn-secondary">
            I have a code
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
