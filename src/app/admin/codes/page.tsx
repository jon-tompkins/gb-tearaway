import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { AdminCodes } from "@/components/AdminCodes";
import { requireAdmin } from "@/lib/admin";
import { accessFrom, listCodes, type Billing } from "@/lib/billing";
import { listPayloadFields } from "@/lib/persist";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plans & codes · Admin · Back of the Box" };

export default async function AdminCodesPage() {
  await requireAdmin();
  const [codes, rows] = await Promise.all([
    listCodes(),
    listPayloadFields("billing:", ["trialEndsAt", "subStatus", "paidUntil", "compUntil", "compForever"], 1000),
  ]);
  const counts = { trial: 0, paid: 0, code: 0, expired: 0 };
  for (const r of rows) {
    const b = { ...r, compForever: r.compForever === "true" } as unknown as Billing;
    const reason = accessFrom(b).reason;
    if (reason in counts) counts[reason as keyof typeof counts]++;
  }
  return (
    <AppShell title="Admin">
      <AdminTabs active="codes" />
      <p className="-mt-2 mb-4 text-sm text-ink-soft">
        Free first month, then $20/year or $6/quarter (up to 2 kids), $40/year or $12/quarter (up to 5). Codes add free months (or forever) on top.{" "}
        {stripeConfigured ? "Payments are on." : "Payments are off (no STRIPE_SECRET_KEY), so expired trials still get their pages."}
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Free month", counts.trial],
            ["Paying", counts.paid],
            ["On a code", counts.code],
            ["Lapsed", counts.expired],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="rounded-xl border border-rule bg-paper px-4 py-3">
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{label}</div>
            <div className="mt-1 font-display text-2xl tabular-nums text-ink">{n}</div>
          </div>
        ))}
      </div>
      <AdminCodes initial={codes} />
    </AppShell>
  );
}
