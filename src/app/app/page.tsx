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
  useAppStore,
} from "@/lib/clientStore";
import { formatTime12, nextPrintLabel } from "@/lib/dates";
import { moduleById } from "@/lib/modules";
import type { PrintJob } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { store, hydrated, error: storeError, activeKid, setActiveKid, reload } = useAppStore();
  const [job, setJob] = useState<PrintJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!store?.kids.length) {
      router.replace("/app/setup");
    }
  }, [hydrated, store, router]);

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
  }, [hydrated, activeKid?.id, activeKid?.modules.join(","), loadPreview]);

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

  if (!hydrated) {
    return (
      <AppShell>
        <p className="text-ink-soft">Loading kitchen…</p>
      </AppShell>
    );
  }

  if (storeError || !store || !activeKid) {
    return (
      <AppShell title="Kitchen unavailable">
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
      subtitle="58mm strip preview · schedule · Print now for the future ESP32 bridge"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <KidSwitcher
          kids={store.kids}
          activeKidId={store.activeKidId}
          onSelect={(id) => void setActiveKid(id)}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/app/modules" className="btn-secondary text-sm">
            Modules
          </Link>
          <Link href="/app/settings" className="btn-secondary text-sm">
            Settings
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <div className="card">
            <div className="mono-meta text-stamp">Scheduled print</div>
            <p className="mt-2 font-display text-2xl text-ink">
              {formatTime12(activeKid.printTime || settings.printTime)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {schedule} · {activeKid.timezone || settings.timezone}
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              Modules:{" "}
              {activeKid.modules.map((id) => moduleById(id).name).join(" · ")}
            </p>
          </div>

          <div className="card flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void onPrintNow()}
            >
              {busy ? "Printing…" : "Print now"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loadingPreview}
              onClick={() => void loadPreview()}
            >
              {loadingPreview ? "Refreshing…" : "Refresh preview"}
            </button>
            {msg ? <span className="text-sm text-ink-soft">{msg}</span> : null}
          </div>

          <p className="text-xs text-ink-soft">
            Print now saves a job to the store for{" "}
            <code className="text-[0.7rem]">GET /api/print-jobs/latest</code>. Same-day
            content is deterministic for date + first name.
          </p>

          <div className="card space-y-2">
            <div className="mono-meta text-stamp">Firmware bridge</div>
            <p className="text-sm text-ink-soft">
              ESP32 can fetch today&apos;s strip without this UI. Open any of these in a tab:
            </p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a
                  className="font-semibold text-ink underline decoration-rule underline-offset-2 hover:text-stamp"
                  href={`/api/render?kid=${activeKid.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  HTML
                </a>
                <span className="text-ink-soft"> · </span>
                <a
                  className="font-semibold text-ink underline decoration-rule underline-offset-2 hover:text-stamp"
                  href={`/api/render?kid=${activeKid.id}&format=png`}
                  target="_blank"
                  rel="noreferrer"
                >
                  PNG
                </a>
                <span className="text-ink-soft"> · </span>
                <a
                  className="font-semibold text-ink underline decoration-rule underline-offset-2 hover:text-stamp"
                  href={`/api/render?kid=${activeKid.id}&format=json`}
                  target="_blank"
                  rel="noreferrer"
                >
                  JSON
                </a>
                <span className="text-ink-soft"> · </span>
                <a
                  className="font-semibold text-ink underline decoration-rule underline-offset-2 hover:text-stamp"
                  href={`/strip/${activeKid.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`/strip/${activeKid.id}`}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <div className="mb-3 text-center mono-meta text-ink-soft">58mm preview · ~384px</div>
          <StripPreview job={job} emptyHint="Loading today’s strip…" />
        </div>
      </div>
    </AppShell>
  );
}
