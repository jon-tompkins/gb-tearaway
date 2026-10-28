import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { requireAdmin } from "@/lib/admin";
import { accessFrom, type Billing } from "@/lib/billing";
import { eventsSince } from "@/lib/events";
import { listPayloadFields, listUserStates, persistenceMode } from "@/lib/persist";
import { stripeConfigured, stripeTestMode } from "@/lib/stripe";
import { isKidActive } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Metrics · Admin · Back of the Box" };

const DAYS = 30;
const DAY = 86_400_000;
const nowMs = () => Date.now();
const dayOf = (iso?: string | null) => (iso ?? "").slice(0, 10);

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper px-4 py-3">
      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 font-display text-2xl tabular-nums text-ink">{value}</div>
      {sub ? <div className="text-xs text-ink-soft">{sub}</div> : null}
    </div>
  );
}

type Level = "ok" | "warn" | "bad";
const DOT: Record<Level, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500" };

function Check({ level, name, detail }: { level: Level; name: string; detail: string }) {
  return (
    <li className="flex items-start gap-2 py-1.5 text-sm">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[level]}`} />
      <span className="font-semibold text-ink">{name}</span>
      <span className="text-ink-soft">{detail}</span>
    </li>
  );
}

function ago(iso?: string | null) {
  if (!iso) return null;
  const mins = Math.round((nowMs() - Date.parse(iso)) / 60_000);
  if (mins < 60) return `${mins} min ago`;
  if (mins < 2880) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} days ago`;
}

export default async function AdminMetricsPage() {
  await requireAdmin();
  const now = nowMs();
  const since = new Date(now - DAYS * DAY).toISOString();
  const [rows, states, events] = await Promise.all([
    listPayloadFields("billing:", ["trialStartedAt", "trialEndsAt", "subStatus", "paidUntil", "compUntil", "compForever"], 2000),
    listUserStates(),
    eventsSince(since),
  ]);

  const counts = { trial: 0, paid: 0, code: 0, expired: 0, admin: 0 };
  let endingSoon = 0;
  const signups = new Map<string, number>();
  for (const r of rows) {
    const b = { ...r, compForever: r.compForever === "true" } as unknown as Billing;
    const a = accessFrom(b);
    if (a.reason in counts) counts[a.reason as keyof typeof counts]++;
    if (a.reason === "trial" && a.until && Date.parse(a.until) - now < 7 * DAY) endingSoon++;
    const d = dayOf(r.trialStartedAt);
    if (d) signups.set(d, (signups.get(d) ?? 0) + 1);
  }
  const days: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) days.push(new Date(now - i * DAY).toISOString().slice(0, 10));
  const perDay = days.map((d) => ({ d, n: signups.get(d) ?? 0 }));
  const maxN = Math.max(1, ...perDay.map((p) => p.n));
  const sum = (from: number) => perDay.slice(-from).reduce((t, p) => t + p.n, 0);
  const converted = counts.paid;
  const decided = counts.paid + counts.expired;

  const kids = states.flatMap((u) => u.state.kids);
  const activeKids = kids.filter(isKidActive).length;
  const withPages = states.filter((u) => u.state.kids.length > 0).length;

  const emails = events.filter((e) => e.type === "email_sent");
  const lastEmail = emails[0]?.ts ?? null; // newest first
  const emailsToday = emails.filter((e) => dayOf(e.ts) === dayOf(new Date(now).toISOString())).length;
  const emails7 = emails.filter((e) => (e.ts ?? "") >= new Date(now - 7 * DAY).toISOString()).length;

  const env = (k: string) => !!process.env[k];
  let db: Level = "ok";
  let dbNote = "Supabase reachable.";
  if (persistenceMode !== "supabase") [db, dbNote] = ["bad", "No Supabase keys: running on local files (data will not persist on Vercel)."];
  else if (!rows.length && !states.length) [db, dbNote] = ["warn", "Connected, but no accounts came back."];

  return (
    <AppShell title="Admin">
      <AdminTabs active="metrics" />

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Users</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Accounts" value={rows.length} sub={`${withPages} have created a page`} />
        <Stat label="Signups" value={sum(1)} sub={`${sum(7)} in 7 days · ${sum(DAYS)} in ${DAYS}`} />
        <Stat label="Paying" value={counts.paid} sub={decided ? `${Math.round((converted / decided) * 100)}% of decided trials` : undefined} />
        <Stat label="Free trial" value={counts.trial} sub={endingSoon ? `${endingSoon} ending within 7 days` : "none ending this week"} />
        <Stat label="On a code" value={counts.code} />
        <Stat label="Lapsed" value={counts.expired} />
        <Stat label="Pages" value={kids.length} sub={`${activeKids} active · ${kids.length - activeKids} inactive`} />
        <Stat label="Emails sent" value={emails7} sub={`7 days · ${emailsToday} today`} />
      </div>

      <section className="mt-6 rounded-xl border border-rule bg-paper p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">Signups per day · last {DAYS} days</h3>
        <div className="flex h-32 items-end gap-[3px]">
          {perDay.map((p) => (
            <div key={p.d} className="flex h-full flex-1 flex-col justify-end" title={`${p.d}: ${p.n} signup${p.n === 1 ? "" : "s"}`}>
              <div className="w-full rounded-t bg-ink/70 hover:bg-ink" style={{ height: `${(p.n / maxN) * 100}%`, minHeight: p.n ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] text-ink-soft">
          <span>{days[0]}</span>
          <span>{days[days.length - 1]}</span>
        </div>
      </section>

      <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-ink-soft">Status</h2>
      <section className="rounded-xl border border-rule bg-paper px-4 py-2">
        <ul className="divide-y divide-rule/60">
          <Check level={db} name="Database" detail={dbNote} />
          <Check
            level={stripeConfigured ? (stripeTestMode ? "warn" : "ok") : "bad"}
            name="Stripe"
            detail={
              !stripeConfigured
                ? "No STRIPE_SECRET_KEY: payments are off and nothing is enforced."
                : stripeTestMode
                  ? "Sandbox keys (sk_test_): no real money is taken."
                  : "Live keys."
            }
          />
          <Check
            level={env("STRIPE_WEBHOOK_SECRET") ? "ok" : stripeConfigured ? "bad" : "warn"}
            name="Stripe webhook"
            detail={env("STRIPE_WEBHOOK_SECRET") ? "Secret set." : "STRIPE_WEBHOOK_SECRET missing: paid plans won't activate."}
          />
          <Check
            level={env("RESEND_API_KEY") ? "ok" : "bad"}
            name="Email (Resend)"
            detail={env("RESEND_API_KEY") ? `Key set. Last email sent ${ago(lastEmail) ?? `none in ${DAYS} days`}.` : "RESEND_API_KEY missing: no morning emails."}
          />
          <Check
            level={env("CRON_SECRET") ? "ok" : "bad"}
            name="Scheduled sends"
            detail={env("CRON_SECRET") ? "CRON_SECRET set (cron runs every 5 min)." : "CRON_SECRET missing: the send cron is rejected."}
          />
          <Check
            level={env("ANTHROPIC_API_KEY") ? "ok" : "warn"}
            name="Anthropic"
            detail={env("ANTHROPIC_API_KEY") ? "Key set (news summaries, support chat)." : "Key missing: news summaries and support chat fall back or fail."}
          />
          <Check
            level={env("AUTH_GOOGLE_ID") && env("AUTH_GOOGLE_SECRET") && env("AUTH_SECRET") ? "ok" : "bad"}
            name="Google sign-in"
            detail={env("AUTH_GOOGLE_ID") && env("AUTH_GOOGLE_SECRET") && env("AUTH_SECRET") ? "Client ID, secret and AUTH_SECRET set." : "AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET missing."}
          />
          <Check
            level={env("SUPPORT_NOTIFY_EMAIL") ? "ok" : "warn"}
            name="Support notifications"
            detail={env("SUPPORT_NOTIFY_EMAIL") ? "Support messages are emailed to you." : "SUPPORT_NOTIFY_EMAIL not set: support messages only show in the Support tab."}
          />
          <Check
            level={env("AMAZON_TAG") ? "ok" : "warn"}
            name="Amazon affiliate tag"
            detail={env("AMAZON_TAG") ? "Set." : "AMAZON_TAG not set: supplies links earn nothing."}
          />
          <Check
            level={env("ADMIN_PASSWORD") ? "ok" : "warn"}
            name="Admin password"
            detail={env("ADMIN_PASSWORD") ? "Custom ADMIN_PASSWORD set." : "Using the default password. Set ADMIN_PASSWORD on Vercel to change it."}
          />
        </ul>
      </section>
      <p className="mt-4 text-xs text-ink-soft">Visitors, page views and module usage are on the Usage tab.</p>
    </AppShell>
  );
}
