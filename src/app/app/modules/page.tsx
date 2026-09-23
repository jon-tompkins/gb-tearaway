"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { SlotEditor } from "@/components/ModulePicker";
import { useAppStore } from "@/lib/clientStore";
import type { ModuleId, ModuleSlot, PaperSize } from "@/lib/types";
import { flattenSlotModules, resizeSlotsForPaper, sanitizeModuleIds } from "@/lib/slots";
import { TEMPLATES, templateToSlots, type Template } from "@/lib/modules";

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

  function applyBlank() {
    setSlots([]);
    setSelectedSlotId(null);
    setStatus("Blank sheet — add cards below.");
  }

  function applyTemplate(t: Template) {
    const next = resizeSlotsForPaper(templateToSlots(t), paperSize);
    setSlots(next);
    const pal = Array.from(new Set(next.flatMap((s) => s.moduleIds)));
    setAccess(pal);
    setSelectedSlotId(next[0]?.id ?? null);
    setStatus(`Applied “${t.name}” — review and Save.`);
  }

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
          accessModules: Array.from(new Set([...access, ...flattenSlotModules(slots)])),
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
      <section className="mb-7">
        <h2 className="font-display text-xl text-ink">Start from a template</h2>
        <p className="mb-3 text-sm text-ink-soft">
          A ready-made layout — or start blank and build your own.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyBlank}
            className="rounded-2xl border-2 border-dashed border-rule bg-paper px-4 py-2.5 text-left transition hover:border-ink/40"
          >
            <span className="block text-sm font-semibold text-ink">Blank</span>
            <span className="mt-0.5 block text-xs text-ink-soft">Build your own — add cards</span>
          </button>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-2xl border border-rule bg-paper px-4 py-2.5 text-left transition hover:border-ink/30"
            >
              <span className="block text-sm font-semibold text-ink">{t.name}</span>
              <span className="mt-0.5 block text-xs text-ink-soft">{t.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <SlotEditor
        paperSize={paperSize}
        slots={slots}
        selectedSlotId={selectedSlotId}
        access={access}
        onSelectSlot={setSelectedSlotId}
        onChangeSlots={setSlots}
        onChangePaperSize={onPaperSize}
        onChangeAccess={setAccess}
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
