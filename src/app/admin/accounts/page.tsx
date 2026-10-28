import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { requireAdmin } from "@/lib/admin";
import { accessFrom, type Billing } from "@/lib/billing";
import { listPayloadFields, listUserStates } from "@/lib/persist";
import { isKidActive } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accounts · Admin · Back of the Box" };

const FIELDS = ["trialStartedAt", "trialEndsAt", "subStatus", "paidUntil", "compUntil", "compForever", "maxKids", "codes"];
const LABEL = { trial: "Free trial", paid: "Paying", code: "On a code", expired: "Lapsed", admin: "Admin", demo: "Demo" } as const;
const TONE: Record<string, string> = {
  trial: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-800",
  code: "bg-sky-100 text-sky-800",
  expired: "bg-rose-100 text-rose-800",
};
const day = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "—");

export default async function AdminAccountsPage() {
  await requireAdmin();
  const [rows, states] = await Promise.all([listPayloadFields("billing:", FIELDS, 1000), listUserStates()]);
  const pages = new Map(
    states.map(({ userKey, state }) => [
      userKey.replace(/^user:/, "").toLowerCase(),
      { total: state.kids.length, active: state.kids.filter(isKidActive).length },
    ]),
  );
  const accounts = rows
    .map((r) => {
      const email = r.key.replace(/^billing:/, "");
      const b = { ...r, compForever: r.compForever === "true" } as unknown as Billing;
      const a = accessFrom(b);
      return { email, a, b: r, pg: pages.get(email.toLowerCase()) ?? { total: 0, active: 0 } };
    })
    .sort((x, y) => (y.b.trialStartedAt ?? "").localeCompare(x.b.trialStartedAt ?? ""));

  return (
    <AppShell title="Admin">
      <AdminTabs active="accounts" />
      <p className="-mt-2 mb-4 text-sm text-ink-soft">
        Everyone who has opened the app, newest first. &ldquo;Free trial&rdquo; accounts show their pages as Active but haven&rsquo;t paid; they lapse on the end date.
      </p>
      <div className="overflow-x-auto rounded-xl border border-rule bg-paper">
        <table className="w-full text-sm">
          <thead className="text-left text-[0.65rem] uppercase tracking-wide text-ink-soft">
            <tr className="border-b border-rule">
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ends</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2 text-right">Pages (active)</th>
              <th className="px-3 py-2">Codes</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(({ email, a, b, pg }) => (
              <tr key={email} className="border-b border-rule/50 last:border-0">
                <td className="px-3 py-2 font-semibold text-ink">{email}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${TONE[a.reason] ?? "bg-ink/10 text-ink-soft"}`}>
                    {LABEL[a.reason] ?? a.reason}
                  </span>
                  {a.cancelAtPeriodEnd && <span className="ml-1 text-xs text-ink-soft">cancelling</span>}
                </td>
                <td className="px-3 py-2 tabular-nums text-ink-soft">{a.until ? day(a.until) : a.reason === "code" ? "forever" : "—"}</td>
                <td className="px-3 py-2 tabular-nums text-ink-soft">{day(b.trialStartedAt)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {pg.total} ({pg.active})
                </td>
                <td className="px-3 py-2 text-xs text-ink-soft">{b.codes ?? ""}</td>
              </tr>
            ))}
            {!accounts.length && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-soft">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
