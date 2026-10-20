import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { requireAdmin } from "@/lib/admin";
import { eventsSince, type UsageEvent } from "@/lib/events";
import { listUserStates } from "@/lib/persist";
import { ensureKidSlots, flattenSlotModules } from "@/lib/slots";
import { MODULE_CATALOG } from "@/lib/modules";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usage · Admin · Back of the Box" };

const DAYS = 30;
const dayOf = (ts?: string) => (ts ?? "").slice(0, 10);

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper px-4 py-3">
      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 font-display text-2xl tabular-nums text-ink">{value}</div>
      {sub ? <div className="text-xs text-ink-soft">{sub}</div> : null}
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <section className="rounded-xl border border-rule bg-paper p-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">{title}</h3>
      {rows.length ? (
        <ul className="space-y-1 text-sm">
          {rows.map(([k, n]) => (
            <li key={k} className="relative flex justify-between gap-3 rounded px-2 py-0.5">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded bg-cream"
                style={{ width: `${(n / max) * 100}%` }}
              />
              <span className="relative truncate text-ink">{k}</span>
              <span className="relative tabular-nums text-ink-soft">{n}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">Nothing yet.</p>
      )}
    </section>
  );
}

const count = (xs: string[]) => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

async function loadUsage() {
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const [events, users] = await Promise.all([eventsSince(since), listUserStates()]);

  const views = events.filter((e) => e.type === "pageview" && !e.path?.startsWith("/admin"));
  const emails = events.filter((e) => e.type === "email_sent");
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const uniq = (es: UsageEvent[]) => new Set(es.map((e) => e.visitor).filter(Boolean)).size;

  const days: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  const perDay = days.map((d) => {
    const v = views.filter((e) => dayOf(e.ts) === d);
    return { d, views: v.length, visitors: uniq(v), emails: emails.filter((e) => dayOf(e.ts) === d).length };
  });
  const maxViews = Math.max(1, ...perDay.map((p) => p.views));

  const kids = users.flatMap((u) => u.state.kids.map((k) => ({ user: u.userKey, kid: k })));
  const emailKids = kids.filter((k) => (k.kid.deliveryMethod ?? "email") === "email" && k.kid.deliveryEmail);
  const moduleUse = count(
    kids.flatMap((k) => [...new Set(flattenSlotModules(ensureKidSlots(k.kid).slots))]).map(
      (id) => MODULE_CATALOG.find((m) => m.id === id)?.name ?? id,
    ),
  );
  const signedInVisitors = new Set(views.map((e) => e.user_key).filter(Boolean)).size;
  const emails7 = emails.filter((e) => (e.ts ?? "") >= weekAgo);
  const pdf7 = emails7.filter((e) => (e.meta as { withPdf?: boolean } | null)?.withPdf).length;

  return { views, emails, today, weekAgo, uniq, days, perDay, maxViews, kids, emailKids, moduleUse, signedInVisitors, emails7, pdf7, users };
}

export default async function UsagePage() {
  await requireAdmin();
  const { views, emails, today, weekAgo, uniq, days, perDay, maxViews, kids, emailKids, moduleUse, signedInVisitors, emails7, pdf7, users } =
    await loadUsage();
  return (
    <AppShell title="Admin">
      <AdminTabs active="usage" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Visitors today" value={uniq(views.filter((e) => dayOf(e.ts) === today))} />
        <Stat label="Visitors · 7 days" value={uniq(views.filter((e) => (e.ts ?? "") >= weekAgo))} />
        <Stat label={`Visitors · ${DAYS} days`} value={uniq(views)} sub={`${views.length} page views`} />
        <Stat label="Signed-in visitors" value={signedInVisitors} sub={`last ${DAYS} days`} />
        <Stat label="Accounts" value={users.length} />
        <Stat label="Dispatches" value={kids.length} sub={`${emailKids.length} on email delivery`} />
        <Stat label="Emails · 7 days" value={emails7.length} sub={emails7.length ? `${pdf7} with PDF attached` : undefined} />
        <Stat label={`Emails · ${DAYS} days`} value={emails.length} />
      </div>

      <section className="mt-6 rounded-xl border border-rule bg-paper p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">Page views per day · last {DAYS} days</h3>
        <div className="flex h-36 items-end gap-[3px]">
          {perDay.map((p) => (
            <div key={p.d} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t bg-ink/70 group-hover:bg-ink"
                style={{ height: `${(p.views / maxViews) * 100}%`, minHeight: p.views ? 2 : 0 }}
                title={`${p.d}: ${p.views} views, ${p.visitors} visitors, ${p.emails} emails`}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] text-ink-soft">
          <span>{days[0]}</span>
          <span>{days[days.length - 1]}</span>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TopList title="Top pages" rows={count(views.map((e) => e.path ?? "")).slice(0, 12)} />
        <TopList title="Referrers" rows={count(views.map((e) => e.referrer ?? "").filter(Boolean)).slice(0, 12)} />
        <TopList title="Modules in use (dispatches)" rows={moduleUse.slice(0, 15)} />
        <TopList
          title="Accounts by dispatches"
          rows={count(kids.map((k) => k.user.replace(/^user:/, ""))).slice(0, 12)}
        />
      </div>
      <p className="mt-6 text-xs text-ink-soft">
        Visits are counted from {"Oct 20, 2026"} (when tracking started), per browser, excluding bots and admin pages.
      </p>
    </AppShell>
  );
}
