"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { ModulePicker } from "@/components/ModulePicker";
import { useAppStore } from "@/lib/clientStore";
import type { ModuleId } from "@/lib/types";
import { MAX_SLOTS, MIN_SLOTS } from "@/lib/types";
import { moduleById } from "@/lib/modules";

export default function ModulesPage() {
  const router = useRouter();
  const { store, hydrated, activeKid, save } = useAppStore();
  const [modules, setModules] = useState<ModuleId[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!store?.kids.length) {
      router.replace("/app/setup");
      return;
    }
    if (activeKid) setModules([...activeKid.modules]);
  }, [hydrated, store, activeKid, router]);

  function move(index: number, dir: -1 | 1) {
    const next = [...modules];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setModules(next);
  }

  async function onSave() {
    if (!activeKid) return;
    if (modules.length < MIN_SLOTS || modules.length > MAX_SLOTS) {
      setStatus(`Need ${MIN_SLOTS}–${MAX_SLOTS} modules.`);
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await save({ kid: { id: activeKid.id, modules } });
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
      subtitle={`Enable 3–5 slots for ${activeKid.name}. Order is print order — use arrows to reorder.`}
    >
      <div className="mb-8 space-y-2">
        <h2 className="font-display text-lg text-ink">Print order</h2>
        <ul className="space-y-2">
          {modules.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-2xl border border-rule bg-paper px-3 py-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-cream">
                {i + 1}
              </span>
              <span className="flex-1 font-semibold text-ink">{moduleById(id).name}</span>
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                onClick={() => move(i, 1)}
                disabled={i === modules.length - 1}
                aria-label="Move down"
              >
                ↓
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ModulePicker selected={modules} onChange={setModules} />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void onSave()}>
          {busy ? "Saving…" : "Save modules"}
        </button>
        {status ? <span className="text-sm text-ink-soft">{status}</span> : null}
      </div>
    </AppShell>
  );
}
