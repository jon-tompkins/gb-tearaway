"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { RunsPanel } from "@/components/RunsPanel";
import { useAppStore } from "@/lib/clientStore";
import { daysLeft, useBilling } from "@/lib/useBilling";
import { formatTime12, nextPrintLabel } from "@/lib/dates";
import { moduleById } from "@/lib/modules";
import { AGE_BANDS, PAPER_SIZE_META, isKidActive, type KidProfile } from "@/lib/types";
import { NOUN } from "@/lib/copy";
import { HowItWorks } from "@/components/HowItWorks";
import { StatusBadge } from "@/components/StatusBadge";

function ageLabel(band: KidProfile["ageBand"]): string {
  return AGE_BANDS.find((b) => b.id === band)?.label ?? band;
}

function moduleSummary(kid: KidProfile): string {
  const names = (kid.modules ?? []).map((id) => {
    try {
      return moduleById(id).name;
    } catch {
      return null;
    }
  });
  const clean = names.filter(Boolean) as string[];
  if (clean.length === 0) return "No modules yet — tap Edit to build the page.";
  return clean.slice(0, 6).join(" · ") + (clean.length > 6 ? ` +${clean.length - 6}` : "");
}

export default function DashboardPage() {
  const router = useRouter();
  const { store, hydrated, error: storeError, reload, setActiveKid, save } = useAppStore();
  const { status: billing } = useBilling();
  const trialLeft = billing?.access.reason === "trial" ? daysLeft(billing.access.until) : null;

  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function activate(id: string) {
    setActionMsg(null);
    // No plan (trial over, no subscription or code) → pick one first; the plan page activates it after checkout.
    if (billing && !billing.access.active) {
      sessionStorage.setItem("botb.activate", id);
      router.push("/app/billing");
      return;
    }
    try {
      await save({ kid: { id, status: "active" } });
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Could not activate");
    }
  }

  async function editDispatch(id: string) {
    await setActiveKid(id);
    router.push("/app/modules");
  }

  if (!hydrated) {
    return (
      <AppShell title="Dashboard">
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  if (storeError || !store) {
    return (
      <AppShell title="Dashboard">
        <div className="card space-y-3">
          <p className="text-ink-soft">{storeError || "Could not load your pages."}</p>
          <button type="button" className="btn-primary" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const kids = store.kids;

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Your morning ${NOUN.many}: preview, edit, or add another child.`}
    >
      {trialLeft !== null ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rule bg-paper px-4 py-2 text-sm">
          <span className="text-ink">
            Free month: {trialLeft} day{trialLeft === 1 ? "" : "s"} left. Then from $20 a year.
          </span>
          <Link href="/app/billing" className="font-semibold text-stamp hover:underline">
            Subscribe or use a code
          </Link>
        </div>
      ) : null}

      {actionMsg ? <p className="mb-4 rounded-lg bg-stamp/10 px-3 py-2 text-sm text-stamp">{actionMsg}</p> : null}

      {kids.length === 0 ? (
        <div className="card mx-auto max-w-xl space-y-4 py-10 text-center">
          <div className="text-4xl" aria-hidden>
            📰
          </div>
          <h2 className="font-display text-2xl text-ink">No {NOUN.many} yet</h2>
          <p className="text-sm text-ink-soft">
            A {NOUN.one} is one child&rsquo;s daily page of puzzles, facts and news, emailed every morning. Create your first one
            in about a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/app/setup" className="btn-primary">
              Create {NOUN.one}
            </Link>
            <Link href="/app/browse" className="btn-secondary">
              Browse modules
            </Link>
          </div>
          <HowItWorks />
        </div>
      ) : (
      <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {kids.length} {kids.length === 1 ? NOUN.one : NOUN.many} · <HowItWorks />
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/settings" className="btn-secondary text-sm">
            Settings
          </Link>
          <Link href="/app/setup" className="btn-primary text-sm">
            + Create {NOUN.one}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {kids.map((kid) => {
          const schedule = nextPrintLabel(kid.printTime, kid.timezone);
          const paper = PAPER_SIZE_META.find((p) => p.id === (kid.paperSize || "letter"))?.label;
          return (
            <div key={kid.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl text-ink">{kid.name}</h2>
                    <StatusBadge status={kid.status} />
                  </div>
                  <p className="text-xs text-ink-soft">
                    Age {ageLabel(kid.ageBand)} · {paper}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-paper px-3 py-1 text-right text-xs text-ink-soft">
                  <div className="font-display text-base text-ink">{formatTime12(kid.printTime)}</div>
                  <div>{schedule}</div>
                </div>
              </div>

              <p className="text-sm leading-snug text-ink-soft">{moduleSummary(kid)}</p>

              <p className="text-xs text-ink-soft">
                {(kid.deliveryMethod ?? "email") === "email"
                  ? `Email → ${kid.deliveryEmail || "account email"}`
                  : kid.deliveryMethod === "app"
                    ? "In the app — print it from here each morning"
                    : kid.deliveryMethod}
              </p>

              <RunsPanel kid={kid} timezone={store.settings.timezone} />

              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() => void editDispatch(kid.id)}
                >
                  Edit
                </button>
                {isKidActive(kid) ? null : (
                  <button type="button" className="btn-secondary text-sm" onClick={() => void activate(kid.id)}>
                    Activate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
    </AppShell>
  );
}
