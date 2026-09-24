"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { KidSwitcher } from "@/components/KidSwitcher";
import { StripPreview } from "@/components/StripPreview";
import {
  fetchPreview,
  printNow,
  reshufflePreview,
  useAppStore,
} from "@/lib/clientStore";
import { formatTime12, nextPrintLabel } from "@/lib/dates";
import { moduleById } from "@/lib/modules";
import type { PrintJob } from "@/lib/types";
import { PAPER_SIZE_META } from "@/lib/types";

const HISTORY_MAX = 5;

function sectionTeaser(job: PrintJob): string {
  const bits = job.sections
    .filter((s) => s.kind !== "header" && s.kind !== "footer")
    .slice(0, 3)
    .map((s) => s.title);
  return bits.join(" · ") || "Strip";
}

export default function DashboardPage() {
  const router = useRouter();
  const { store, hydrated, error: storeError, activeKid, setActiveKid, reload } = useAppStore();
  const [job, setJob] = useState<PrintJob | null>(null);
  const [history, setHistory] = useState<PrintJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!store?.kids.length) {
      router.replace("/app/setup");
    }
  }, [hydrated, store, router]);

  // Clear compare history when switching kids
  useEffect(() => {
    setHistory([]);
    setJob(null);
  }, [activeKid?.id]);

  const loadPreview = useCallback(async () => {
    if (!activeKid) return;
    setLoadingPreview(true);
    try {
      const preview = await fetchPreview();
      setJob(preview);
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not load preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [activeKid]);

  useEffect(() => {
    if (hydrated && activeKid) void loadPreview();
  }, [
    hydrated,
    activeKid?.id,
    activeKid?.paperSize,
    activeKid?.slots?.map((s) => `${s.id}:${s.moduleIds.join("+")}:${s.mode}:${s.cursor ?? 0}`).join("|"),
    loadPreview,
  ]);

  async function onGenerateNew() {
    if (!activeKid) return;
    setGenerating(true);
    setMsg(null);
    try {
      const next = await reshufflePreview();
      setHistory((h) => {
        if (!job) return h;
        return [job, ...h.filter((j) => j.id !== job.id)].slice(0, HISTORY_MAX);
      });
      setJob(next);
      setMsg("Fresh mix ready.");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  }

  async function onPrintNow() {
    setBusy(true);
    setMsg(null);
    try {
      const printed = await printNow();
      setJob(printed);
      setMsg(`Queued for ${printed.kidName} · ${printed.date}`);
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Print failed");
    } finally {
      setBusy(false);
    }
  }

  function restoreFromHistory(past: PrintJob) {
    if (job && job.id !== past.id) {
      setHistory((h) => {
        const without = h.filter((j) => j.id !== past.id);
        return [job, ...without].slice(0, HISTORY_MAX);
      });
    }
    setJob(past);
    setMsg("Comparing an earlier mix.");
  }

  if (!hydrated) {
    return (
      <AppShell>
        <p className="text-ink-soft">Loading dispatch…</p>
      </AppShell>
    );
  }

  if (storeError || !store || !activeKid) {
    return (
      <AppShell title="Dispatch unavailable">
        <div className="card space-y-3">
          <p className="text-ink-soft">
            {storeError || "Could not load the local store. Is the demo data seeded?"}
          </p>
          <button type="button" className="btn-primary" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const settings = store.settings;
  const schedule = nextPrintLabel(
    activeKid.printTime || settings.printTime,
    activeKid.timezone || settings.timezone,
  );

  return (
    <AppShell
      title={`Good morning, ${activeKid.name}`}
      subtitle="Preview today’s dispatch, shuffle for a fresh mix, or save it to print."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <KidSwitcher
          kids={store.kids}
          activeKidId={store.activeKidId}
          onSelect={(id) => void setActiveKid(id)}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/app/modules" className="btn-secondary text-sm">
            Configure
          </Link>
          <Link href="/app/settings" className="btn-secondary text-sm">
            Settings
          </Link>
        </div>
      </div>

      <div
        className={`grid gap-8 ${
          activeKid.paperSize === "letter"
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,640px)]"
            : "lg:grid-cols-[minmax(0,1fr)_400px]"
        }`}
      >
        <div className="space-y-4">
          <div className="card">
            <div className="mono-meta text-stamp">Delivery</div>
            <p className="mt-2 font-display text-2xl text-ink">
              {formatTime12(activeKid.printTime || settings.printTime)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {schedule} · {activeKid.timezone || settings.timezone}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {(activeKid.deliveryMethod ?? "email") === "email"
                ? `Email → ${activeKid.deliveryEmail || "account email"}`
                : activeKid.deliveryMethod}
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              Paper:{" "}
              <strong className="text-ink">
                {PAPER_SIZE_META.find((p) => p.id === (activeKid.paperSize || "strip58"))?.label ??
                  activeKid.paperSize}
              </strong>
              {" · "}
              Today&apos;s pick:{" "}
              {(job?.modules ?? activeKid.modules).map((id) => moduleById(id).name).join(" · ")}
            </p>
          </div>

          <div className="card flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={generating || loadingPreview}
              onClick={() => void onGenerateNew()}
            >
              {generating ? "Shuffling…" : "Shuffle"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void onPrintNow()}
            >
              {busy ? "Printing…" : "Print now"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loadingPreview || generating}
              onClick={() => void loadPreview()}
            >
              {loadingPreview ? "Refreshing…" : "Refresh preview"}
            </button>
            <a
              className="btn-secondary"
              href={`/api/render?kid=${activeKid.id}&format=print&auto=1`}
              target="_blank"
              rel="noreferrer"
              title={`Opens a ${activeKid.paperSize === "letter" ? "US Letter" : "58mm"}-sized page and the print dialog — choose “Save as PDF”.`}
            >
              Save as PDF
            </a>
            {msg ? <span className="text-sm text-ink-soft">{msg}</span> : null}
          </div>

          <p className="text-xs text-ink-soft">
            <strong className="font-semibold text-ink">Shuffle</strong> swaps in a fresh mix for the
            same day. <strong className="font-semibold text-ink">Print now</strong> locks in what
            you see for the morning.
          </p>

          {history.length > 0 ? (
            <div className="card space-y-3">
              <div className="mono-meta text-stamp">Recent mixes</div>
              <p className="text-xs text-ink-soft">
                Last {history.length} shuffle{history.length === 1 ? "" : "s"} — tap to compare.
              </p>
              <ul className="space-y-2">
                {history.map((h, i) => {
                  const active = job?.id === h.id;
                  return (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => restoreFromHistory(h)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-ink bg-ink text-cream"
                            : "border-rule bg-paper hover:border-ink/30"
                        }`}
                      >
                        <span
                          className={`mt-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-bold tabular-nums ${
                            active ? "bg-cream text-ink" : "bg-cream text-ink-soft"
                          }`}
                        >
                          {history.length - i}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold ${active ? "" : "text-ink"}`}>
                            {sectionTeaser(h)}
                          </span>
                          <span
                            className={`mt-0.5 block truncate text-xs ${
                              active ? "text-cream/70" : "text-ink-soft"
                            }`}
                          >
                            {h.sections.find((s) => s.kind === "text")?.lines[0] ?? h.date}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

        </div>

        <div>
          <div className="mb-3 text-center mono-meta text-ink-soft">
            {activeKid.paperSize === "letter" ? "US Letter preview" : "58mm strip preview"}
          </div>
          <StripPreview job={job} emptyHint="Loading today’s dispatch…" />
        </div>
      </div>
    </AppShell>
  );
}
