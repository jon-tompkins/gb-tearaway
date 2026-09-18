"use client";

import { useState } from "react";
import type { ModuleId, ModuleSlot, PaperSize } from "@/lib/types";
import { PAPER_SIZE_META, PAPER_SLOT_COUNTS } from "@/lib/types";
import { MARKETPLACE_PACKS, moduleById, modulesByCategory } from "@/lib/modules";

/** Hard cap of modules per slot → a tidy 2×2 grid. */
const MAX_PER_SLOT = 4;

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

type DragItem = { moduleId: ModuleId; fromSlotId?: string; fromIndex?: number };

/**
 * Slot editor as a page mock. The left pane draws the actual paper with its
 * slots in order; each slot holds up to 4 modules in a 2×2 grid. A slot with 2+
 * modules gets a Spotify-style shuffle toggle (on = random each print, off = in
 * order). Add modules by dragging a library card into a slot, or by selecting a
 * slot and clicking a card (mobile / keyboard).
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
  const isStrip = paperSize !== "letter";
  const poolUsed = new Set(slots.flatMap((s) => s.moduleIds));
  const limit = modulePoolLimit ?? null;
  const atPoolCap = limit != null && poolUsed.size >= limit;
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const selectedFull = !!selectedSlot && selectedSlot.moduleIds.length >= MAX_PER_SLOT;

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
    if (slot.moduleIds.length >= MAX_PER_SLOT) return; // 4-per-slot cap
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
  function setShuffle(slotId: string, on: boolean) {
    writeSlot(slotId, (s) => ({ ...s, mode: on ? "random" : "in_order", cursor: 0 }));
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
    if (target.moduleIds.length >= MAX_PER_SLOT) return;
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
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr] lg:items-start">
      {/* LEFT: paper size + the page with its slots */}
      <div className="space-y-5 lg:sticky lg:top-4">
        <div>
          <h2 className="font-display text-xl text-ink">Paper size</h2>
          <p className="mb-3 text-sm text-ink-soft">
            {count} slots on this paper — fixed by size.
          </p>
          <PaperSizeToggle value={paperSize} onChange={onChangePaperSize} />
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Your page</h2>
          <p className="mb-3 text-sm text-ink-soft">
            Up to {MAX_PER_SLOT} modules per slot. When a slot has more than one, use the{" "}
            <span aria-hidden>🔀</span> shuffle toggle — on = random each print, off = in order.
          </p>

          {/* paper mock */}
          <div
            className={`mx-auto rounded-2xl border border-rule bg-paper p-3 shadow-sm ${
              isStrip ? "max-w-[320px]" : ""
            }`}
          >
            <div className="mb-2 border-b border-dashed border-rule pb-2 text-center">
              <div className="font-display text-base text-ink">Tearaway</div>
              <div className="text-[0.6rem] uppercase tracking-widest text-ink-soft">
                {isStrip ? "58mm strip" : "US Letter"} · {count} slots
              </div>
            </div>

            <ol className="space-y-2.5">
              {slots.map((slot, i) => {
                const selected = selectedSlotId === slot.id;
                const isOver = overSlot === slot.id;
                const n = slot.moduleIds.length;
                const multi = n >= 2;
                const full = n >= MAX_PER_SLOT;
                const shuffleOn = slot.mode === "random";
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
                      className={`cursor-pointer rounded-xl border px-2.5 py-2 transition ${
                        isOver
                          ? "border-stamp bg-stamp/10 ring-2 ring-stamp/40"
                          : selected
                            ? "border-ink bg-cream/60 ring-2 ring-ink/20"
                            : "border-rule bg-cream/40 hover:border-ink/30"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[0.65rem] font-bold text-cream">
                            {i + 1}
                          </span>
                          <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-ink-soft">
                            Slot {i + 1}
                          </span>
                        </span>
                        {multi ? (
                          <button
                            type="button"
                            aria-pressed={shuffleOn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShuffle(slot.id, !shuffleOn);
                            }}
                            title={
                              shuffleOn
                                ? "Shuffle on — random each print"
                                : "Shuffle off — plays in order"
                            }
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider transition ${
                              shuffleOn
                                ? "bg-stamp text-cream"
                                : "border border-rule bg-paper text-ink-soft"
                            }`}
                          >
                            <span aria-hidden>🔀</span>
                            {shuffleOn ? "Shuffle" : "In order"}
                          </button>
                        ) : n === 1 ? (
                          <span className="rounded-full bg-cream px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">
                            single
                          </span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {Array.from({ length: MAX_PER_SLOT }).map((_, idx) => {
                          const id = slot.moduleIds[idx];
                          if (id) {
                            return (
                              <div
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
                                title={moduleById(id).name}
                                className="group relative flex min-h-[46px] cursor-grab items-center rounded-lg border border-rule bg-paper px-2 py-1.5 active:cursor-grabbing"
                              >
                                {multi && !shuffleOn ? (
                                  <span className="mr-1 text-[0.6rem] font-bold text-ink-soft">
                                    {idx + 1}.
                                  </span>
                                ) : null}
                                <span className="flex-1 truncate text-xs font-semibold text-ink">
                                  {moduleById(id).name}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${moduleById(id).name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeChip(slot.id, id);
                                  }}
                                  className="ml-1 shrink-0 rounded px-1 text-sm font-bold text-ink-soft hover:text-stamp"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          }
                          const firstEmpty = idx === n; // the next slot to fill
                          return (
                            <button
                              key={`empty-${idx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSlot(slot.id);
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
                              className={`flex min-h-[46px] items-center justify-center rounded-lg border border-dashed text-lg transition ${
                                selected && firstEmpty
                                  ? "border-ink/50 bg-paper/60 text-ink"
                                  : "border-rule bg-paper/30 text-ink-soft hover:border-ink/30"
                              }`}
                            >
                              +
                            </button>
                          );
                        })}
                      </div>

                      {full ? (
                        <div className="mt-1.5 text-center text-[0.6rem] text-ink-soft">
                          slot full (max {MAX_PER_SLOT})
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-2 border-t border-dashed border-rule pt-1.5 text-center text-[0.55rem] uppercase tracking-[0.3em] text-ink-soft">
              — tear here —
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: module library */}
      <div className="space-y-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">Module library</h2>
            <p className="text-sm text-ink-soft">
              {!selectedSlotId
                ? "Drag a card into a slot, or select a slot first to click-add."
                : selectedFull
                  ? `Slot ${slots.findIndex((s) => s.id === selectedSlotId) + 1} is full — remove one or pick another slot.`
                  : `Adding to slot ${slots.findIndex((s) => s.id === selectedSlotId) + 1}. Drag a card in, or click it.`}
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
                const inSelected = !!selectedSlot && selectedSlot.moduleIds.includes(mod.id);
                const blockedNew = atPoolCap && !poolUsed.has(mod.id);
                const clickable = !!selectedSlotId && !inSelected && !blockedNew && !selectedFull;
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
                            : selectedFull
                              ? "Selected slot is full (max 4)"
                              : "Drag into a slot, or click to add"
                      }
                      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        inSelected
                          ? "border-ink bg-ink text-cream"
                          : "border-rule bg-paper hover:border-ink/30"
                      } ${(blockedNew || selectedFull) && !inSelected ? "opacity-50" : ""} ${
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
