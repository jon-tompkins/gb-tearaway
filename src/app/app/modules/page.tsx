"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { SlotEditor } from "@/components/ModulePicker";
import { useAppStore } from "@/lib/clientStore";
import type { ModuleSlot, PaperSize } from "@/lib/types";
import { flattenSlotModules, resizeSlotsForPaper } from "@/lib/slots";

export default function ModulesPage() {
  const router = useRouter();
  const { store, hydrated, activeKid, save } = useAppStore();
  const [paperSize, setPaperSize] = useState<PaperSize>("strip58");
  const [slots, setSlots] = useState<ModuleSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      setSelectedSlotId(nextSlots[0]?.id ?? null);
    }
  }, [hydrated, store, activeKid, router]);

  function onPaperSize(size: PaperSize) {
    setPaperSize(size);
    setSlots((prev) => {
      const next = resizeSlotsForPaper(prev, size);
      setSelectedSlotId((sel) =>
        next.some((s) => s.id === sel) ? sel : next[0]?.id ?? null,
      );
      return next;
    });
  }

  async function onSave() {
    if (!activeKid) return;
    const filled = slots.filter((s) => s.moduleIds.length > 0);
    if (filled.length === 0) {
      setStatus("Add at least one module to a slot before saving.");
      return;
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
        },
      });
      setStatus("Saved.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated || !activeKid) {
    return (
      <AppShell title="Modules">
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Modules"
      subtitle={`Paper size → fixed slots for ${activeKid.name}. Multi-module slots rotate in order or at random each generate.`}
    >
      <SlotEditor
        paperSize={paperSize}
        slots={slots}
        selectedSlotId={selectedSlotId}
        onSelectSlot={setSelectedSlotId}
        onChangeSlots={setSlots}
        onChangePaperSize={onPaperSize}
        modulePoolLimit={store?.settings.modulePoolLimit ?? null}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void onSave()}>
          {busy ? "Saving…" : "Save slots"}
        </button>
        {status ? <span className="text-sm text-ink-soft">{status}</span> : null}
      </div>
    </AppShell>
  );
}
