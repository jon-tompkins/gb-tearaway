"use client";

import { useState } from "react";
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

type DragItem = { moduleId: ModuleId; fromSlotId?: string; fromIndex?: number };

/**
 * Two-pane slot editor. Drag modules from the library into slots; drag chips to
 * reorder within a slot or move them between slots. Click-to-add (select a slot,
 * click a module) stays as the mobile / keyboard fallback.
 */
export function SlotEditor({
  paperSize,
  slots,
  selectedSlotId,
  onSelectSlot,
  onChangeSlots,
  onChangePaperSize,
  modulePoolLimit,
}: {
  paperSize: PaperSize;
  slots: ModuleSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onChangeSlots: (next: ModuleSlot[]) => void;
  onChangePaperSize: (size: PaperSize) => void;
  modulePoolLimit?: number | null;
}) {
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [overSlot, setOverSlot] = useState<string | null>(null);

  const count = PAPER_SLOT_COUNTS[paperSize];
  const poolUsed = new Set(slots.flatMap((s) => s.moduleIds));
  const limit = modulePoolLimit ?? null;
  const atPoolCap = limit != null && poolUsed.size >= limit;

  function normalizeMode(s: ModuleSlot): ModuleSlot {
    if (s.moduleIds.length <= 1) return { ...s, mode: "single", cursor: 0 };
    if (s.mode === "single") return { ...s, mode: "in_order" };
    return s;
  }
  function writeSlot(id: string, mut: (s: ModuleSlot) => ModuleSlot) {
    onChangeSlots(slots.map((s) => (s.id === id ? normalizeMode(mut(s)) : s)));
  }

  function addToSlot(slotId: string, moduleId: ModuleId, index: number | null) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.moduleIds.includes(moduleId)) return;
    if (atPoolCap && !poolUsed.has(moduleId)) return; // pool cap blocks new unique modules only
    writeSlot(slotId, (s) => {
      const ids = [...s.moduleIds];
      const at = index == null ? ids.length : Math.max(0, Math.min(index, ids.length));
      ids.splice(at, 0, moduleId);
      return { ...s, moduleIds: ids };
    });
  }
  function removeChip(slotId: string, moduleId: ModuleId) {
    writeSlot(slotId, (s) => ({
      ...s,
      moduleIds: s.moduleIds.filter((m) => m !== moduleId),
      cursor: 0,
    }));
  }
  function clearSlot(slotId: string) {
    writeSlot(slotId, (s) => ({ ...s, moduleIds: [], mode: "single", cursor: 0 }));
  }
  function setMode(slotId: string, mode: SlotMode) {
    writeSlot(slotId, (s) => ({ ...s, mode, cursor: 0 }));
  }
  function swapChip(slotId: string, i: number, dir: -1 | 1) {
    writeSlot(slotId, (s) => {
      const ids = [...s.moduleIds];
      const j = i + dir;
      if (j < 0 || j >= ids.length) return s;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      return { ...s, moduleIds: ids, cursor: 0 };
    });
  }
  function reorder(slotId: string, from: number, to: number | null) {
    writeSlot(slotId, (s) => {
      const ids = [...s.moduleIds];
      if (from < 0 || from >= ids.length) return s;
      const [m] = ids.splice(from, 1);
      const at = to == null ? ids.length : Math.max(0, Math.min(to, ids.length));
      ids.splice(at, 0, m);
      return { ...s, moduleIds: ids, cursor: 0 };
    });
  }
  function moveAcross(
    fromSlotId: string,
    moduleId: ModuleId,
    toSlotId: string,
    index: number | null,
  ) {
    const target = slots.find((s) => s.id === toSlotId);
    if (!target || target.moduleIds.includes(moduleId)) return;
    onChangeSlots(
      slots.map((s) => {
        if (s.id === fromSlotId)
          return normalizeMode({
            ...s,
            moduleIds: s.moduleIds.filter((m) => m !== moduleId),
            cursor: 0,
          });
        if (s.id === toSlotId) {
          const ids = [...s.moduleIds];
          const at = index == null ? ids.length : Math.max(0, Math.min(index, ids.length));
          ids.splice(at, 0, moduleId);
          return normalizeMode({ ...s, moduleIds: ids });
        }
        return s;
      }),
    );
  }

  function handleDrop(slotId: string, index: number | null) {
    const d = drag;
    setDrag(null);
    setOverSlot(null);
    if (!d) return;
    if (d.fromSlotId == null) addToSlot(slotId, d.moduleId, index);
    else if (d.fromSlotId === slotId) reorder(slotId, d.fromIndex!, index);
    else moveAcross(d.fromSlotId, d.moduleId, slotId, index);
  }

  function clickAdd(moduleId: ModuleId) {
    if (selectedSlotId) addToSlot(selectedSlotId, moduleId, null);
  }

  const groups = modulesByCategory();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr] lg:items-start">
      {/* LEFT: paper size + slots (sticky) */}
      <div className="space-y-5 lg:sticky lg:top-4">
        <div>
          <h2 className="font-display text-xl text-ink">Paper size</h2>
          <p className="mb-3 text-sm text-ink-soft">
            Slot count is fixed by paper: {count} slots for this size.
          </p>
          <PaperSizeToggle value={paperSize} onChange={onChangePaperSize} />
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Slots</h2>
          <p className="mb-3 text-sm text-ink-soft">
            Drag modules from the library into a slot. A slot with 2+ modules can run{" "}
            <strong>in order</strong> or <strong>random</strong> each generate.
          </p>
          <ol className="space-y-3">
            {slots.map((slot, i) => {
              const selected = selectedSlotId === slot.id;
              const empty = slot.moduleIds.length === 0;
              const isOver = overSlot === slot.id;
              const multi = slot.moduleIds.length >= 2;
              return (
                <li key={slot.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectSlot(slot.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectSlot(slot.id);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (overSlot !== slot.id) setOverSlot(slot.id);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget === e.target && overSlot === slot.id) setOverSlot(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(slot.id, null);
                    }}
                    className={`cursor-pointer rounded-2xl border px-3 py-3 text-left transition ${
                      isOver
                        ? "border-stamp bg-stamp/10 ring-2 ring-stamp/40"
                        : selected
                          ? "border-ink bg-ink text-cream ring-2 ring-ink/20"
                          : empty
                            ? "border-dashed border-rule bg-paper/50 hover:border-ink/30"
                            : "border-rule bg-paper hover:border-ink/30"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          selected && !isOver ? "bg-cream text-ink" : "bg-ink text-cream"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                          selected && !isOver ? "bg-cream/20 text-cream" : "bg-cream text-ink-soft"
                        }`}
                      >
                        {empty ? "empty" : modeLabel(slot.mode, slot.moduleIds.length)}
                      </span>
                    </div>

                    {empty ? (
                      <p
                        className={`text-sm ${
                          isOver ? "text-stamp" : selected ? "text-cream/70" : "text-ink-soft"
                        }`}
                      >
                        {isOver ? "Drop to add" : "Drag a module here, or tap then pick one →"}
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {slot.moduleIds.map((id, idx) => (
                          <li
                            key={id}
                            draggable
                            onClick={(e) => e.stopPropagation()}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", id);
                              setDrag({ moduleId: id, fromSlotId: slot.id, fromIndex: idx });
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (overSlot !== slot.id) setOverSlot(slot.id);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDrop(slot.id, idx);
                            }}
                            className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${
                              selected && !isOver
                                ? "border-cream/25 bg-cream/10"
                                : "border-rule bg-cream/60"
                            }`}
                          >
                            <span
                              className={`cursor-grab select-none text-xs ${
                                selected && !isOver ? "text-cream/50" : "text-ink-soft"
                              }`}
                              aria-hidden
                            >
                              ⠿
                            </span>
                            <span
                              className={`flex-1 truncate text-sm font-semibold ${
                                selected && !isOver ? "text-cream" : "text-ink"
                              }`}
                            >
                              {moduleById(id).name}
                            </span>
                            {multi ? (
                              <>
                                <button
                                  type="button"
                                  aria-label="Move up"
                                  disabled={idx === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    swapChip(slot.id, idx, -1);
                                  }}
                                  className="rounded px-1 text-xs disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  aria-label="Move down"
                                  disabled={idx === slot.moduleIds.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    swapChip(slot.id, idx, 1);
                                  }}
                                  className="rounded px-1 text-xs disabled:opacity-30"
                                >
                                  ↓
                                </button>
                              </>
                            ) : null}
                            <button
                              type="button"
                              aria-label={`Remove ${moduleById(id).name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeChip(slot.id, id);
                              }}
                              className={`rounded px-1 text-sm font-bold ${
                                selected && !isOver ? "text-cream/70 hover:text-cream" : "text-stamp"
                              }`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {multi ? (
                      <div
                        className="mt-2.5 flex flex-wrap items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setMode(slot.id, "in_order")}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            slot.mode === "in_order"
                              ? "bg-stamp text-cream"
                              : selected && !isOver
                                ? "border border-cream/30 text-cream/80"
                                : "border border-rule bg-paper text-ink-soft"
                          }`}
                        >
                          In order
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode(slot.id, "random")}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            slot.mode === "random"
                              ? "bg-stamp text-cream"
                              : selected && !isOver
                                ? "border border-cream/30 text-cream/80"
                                : "border border-rule bg-paper text-ink-soft"
                          }`}
                        >
                          Random
                        </button>
                        {slot.mode === "in_order" ? (
                          <span
                            className={`text-xs ${
                              selected && !isOver ? "text-cream/60" : "text-ink-soft"
                            }`}
                          >
                            next:{" "}
                            {moduleById(
                              slot.moduleIds[(slot.cursor ?? 0) % slot.moduleIds.length],
                            ).name}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => clearSlot(slot.id)}
                          className={`ml-auto text-xs font-semibold ${
                            selected && !isOver ? "text-cream/60 hover:text-cream" : "text-ink-soft hover:text-stamp"
                          }`}
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* RIGHT: library */}
      <div className="space-y-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">Module library</h2>
            <p className="text-sm text-ink-soft">
              {selectedSlotId
                ? "Drag a card into a slot, or click to add it to the selected slot."
                : "Drag a card into a slot, or select a slot first to click-add."}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-paper px-3 py-1 text-sm tabular-nums text-ink-soft">
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
                const blockedNew = atPoolCap && !poolUsed.has(mod.id);
                const clickable = !!selectedSlotId && !inSelected && !blockedNew;
                return (
                  <li key={mod.id}>
                    <button
                      type="button"
                      draggable={!blockedNew}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData("text/plain", mod.id);
                        setDrag({ moduleId: mod.id });
                      }}
                      onDragEnd={() => {
                        setDrag(null);
                        setOverSlot(null);
                      }}
                      onClick={() => clickAdd(mod.id)}
                      disabled={!clickable}
                      title={
                        blockedNew
                          ? "Pool limit reached — remove a module or upgrade the tier"
                          : inSelected
                            ? "Already in the selected slot"
                            : "Drag into a slot, or click to add"
                      }
                      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        inSelected
                          ? "border-ink bg-ink text-cream"
                          : "border-rule bg-paper hover:border-ink/30"
                      } ${blockedNew && !inSelected ? "opacity-50" : ""} ${
                        !blockedNew ? "cursor-grab active:cursor-grabbing" : ""
                      }`}
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
