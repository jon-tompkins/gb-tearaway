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
import type { ModuleId, ModuleSlot, PaperSize, PrintJob } from "@/lib/types";
import { flattenSlotModules, resizeSlotsForPaper, sanitizeModuleIds } from "@/lib/slots";

export default function EditDispatchPage() {
  const router = useRouter();
  const { store, hydrated, activeKid, save, reload } = useAppStore();
  const [paperSize, setPaperSize] = useState<PaperSize>("strip58");
  const [slots, setSlots] = useState<ModuleSlot[]>([]);
  const [access, setAccess] = useState<ModuleId[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Preview (reflects the last SAVED version of this dispatch).
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

  useEffect(() => {
    if (hydrated && activeKid) void loadPreview();
  }, [hydrated, activeKid?.id, loadPreview]);

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
    const filled = slots.filter((s) => s.moduleIds.length > 0);
    if (filled.length === 0) {
      setStatus("Add at least one module to a card before saving.");
      return false;
    }
    setBusy(true);
    setStatus(null);
    try {
      await save({
        kid: {
          id: activeKid.id,
          paperSize,
          slots,
          modules: flattenSlotModules(slots),
          accessModules: Array.from(new Set([...access, ...flattenSlotModules(slots)])),
        },
      });
      setStatus("Saved.");
      await loadPreview();
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
    <AppShell
      title={`Edit ${activeKid.name}’s dispatch`}
      subtitle="Preview it, shuffle a fresh mix, or lay out the page below."
    >
      <div className="mb-4">
        <Link href="/app" className="text-sm font-semibold text-ink-soft hover:text-ink">
          ← Dashboard
        </Link>
      </div>

      {/* PREVIEW + daily actions (reflects the last saved version) */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="card flex w-full max-w-[640px] flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={previewBusy}
            onClick={() => void onShuffle()}
          >
            {previewBusy ? "…" : "Shuffle"}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={previewBusy}
            onClick={() => void onPrintNow()}
          >
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
          <StripPreview job={job} emptyHint="Save the layout below to generate a preview." />
        </div>
        <p className="text-xs text-ink-soft">
          Preview shows your last saved version — edit below and hit Save to refresh it.
        </p>
      </div>

      <SlotEditor
        paperSize={paperSize}
        ageBand={activeKid.ageBand}
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
    </AppShell>
  );
}
