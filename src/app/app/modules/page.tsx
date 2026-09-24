"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { SlotEditor } from "@/components/ModulePicker";
import { StripPreview } from "@/components/StripPreview";
import {
  fetchPreview,
  printNow,
  reshufflePreview,
  useAppStore,
} from "@/lib/clientStore";
import {
  AGE_BANDS,
  type AgeBand,
  type ModuleId,
  type ModuleSlot,
  type PaperSize,
  type PrintJob,
} from "@/lib/types";
import { flattenSlotModules, resizeSlotsForPaper, sanitizeModuleIds } from "@/lib/slots";

export default function EditDispatchPage() {
  const router = useRouter();
  const { store, hydrated, activeKid, save, reload } = useAppStore();

  // Dispatch details
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("7-9");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [deliveryEmail, setDeliveryEmail] = useState("");

  // Layout
  const [paperSize, setPaperSize] = useState<PaperSize>("strip58");
  const [slots, setSlots] = useState<ModuleSlot[]>([]);
  const [access, setAccess] = useState<ModuleId[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Preview — off by default, loaded on demand.
  const [showPreview, setShowPreview] = useState(false);
  const [job, setJob] = useState<PrintJob | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewMsg, setPreviewMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!store?.kids.length) {
      router.replace("/app/setup");
      return;
    }
    if (activeKid) {
      setName(activeKid.name);
      setAgeBand(activeKid.ageBand);
      setDeliveryTime(activeKid.printTime || "07:00");
      setDeliveryEmail(activeKid.deliveryEmail || "");
      const size = activeKid.paperSize || "strip58";
      const nextSlots = resizeSlotsForPaper(activeKid.slots || [], size);
      setPaperSize(size);
      setSlots(nextSlots);
      const placed = flattenSlotModules(nextSlots);
      setAccess(Array.from(new Set([...sanitizeModuleIds(activeKid.accessModules), ...placed])));
      setSelectedSlotId(nextSlots[0]?.id ?? null);
    }
  }, [hydrated, store, activeKid, router]);

  const loadPreview = useCallback(async () => {
    if (!activeKid) return;
    setPreviewBusy(true);
    try {
      setJob(await fetchPreview());
      setPreviewMsg(null);
    } catch (e) {
      setPreviewMsg(e instanceof Error ? e.message : "Could not load preview");
    } finally {
      setPreviewBusy(false);
    }
  }, [activeKid]);

  function togglePreview() {
    setShowPreview((open) => {
      const next = !open;
      if (next && !job) void loadPreview();
      return next;
    });
  }

  function onPaperSize(size: PaperSize) {
    setPaperSize(size);
    setSlots((prev) => {
      const next = resizeSlotsForPaper(prev, size);
      setSelectedSlotId((sel) => (next.some((s) => s.id === sel) ? sel : next[0]?.id ?? null));
      return next;
    });
  }

  async function onSave(): Promise<boolean> {
    if (!activeKid) return false;
    if (!name.trim()) {
      setStatus("Give the dispatch a name.");
      return false;
    }
    setBusy(true);
    setStatus(null);
    try {
      await save({
        kid: {
          id: activeKid.id,
          name: name.trim(),
          ageBand,
          printTime: deliveryTime,
          deliveryEmail: deliveryEmail.trim() || undefined,
          paperSize,
          slots,
          modules: flattenSlotModules(slots),
          accessModules: Array.from(new Set([...access, ...flattenSlotModules(slots)])),
        },
      });
      setStatus("Saved.");
      if (showPreview) await loadPreview();
      return true;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onShuffle() {
    setPreviewBusy(true);
    setPreviewMsg(null);
    try {
      setJob(await reshufflePreview());
      setPreviewMsg("Fresh mix.");
      await reload();
    } catch (e) {
      setPreviewMsg(e instanceof Error ? e.message : "Shuffle failed");
    } finally {
      setPreviewBusy(false);
    }
  }

  async function onPrintNow() {
    setPreviewBusy(true);
    setPreviewMsg(null);
    try {
      const printed = await printNow();
      setJob(printed);
      setPreviewMsg(`Queued for ${printed.date}.`);
      await reload();
    } catch (e) {
      setPreviewMsg(e instanceof Error ? e.message : "Print failed");
    } finally {
      setPreviewBusy(false);
    }
  }

  if (!hydrated || !activeKid) {
    return (
      <AppShell title="Edit dispatch">
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit dispatch" subtitle="Update the details and lay out the page.">
      <div className="mb-4">
        <Link href="/app" className="text-sm font-semibold text-ink-soft hover:text-ink">
          ← Dashboard
        </Link>
      </div>

      {/* DISPATCH DETAILS */}
      <div className="card mb-8 space-y-4">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sam"
            autoComplete="off"
            maxLength={40}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Age
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {AGE_BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setAgeBand(b.id)}
                className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                  ageBand === b.id
                    ? "border-ink bg-ink text-cream"
                    : "border-rule bg-paper hover:border-ink/30"
                }`}
              >
                <strong className="font-display text-base">{b.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="dt">Delivery time</label>
            <input id="dt" type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="de">Send to</label>
            <input
              id="de"
              type="email"
              value={deliveryEmail}
              onChange={(e) => setDeliveryEmail(e.target.value)}
              placeholder="account email"
              autoComplete="email"
            />
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <SlotEditor
        paperSize={paperSize}
        ageBand={ageBand}
        slots={slots}
        selectedSlotId={selectedSlotId}
        onSelectSlot={setSelectedSlotId}
        onChangeSlots={setSlots}
        onChangePaperSize={onPaperSize}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void onSave().then((ok) => ok && router.push("/app"))}
        >
          {busy ? "Saving…" : "Save & back to dashboard"}
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void onSave()}>
          {busy ? "Saving…" : "Save"}
        </button>
        {status ? <span className="text-sm text-ink-soft">{status}</span> : null}
      </div>

      {/* PREVIEW — opt-in */}
      <div className="mt-10 border-t border-rule/60 pt-6">
        <button
          type="button"
          onClick={togglePreview}
          className="text-sm font-semibold text-ink-soft hover:text-ink"
        >
          {showPreview ? "▾ Hide preview" : "▸ Preview & print"}
        </button>
        {showPreview ? (
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="card flex w-full max-w-[640px] flex-wrap items-center justify-center gap-2">
              <button type="button" className="btn-primary text-sm" disabled={previewBusy} onClick={() => void onShuffle()}>
                {previewBusy ? "…" : "Shuffle"}
              </button>
              <button type="button" className="btn-secondary text-sm" disabled={previewBusy} onClick={() => void onPrintNow()}>
                Print now
              </button>
              <a
                className="btn-secondary text-sm"
                href={`/api/render?kid=${activeKid.id}&format=print&auto=1`}
                target="_blank"
                rel="noreferrer"
              >
                Save as PDF
              </a>
              {previewMsg ? <span className="text-sm text-ink-soft">{previewMsg}</span> : null}
            </div>
            <div className="w-full max-w-[640px]">
              <StripPreview job={job} emptyHint="Save the layout, then preview." />
            </div>
            <p className="text-xs text-ink-soft">Preview reflects your last saved version.</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
