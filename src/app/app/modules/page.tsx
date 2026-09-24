"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { SlotEditor } from "@/components/ModulePicker";
import { useAppStore } from "@/lib/clientStore";
import type { ModuleId, ModuleSlot, PaperSize } from "@/lib/types";
import { flattenSlotModules, resizeSlotsForPaper, sanitizeModuleIds } from "@/lib/slots";

export default function ModulesPage() {
  const router = useRouter();
  const { store, hydrated, activeKid, save } = useAppStore();
  const [paperSize, setPaperSize] = useState<PaperSize>("strip58");
  const [slots, setSlots] = useState<ModuleSlot[]>([]);
  const [access, setAccess] = useState<ModuleId[]>([]);
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
      const placed = flattenSlotModules(nextSlots);
      const pal = Array.from(
        new Set([...sanitizeModuleIds(activeKid.accessModules), ...placed]),
      );
      setAccess(pal);
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
      return true;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
      return false;
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
      title="Configure dispatch"
      subtitle={`Lay out ${activeKid.name}'s page: add cards, size each one, then drop in modules that fit.`}
    >
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
          {busy ? "Saving…" : "Save & view today →"}
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void onSave()}>
          {busy ? "Saving…" : "Save"}
        </button>
        {status ? <span className="text-sm text-ink-soft">{status}</span> : null}
      </div>
    </AppShell>
  );
}
