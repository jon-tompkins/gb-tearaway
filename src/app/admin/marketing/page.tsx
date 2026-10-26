import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { AdminGoals } from "@/components/AdminGoals";
import { PlanDoc } from "@/components/PlanDoc";
import { requireAdmin } from "@/lib/admin";
import { accessFrom, listCodes, type Billing } from "@/lib/billing";
import { eventsSince } from "@/lib/events";
import { MARKETING_PLAN } from "@/lib/marketingPlan";
import { getGoals } from "@/lib/marketingGoals";
import type { GoalMetric } from "@/lib/marketingGoalTypes";
import { listPayloadFields, listUserStates } from "@/lib/persist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing · Admin · Back of the Box" };

async function loadMetrics(): Promise<Record<GoalMetric, number>> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [events, users, billing, codes] = await Promise.all([
    eventsSince(weekAgo),
    listUserStates(),
    listPayloadFields("billing:", ["trialEndsAt", "subStatus", "paidUntil", "compUntil", "compForever"], 1000),
    listCodes(),
  ]);
  const views = events.filter((e) => e.type === "pageview" && !e.path?.startsWith("/admin"));
  const kids = users.flatMap((u) => u.state.kids);
  const reasons = billing.map((r) => accessFrom({ ...r, compForever: r.compForever === "true" } as unknown as Billing).reason);
  return {
    visitors7: new Set(views.map((e) => e.visitor).filter(Boolean)).size,
    accounts: users.length,
    dispatches: kids.length,
    emailKids: kids.filter((k) => (k.deliveryMethod ?? "email") === "email" && k.deliveryEmail).length,
    active7: new Set(events.filter((e) => e.type === "email_sent" && e.user_key).map((e) => e.user_key)).size,
    trials: reasons.filter((r) => r === "trial" || r === "code").length,
    paying: reasons.filter((r) => r === "paid").length,
    codeUses: codes.reduce((n, c) => n + c.uses, 0),
  };
}

export default async function MarketingPage() {
  await requireAdmin();
  const [values, goals] = await Promise.all([loadMetrics(), getGoals()]);
  const funnel: [string, number][] = [
    ["Visitors · 7 days", values.visitors7],
    ["Accounts", values.accounts],
    ["Dispatches created", values.dispatches],
    ["On email delivery", values.emailKids],
    ["Accounts emailed · 7 days", values.active7],
    ["Paying", values.paying],
  ];
  return (
    <AppShell title="Admin">
      <AdminTabs active="marketing" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {funnel.map(([label, v]) => (
          <div key={label} className="rounded-xl border border-rule bg-paper px-4 py-3">
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{label}</div>
            <div className="mt-1 font-display text-2xl tabular-nums text-ink">{v}</div>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-rule bg-paper p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">Goals</h3>
        <AdminGoals initial={goals} values={values} />
      </section>
      <section className="mt-6 rounded-xl border border-rule bg-paper p-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Marketing plan</h3>
        <PlanDoc md={MARKETING_PLAN} />
      </section>
    </AppShell>
  );
}
