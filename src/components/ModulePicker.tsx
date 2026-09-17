"use client";

import type { ModuleId, ModuleSlot, PaperSize, SlotMode } from "@/lib/types";
import { PAPER_SIZE_META, PAPER_SLOT_COUNTS } from "@/lib/types";
import { MARKETPLACE_PACKS, moduleById, modulesByCategory } from "@/lib/modules";

export function PaperSizeToggle({
  value,
  onChange,
}: {
  value: PaperSize;
  onChange: (next: PaperSize) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAPER_SIZE_META.map((p) => {
        const on = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            aria-pressed={on}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              on ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
            }`}
          >
            <span className="block font-display text-lg">{p.label}</span>
            <span className={`mt-0.5 block text-xs ${on ? "text-cream/75" : "text-ink-soft"}`}>
              {p.blurb}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function modeLabel(mode: SlotMode, count: number): string {
  if (count <= 1) return "single";
  if (mode === "random") return "random";
  return "in order";
}

export function SlotStripEditor({
  paperSize,
  slots,
  selectedSlotId,
  onSelectSlot,
  onChangeSlots,
  onChangePaperSize,
}: {
  paperSize: PaperSize;
  slots: ModuleSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onChangeSlots: (next: ModuleSlot[]) => void;
  onChangePaperSize: (size: PaperSize) => void;
}) {
  function setPaper(size: PaperSize) {
    onChangePaperSize(size);
  }

  function updateSlot(id: string, patch: Partial<ModuleSlot>) {
    onChangeSlots(
      slots.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        if (next.moduleIds.length <= 1) {
          next.mode = "single";
          next.cursor = 0;
        } else if (next.mode === "single") {
          next.mode = "in_order";
        }
        return next;
      }),
    );
  }

  function removeFromSlot(slotId: string, moduleId: ModuleId) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    const moduleIds = slot.moduleIds.filter((m) => m !== moduleId);
    updateSlot(slotId, {
      moduleIds,
      cursor: 0,
      mode: moduleIds.length <= 1 ? "single" : slot.mode === "single" ? "in_order" : slot.mode,
    });
  }

  function moveInSlot(slotId: string, index: number, dir: -1 | 1) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    const j = index + dir;
    if (j < 0 || j >= slot.moduleIds.length) return;
    const moduleIds = [...slot.moduleIds];
    [moduleIds[index], moduleIds[j]] = [moduleIds[j], moduleIds[index]];
    updateSlot(slotId, { moduleIds });
  }

  const count = PAPER_SLOT_COUNTS[paperSize];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-ink">Paper size</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Slot count is fixed by paper: {count} slots for this size.
        </p>
        <PaperSizeToggle value={paperSize} onChange={setPaper} />
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">Slots</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Select a slot, then add modules from the library. A slot with 2+ modules can run{" "}
          <strong>in order</strong> or <strong>random</strong> each generate/print.
        </p>
        <ol
          className={`grid gap-3 ${
            paperSize === "letter" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2"
          }`}
        >
          {slots.map((slot, i) => {
            const selected = selectedSlotId === slot.id;
            const empty = slot.moduleIds.length === 0;
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot.id)}
                  className={`flex w-full flex-col rounded-2xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-ink bg-ink text-cream ring-2 ring-ink/20"
                      : empty
                        ? "border-dashed border-rule bg-paper/50 hover:border-ink/30"
                        : "border-rule bg-paper hover:border-ink/30"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        selected ? "bg-cream text-ink" : "bg-ink text-cream"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                        selected ? "bg-cream/20 text-cream" : "bg-cream text-ink-soft"
                      }`}
                    >
                      {empty ? "empty" : modeLabel(slot.mode, slot.moduleIds.length)}
                    </span>
                  </div>
                  {empty ? (
                    <p className={`text-sm ${selected ? "text-cream/70" : "text-ink-soft"}`}>
                      Tap, then add a module ↓
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {slot.moduleIds.map((id) => (
                        <li
                          key={id}
                          className={`truncate text-sm font-semibold ${
                            selected ? "text-cream" : "text-ink"
                          }`}
                        >
                          {moduleById(id).name}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {selectedSlotId ? (
        <SlotDetail
          slot={slots.find((s) => s.id === selectedSlotId)!}
          onRemove={(mid) => removeFromSlot(selectedSlotId, mid)}
          onMove={(index, dir) => moveInSlot(selectedSlotId, index, dir)}
          onMode={(mode) => updateSlot(selectedSlotId, { mode, cursor: 0 })}
          onClear={() =>
            updateSlot(selectedSlotId, { moduleIds: [], mode: "single", cursor: 0 })
          }
        />
      ) : null}
    </div>
  );
}

function SlotDetail({
  slot,
  onRemove,
  onMove,
  onMode,
  onClear,
}: {
  slot: ModuleSlot;
  onRemove: (id: ModuleId) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onMode: (mode: SlotMode) => void;
  onClear: () => void;
}) {
  if (!slot) return null;
  const multi = slot.moduleIds.length >= 2;

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg text-ink">Editing {slot.id}</h3>
        {slot.moduleIds.length > 0 ? (
          <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={onClear}>
            Clear slot
          </button>
        ) : null}
      </div>

      {slot.moduleIds.length === 0 ? (
        <p className="text-sm text-ink-soft">This slot is empty — pick modules from the library.</p>
      ) : (
        <ul className="space-y-2">
          {slot.moduleIds.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-xl border border-rule bg-paper px-3 py-2"
            >
              <span className="flex-1 text-sm font-semibold text-ink">{moduleById(id).name}</span>
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                disabled={i === 0}
                onClick={() => onMove(i, -1)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                disabled={i === slot.moduleIds.length - 1}
                onClick={() => onMove(i, 1)}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-stamp"
                onClick={() => onRemove(id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {multi ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Mode</span>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              slot.mode === "in_order" ? "bg-ink text-cream" : "border border-rule bg-paper"
            }`}
            onClick={() => onMode("in_order")}
          >
            In order
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              slot.mode === "random" ? "bg-ink text-cream" : "border border-rule bg-paper"
            }`}
            onClick={() => onMode("random")}
          >
            Random
          </button>
          {slot.mode === "in_order" ? (
            <span className="text-xs text-ink-soft">
              Next: {moduleById(slot.moduleIds[(slot.cursor ?? 0) % slot.moduleIds.length]).name}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Library: click to add into the selected slot. MVP unlocks all first-party modules. */
export function ModuleLibrary({
  slots,
  selectedSlotId,
  onChangeSlots,
  modulePoolLimit,
}: {
  slots: ModuleSlot[];
  selectedSlotId: string | null;
  onChangeSlots: (next: ModuleSlot[]) => void;
  modulePoolLimit?: number | null;
}) {
  const groups = modulesByCategory();
  const poolUsed = new Set(slots.flatMap((s) => s.moduleIds));
  const limit = modulePoolLimit ?? null;
  const atPoolCap = limit != null && poolUsed.size >= limit;

  function addToSelected(id: ModuleId) {
    if (!selectedSlotId) return;
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) return;
    if (slot.moduleIds.includes(id)) return;
    // Pool limit: only blocks *new* unique modules not already in any slot
    if (atPoolCap && !poolUsed.has(id)) return;
    onChangeSlots(
      slots.map((s) => {
        if (s.id !== selectedSlotId) return s;
        const moduleIds = [...s.moduleIds, id];
        return {
          ...s,
          moduleIds,
          mode: moduleIds.length <= 1 ? "single" : s.mode === "single" ? "in_order" : s.mode,
        };
      }),
    );
  }

  return (
    <div className="space-y-10">
      <div className="mb-1 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Module library</h2>
          <p className="text-sm text-ink-soft">
            {selectedSlotId
              ? "Click a module to add it to the selected slot."
              : "Select a slot above first, then click modules to add."}
          </p>
        </div>
        <div className="rounded-full bg-paper px-3 py-1 text-sm tabular-nums text-ink-soft">
          Pool {poolUsed.size}
          {limit != null ? `/${limit}` : " · unlocked"}
        </div>
      </div>

      {groups.map(({ category, modules }) => (
        <div key={category.id}>
          <h3 className="font-display text-lg text-ink">{category.name}</h3>
          <p className="mb-3 text-sm text-ink-soft">{category.blurb}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {modules.map((mod) => {
              const inSelected =
                !!selectedSlotId &&
                (slots.find((s) => s.id === selectedSlotId)?.moduleIds.includes(mod.id) ?? false);
              const blocked = !selectedSlotId || inSelected || (atPoolCap && !poolUsed.has(mod.id));
              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => addToSelected(mod.id)}
                    disabled={blocked}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      inSelected
                        ? "border-ink bg-ink text-cream"
                        : "border-rule bg-paper hover:border-ink/30"
                    } ${blocked && !inSelected ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        inSelected ? "bg-cream text-ink" : "bg-cream text-ink-soft"
                      }`}
                    >
                      {inSelected ? "✓" : "+"}
                    </span>
                    <span>
                      <span className="block font-semibold">{mod.name}</span>
                      <span
                        className={`mt-0.5 block text-sm ${
                          inSelected ? "text-cream/75" : "text-ink-soft"
                        }`}
                      >
                        {mod.blurb}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div>
        <h2 className="font-display text-xl text-ink">Marketplace</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Paid packs later. Visible now so the business model is obvious.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {MARKETPLACE_PACKS.map((pack) => (
            <li
              key={pack.id}
              className="relative overflow-hidden rounded-2xl border border-dashed border-rule bg-paper/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">{pack.name}</div>
                  <p className="mt-0.5 text-sm text-ink-soft">{pack.blurb}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-ink">{pack.price}</div>
                  <div className="mt-1 rounded-full bg-stamp/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-stamp">
                    Coming soon
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Minimal picker for setup: fills empty slots one-by-one (legacy-friendly). */
export function ModulePicker({
  selected,
  onChange,
}: {
  selected: ModuleId[];
  onChange: (next: ModuleId[]) => void;
}) {
  const groups = modulesByCategory();
  const max = 7;

  function toggle(id: ModuleId) {
    if (selected.includes(id)) {
      onChange(selected.filter((m) => m !== id));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, id]);
  }

  return (
    <div className="space-y-10">
      <div className="mb-1 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Starter modules</h2>
          <p className="text-sm text-ink-soft">
            Pick a few to seed the first slots. Fine-tune on the Modules page afterward.
          </p>
        </div>
        <div className="rounded-full bg-paper px-3 py-1 text-sm tabular-nums text-ink-soft">
          {selected.length}/{max}
        </div>
      </div>

      {groups.map(({ category, modules }) => (
        <div key={category.id}>
          <h3 className="font-display text-lg text-ink">{category.name}</h3>
          <p className="mb-3 text-sm text-ink-soft">{category.blurb}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {modules.map((mod) => {
              const on = selected.includes(mod.id);
              const index = selected.indexOf(mod.id);
              const atMax = !on && selected.length >= max;
              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => toggle(mod.id)}
                    disabled={atMax}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      on ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
                    } ${atMax ? "opacity-60" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        on ? "bg-cream text-ink" : "bg-cream text-ink-soft"
                      }`}
                    >
                      {on ? index + 1 : "·"}
                    </span>
                    <span>
                      <span className="block font-semibold">{mod.name}</span>
                      <span className={`mt-0.5 block text-sm ${on ? "text-cream/75" : "text-ink-soft"}`}>
                        {mod.blurb}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
