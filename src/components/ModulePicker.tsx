"use client";

import { useEffect, useState } from "react";
import type { AgeBand, ModuleCategoryId, ModuleId, ModuleSlot, PaperSize, SlotMode, SlotSize } from "@/lib/types";
import { COLUMN_CAPACITY_UNITS, PAPER_SIZE_META, slotSizeUnits } from "@/lib/types";
import { moduleById, moduleSize, modulesByCategory, MODULE_CATALOG, MODULE_CATEGORIES } from "@/lib/modules";
import {
  DIFFICULTY_MAX,
  DIFFICULTY_MIN,
  defaultDifficultyForBand,
} from "@/lib/difficulty";

/** Hard cap of modules per card → a tidy 2×2 grid. */
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

function sizeLabel(sz: "half" | "full" | "double" | undefined): string {
  return sz === "half" ? "½" : sz === "double" ? "2×" : "1×";
}

/**
 * A module fits a card only when its footprint matches the card size exactly —
 * a 2× card takes only 2× modules, a ½ card only ½ modules. (Flexible modules
 * that come in multiple sizes, e.g. World News 1× vs 2×, can be added later.)
 */
function moduleFitsCard(id: ModuleId, cardSize: SlotSize): boolean {
  return moduleSize(id) === cardSize;
}

/** Keep only the difficulty entries for modules still present in the card. */
function pruneDifficulty(
  map: Partial<Record<ModuleId, number>> | undefined,
  keep: ModuleId[],
): Partial<Record<ModuleId, number>> | undefined {
  if (!map) return undefined;
  const out: Partial<Record<ModuleId, number>> = {};
  for (const id of keep) {
    const v = map[id];
    if (v != null) out[id] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * A filled circle showing a module's appropriateness (1–20). Click to open a
 * small slider popover and adjust. `onDark` flips colors for a selected row;
 * `compact` shrinks the circle to sit beside the × on a card chip.
 */
function DifficultyDial({
  value,
  onChange,
  onDark = false,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  onDark?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Appropriateness ${value} of ${DIFFICULTY_MAX} — click to adjust`}
        className={`flex items-center justify-center rounded-full font-bold tabular-nums transition hover:opacity-80 ${
          compact ? "h-5 w-5 text-[0.6rem]" : "h-7 w-7 text-xs"
        } ${onDark ? "bg-cream text-ink" : "bg-ink text-cream"}`}
      >
        {value}
      </button>
      {open ? (
        <>
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <span className="absolute right-0 top-7 z-50 flex w-52 flex-col gap-1.5 rounded-xl border border-rule bg-cream p-3 text-ink shadow-lg">
            <span className="flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-wide text-ink-soft">
              <span>Appropriateness</span>
              <span className="text-ink">
                {value}/{DIFFICULTY_MAX}
              </span>
            </span>
            <input
              type="range"
              min={DIFFICULTY_MIN}
              max={DIFFICULTY_MAX}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="h-1 w-full cursor-pointer accent-ink"
            />
            <span className="flex justify-between text-[0.55rem] text-ink-soft">
              <span>Younger</span>
              <span>Older</span>
            </span>
          </span>
        </>
      ) : null}
    </span>
  );
}

/**
 * One selectable module row (used in the picker modal and the fill step).
 * Selected modules render in solid ink; tunable in-card modules show a
 * clickable difficulty dial instead of the size badge.
 */
function ModuleOption({
  id,
  name,
  blurb,
  inCard,
  blocked,
  difficulty,
  onToggle,
  onDifficulty,
}: {
  id: ModuleId;
  name: string;
  blurb: string;
  inCard: boolean;
  blocked: boolean;
  difficulty: number;
  onToggle: () => void;
  onDifficulty: (v: number) => void;
}) {
  return (
    <div
      role="button"
      aria-pressed={inCard}
      aria-disabled={blocked}
      tabIndex={blocked ? -1 : 0}
      onClick={() => !blocked && onToggle()}
      onKeyDown={(e) => {
        if (!blocked && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
      title={blocked ? "Card is full (max 4)" : blurb}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
        inCard ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
      } ${blocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          inCard ? "bg-cream text-ink" : "bg-cream text-ink-soft"
        }`}
      >
        {inCard ? "✓" : "+"}
      </span>
      <span className="flex-1 truncate text-sm font-semibold">{name}</span>
      {inCard ? (
        <DifficultyDial value={difficulty} onChange={onDifficulty} onDark />
      ) : (
        <span
          className={`rounded px-1 py-px text-[0.6rem] font-bold ${
            inCard ? "bg-cream/25 text-cream" : "bg-cream text-ink-soft"
          }`}
          title={`This module is a ${moduleSize(id)} card`}
        >
          {sizeLabel(moduleSize(id))}
        </span>
      )}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-cream">
      {n}
    </span>
  );
}

/**
 * Two-step page editor:
 *   1. See your paper as a numbered grid of cards; add cards and set each size.
 *   2. Tap a card, then pick from every module that fits that card size (up to 4),
 *      grouped by type.
 * Cards with 2+ modules get a shuffle toggle (on = random each print).
 */
export function SlotEditor({
  paperSize,
  ageBand,
  slots,
  selectedSlotId,
  onSelectSlot,
  onChangeSlots,
  onChangePaperSize,
}: {
  paperSize: PaperSize;
  ageBand: AgeBand;
  slots: ModuleSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onChangeSlots: (next: ModuleSlot[]) => void;
  onChangePaperSize: (size: PaperSize) => void;
}) {
  const isStrip = paperSize !== "letter";
  const groups = modulesByCategory();
  const [exploreType, setExploreType] = useState<ModuleCategoryId | "all">("all");
  const [exploreSize, setExploreSize] = useState<SlotSize | "all">("all");
  const [pickerType, setPickerType] = useState<ModuleCategoryId | "all">("all");

  // "+" on a card opens a module picker modal for that card.
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);
  const pickerSlot = slots.find((s) => s.id === pickerSlotId) ?? null;
  // Close if the target card disappears (e.g. deleted) and on Escape.
  useEffect(() => {
    if (pickerSlotId && !slots.some((s) => s.id === pickerSlotId)) setPickerSlotId(null);
  }, [pickerSlotId, slots]);
  useEffect(() => {
    if (!pickerSlotId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerSlotId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerSlotId]);

  // ½-unit budget: each print column holds COLUMN_CAPACITY_UNITS.
  function usedUnits(column: number, excludeId?: string): number {
    return slots
      .filter((s) => (s.column ?? 0) === column && s.id !== excludeId)
      .reduce((sum, s) => sum + slotSizeUnits(s.size ?? "full"), 0);
  }
  function remainingUnits(column: number, excludeId?: string): number {
    return COLUMN_CAPACITY_UNITS - usedUnits(column, excludeId);
  }

  function addCard(column: number) {
    const remaining = remainingUnits(column);
    if (remaining <= 0) return; // column is full
    const size: SlotSize = remaining >= 2 ? "full" : "half";
    const id = `slot-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    onChangeSlots([...slots, { id, moduleIds: [], mode: "single", cursor: 0, size, column }]);
    onSelectSlot(id);
  }
  function removeCard(slotId: string) {
    const next = slots.filter((s) => s.id !== slotId);
    onChangeSlots(next);
    if (selectedSlotId === slotId) onSelectSlot(next[next.length - 1]?.id ?? "");
  }

  function normalizeMode(s: ModuleSlot): ModuleSlot {
    if (s.moduleIds.length <= 1) return { ...s, mode: "single" as SlotMode, cursor: 0 };
    if (s.mode === "single") return { ...s, mode: "in_order" as SlotMode };
    return s;
  }
  function writeSlot(id: string, mut: (s: ModuleSlot) => ModuleSlot) {
    onChangeSlots(slots.map((s) => (s.id === id ? normalizeMode(mut(s)) : s)));
  }
  function setShuffle(slotId: string, on: boolean) {
    writeSlot(slotId, (s) => ({ ...s, mode: on ? "random" : "in_order", cursor: 0 }));
  }
  function setSize(slotId: string, size: SlotSize) {
    const s = slots.find((x) => x.id === slotId);
    if (!s) return;
    // Don't let a resize blow past the column's ½-unit budget.
    if (remainingUnits(s.column ?? 0, slotId) < slotSizeUnits(size)) return;
    // Shrinking a card drops any module that no longer fits (a double-size Maze
    // can't stay in a ½ card) plus its difficulty entry.
    const keep = s.moduleIds.filter((m) => moduleFitsCard(m, size));
    const nextDiff = pruneDifficulty(s.moduleDifficulty, keep);
    onChangeSlots(
      slots.map((x) =>
        x.id === slotId
          ? normalizeMode({ ...x, size, moduleIds: keep, cursor: 0, moduleDifficulty: nextDiff })
          : x,
      ),
    );
  }
  const defaultDifficulty = defaultDifficultyForBand(ageBand);
  function setModuleDifficulty(slotId: string, moduleId: ModuleId, difficulty: number) {
    onChangeSlots(
      slots.map((s) =>
        s.id === slotId
          ? { ...s, moduleDifficulty: { ...(s.moduleDifficulty ?? {}), [moduleId]: difficulty } }
          : s,
      ),
    );
  }
  function removeFromCard(slotId: string, id: ModuleId) {
    writeSlot(slotId, (s) => {
      const moduleIds = s.moduleIds.filter((m) => m !== id);
      return { ...s, moduleIds, cursor: 0, moduleDifficulty: pruneDifficulty(s.moduleDifficulty, moduleIds) };
    });
  }
  function toggleInCard(slotId: string, id: ModuleId) {
    const s = slots.find((x) => x.id === slotId);
    if (!s) return;
    if (s.moduleIds.includes(id)) {
      removeFromCard(slotId, id);
      return;
    }
    if (s.moduleIds.length >= MAX_PER_SLOT) return;
    // Guard: only modules that fit this card's size can go in.
    if (!moduleFitsCard(id, s.size ?? "full")) return;
    // Appropriateness isn't materialized on add — every chip shows the dispatch's
    // band default (defaultDifficulty) until the parent nudges it, so changing the
    // age band re-defaults any module they haven't customized.
    writeSlot(slotId, (x) => ({ ...x, moduleIds: [...x.moduleIds, id] }));
  }

  const renderCard = (slot: ModuleSlot) => {
    const i = slots.indexOf(slot);
    const selected = selectedSlotId === slot.id;
    const n = slot.moduleIds.length;
    const multi = n >= 2;
    const shuffleOn = slot.mode === "random";
    const size = slot.size ?? "full";
    return (
      <div
        key={slot.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          onSelectSlot(slot.id);
          setPickerSlotId(slot.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectSlot(slot.id);
            setPickerSlotId(slot.id);
          }
        }}
        className={`flex cursor-pointer flex-col rounded-xl border bg-cream/50 px-2.5 py-2 transition ${
          selected ? "border-ink ring-2 ring-ink/20" : "border-rule hover:border-ink/30"
        }`}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[0.65rem] font-bold text-cream">
            {i + 1}
          </span>
          <span
            className="rounded bg-ink/10 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-ink-soft"
            title={`${sizeLabel(size)} card — tap to edit`}
          >
            {sizeLabel(size)}
          </span>
          {multi ? (
            <span
              className="rounded-full border border-rule bg-paper px-1.5 py-0.5 text-[0.55rem] font-bold text-ink-soft"
              title={shuffleOn ? "Random each print" : "Printed in order"}
              aria-hidden
            >
              {shuffleOn ? "🔀" : "1·2"}
            </span>
          ) : null}
          <button
            type="button"
            title="Delete this card"
            onClick={(e) => {
              e.stopPropagation();
              removeCard(slot.id);
            }}
            className="ml-auto rounded px-1 text-sm font-bold text-ink-soft hover:text-stamp"
          >
            ×
          </button>
        </div>

        {/* Modules stacked as small labels so you can read what's in a card at a
            glance, even in a short ½ card. */}
        <div className="flex flex-col gap-1">
          {slot.moduleIds.map((id, idx) => (
            <div
              key={id}
              title={moduleById(id).name}
              className="flex items-center gap-1 rounded-md border border-rule bg-paper px-1.5 py-0.5"
            >
              {multi && !shuffleOn ? (
                <span className="text-[0.55rem] font-bold text-ink-soft">{idx + 1}.</span>
              ) : null}
              <span className="flex-1 truncate text-[0.7rem] font-semibold leading-tight text-ink">
                {moduleById(id).name}
              </span>
              <DifficultyDial
                value={slot.moduleDifficulty?.[id] ?? defaultDifficulty}
                onChange={(v) => setModuleDifficulty(slot.id, id, v)}
                compact
              />
              <button
                type="button"
                aria-label={`Remove ${moduleById(id).name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromCard(slot.id, id);
                }}
                className="rounded px-0.5 text-xs font-bold text-ink-soft hover:text-stamp"
              >
                ×
              </button>
            </div>
          ))}
          {slot.moduleIds.length < MAX_PER_SLOT ? (
            <button
              type="button"
              aria-label="Add a module to this card"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSlot(slot.id);
                setPickerSlotId(slot.id);
              }}
              className={`flex items-center justify-center gap-1 rounded-md border border-dashed px-1.5 py-0.5 text-[0.65rem] font-semibold transition hover:border-ink hover:text-ink ${
                selected ? "border-ink/40 text-ink/60" : "border-rule text-ink-soft"
              }`}
            >
              + add
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const addCardBtn = (col: number) => {
    const full = remainingUnits(col) <= 0;
    return (
      <button
        type="button"
        disabled={full}
        onClick={() => addCard(col)}
        title={full ? "This column is full — remove or shrink a card to add more" : undefined}
        className={`h-full w-full rounded-xl border-2 border-dashed border-rule py-2 text-sm font-semibold transition ${
          full
            ? "cursor-not-allowed text-ink-soft/50 opacity-50"
            : "text-ink-soft hover:border-ink/40 hover:text-ink"
        }`}
      >
        {full ? "Page full" : "+ Add card"}
      </button>
    );
  };

  return (
    <div className="space-y-9">
      {/* PAPER SIZE */}
      <section>
        <h2 className="font-display text-xl text-ink">Paper size</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Letter prints in two columns; the strip is one stacked column.
        </p>
        <PaperSizeToggle value={paperSize} onChange={onChangePaperSize} />
      </section>

      {/* STEP 1 — CARD GRID */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl text-ink">
            <StepBadge n={1} />
            Your paper
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {isStrip
              ? "One stacked column. Tap a card to open it — set its size, order, and modules."
              : "Two print columns. Add cards to either side, then tap a card to open it — set its size, order, and modules."}
          </p>
        </div>

        <div className={`mx-auto rounded-2xl border border-rule bg-paper p-3 shadow-sm ${isStrip ? "max-w-[560px]" : ""}`}>
          <div className="mb-2 border-b border-dashed border-rule pb-2 text-center">
            <div className="font-display text-base text-ink">Back of the Box</div>
            <div className="text-[0.6rem] uppercase tracking-widest text-ink-soft">
              {isStrip ? "58mm strip" : "US Letter"} · {slots.length} card{slots.length === 1 ? "" : "s"}
            </div>
          </div>

          {isStrip ? (
            <div className="flex flex-col gap-3">
              {slots.filter((s) => (s.column ?? 0) === 0).map((slot) => renderCard(slot))}
              {addCardBtn(0)}
            </div>
          ) : (
            <div className="grid grid-cols-2 items-start gap-x-6 gap-y-3">
              {[0, 1].map((col) => (
                <div key={col} className="flex flex-col">
                  <div className="mb-2 text-center text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft">
                    Column {col + 1}
                  </div>
                  <div className="flex flex-col gap-3">
                    {slots.filter((s) => (s.column ?? 0) === col).map((slot) => renderCard(slot))}
                    {addCardBtn(col)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {slots.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-soft">
              No cards yet — use “+ Add card” to start building your sheet.
            </p>
          ) : null}

          <div className="mt-2 border-t border-dashed border-rule pt-1.5 text-center text-[0.55rem] uppercase tracking-[0.3em] text-ink-soft">
            — tear here —
          </div>
        </div>
      </section>

      {/* EXPLORE MODULES — browse the full catalog; add by tapping a card slot above */}
      {(() => {
        const chip = (active: boolean) =>
          `rounded-full border px-3 py-1 text-xs font-semibold transition ${
            active ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft hover:border-ink/30"
          }`;
        const typeFilters: { id: ModuleCategoryId | "all"; name: string }[] = [
          { id: "all", name: "All types" },
          ...MODULE_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
        ];
        const sizeFilters: { id: SlotSize | "all"; name: string }[] = [
          { id: "all", name: "All sizes" },
          { id: "half", name: "½" },
          { id: "full", name: "1×" },
          { id: "double", name: "2×" },
        ];
        const catName = (id: ModuleCategoryId) =>
          MODULE_CATEGORIES.find((c) => c.id === id)?.name ?? id;
        const shown = MODULE_CATALOG.filter(
          (m) =>
            (exploreType === "all" || m.category === exploreType) &&
            (exploreSize === "all" || moduleSize(m.id) === exploreSize),
        );
        return (
          <section>
            <div className="mb-3">
              <h2 className="font-display text-xl text-ink">Explore modules</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Everything you can print on a dispatch. To add one, tap a card slot above and pick it.
              </p>
            </div>
            <div className="mb-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {typeFilters.map((f) => (
                  <button key={f.id} type="button" onClick={() => setExploreType(f.id)} className={chip(exploreType === f.id)}>
                    {f.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sizeFilters.map((f) => (
                  <button key={f.id} type="button" onClick={() => setExploreSize(f.id)} className={chip(exploreSize === f.id)}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            {shown.length === 0 ? (
              <p className="text-sm text-ink-soft">No modules match those filters.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {shown.map((m) => (
                  <div key={m.id} className="rounded-xl border border-rule bg-paper px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate text-sm font-semibold text-ink">{m.name}</span>
                      <span
                        className="rounded bg-cream px-1.5 py-px text-[0.6rem] font-bold text-ink-soft"
                        title={`${sizeLabel(moduleSize(m.id))} card`}
                      >
                        {sizeLabel(moduleSize(m.id))}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-ink-soft">{m.blurb}</p>
                    <span className="mt-1 inline-block text-[0.6rem] font-semibold uppercase tracking-wide text-ink-soft/70">
                      {catName(m.category)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* CARD EDITOR MODAL — opens when you tap a card (or its + tile) */}
      {pickerSlot
        ? (() => {
            const cardSize = pickerSlot.size ?? "full";
            const cardIndex = slots.indexOf(pickerSlot);
            const cardFull = pickerSlot.moduleIds.length >= MAX_PER_SLOT;
            const multi = pickerSlot.moduleIds.length >= 2;
            const shuffleOn = pickerSlot.mode === "random";
            const usedExcl = usedUnits(pickerSlot.column ?? 0, pickerSlot.id);
            const chip = (active: boolean) =>
              `rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft hover:border-ink/30"
              }`;
            const fitCats = groups.filter((g) => g.modules.some((m) => moduleFitsCard(m.id, cardSize)));
            const typeChips: { id: ModuleCategoryId | "all"; name: string }[] = [
              { id: "all", name: "All" },
              ...fitCats.map((g) => ({ id: g.category.id, name: g.category.name })),
            ];
            const fitGroups = groups
              .map((g) => ({
                category: g.category,
                modules: g.modules.filter((m) => moduleFitsCard(m.id, cardSize)),
              }))
              .filter((g) => g.modules.length > 0 && (pickerType === "all" || g.category.id === pickerType));
            return (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4"
                onClick={() => setPickerSlotId(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  onClick={(e) => e.stopPropagation()}
                  className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-2xl border border-rule bg-cream shadow-xl sm:rounded-2xl"
                >
                  {/* header: title + card size + order + close */}
                  <div className="flex items-start justify-between gap-3 border-b border-rule px-5 py-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-ink">Card {cardIndex + 1}</h3>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {pickerSlot.moduleIds.length}/{MAX_PER_SLOT} chosen ·{" "}
                        {multi ? (shuffleOn ? "random each print" : "printed in order") : "one module"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerSlotId(null)}
                      aria-label="Close"
                      className="-mr-1 rounded-full px-2 py-1 text-xl leading-none text-ink-soft transition hover:bg-paper hover:text-ink"
                    >
                      ×
                    </button>
                  </div>

                  {/* controls: card size + shuffle */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Size</span>
                      {(["half", "full", "double"] as const).map((sz) => {
                        const fits = usedExcl + slotSizeUnits(sz) <= COLUMN_CAPACITY_UNITS;
                        const disabled = !fits && cardSize !== sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            disabled={disabled}
                            title={disabled ? "Not enough room left in this column" : undefined}
                            onClick={() => setSize(pickerSlot.id, sz)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                              cardSize === sz ? "bg-ink text-cream" : "border border-rule bg-paper text-ink-soft"
                            } ${disabled ? "opacity-30" : ""}`}
                          >
                            {sizeLabel(sz)}
                          </button>
                        );
                      })}
                    </div>
                    {multi ? (
                      <button
                        type="button"
                        aria-pressed={shuffleOn}
                        onClick={() => setShuffle(pickerSlot.id, !shuffleOn)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${
                          shuffleOn ? "bg-stamp text-cream" : "border border-rule bg-paper text-ink-soft"
                        }`}
                      >
                        <span aria-hidden>🔀</span>
                        {shuffleOn ? "Shuffle" : "In order"}
                      </button>
                    ) : null}
                  </div>

                  {/* in this card — a small view of what the card holds, in order */}
                  <div className="border-b border-rule px-5 py-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      In this card
                    </div>
                    {pickerSlot.moduleIds.length === 0 ? (
                      <p className="text-xs text-ink-soft">Nothing yet — tap a module below to add it.</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {pickerSlot.moduleIds.map((id, idx) => (
                          <div
                            key={id}
                            className="flex items-center gap-2 rounded-md border border-rule bg-paper px-2 py-1"
                          >
                            {multi && !shuffleOn ? (
                              <span className="text-[0.6rem] font-bold text-ink-soft">{idx + 1}.</span>
                            ) : null}
                            <span className="flex-1 truncate text-sm font-semibold text-ink">
                              {moduleById(id).name}
                            </span>
                            <span className="rounded bg-cream px-1.5 py-px text-[0.6rem] font-bold text-ink-soft">
                              {sizeLabel(moduleSize(id))}
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${moduleById(id).name}`}
                              onClick={() => removeFromCard(pickerSlot.id, id)}
                              className="rounded px-1 text-sm font-bold text-ink-soft hover:text-stamp"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* type filter */}
                  {typeChips.length > 2 ? (
                    <div className="flex flex-wrap gap-1.5 border-b border-rule px-5 py-3">
                      {typeChips.map((f) => (
                        <button key={f.id} type="button" onClick={() => setPickerType(f.id)} className={chip(pickerType === f.id)}>
                          {f.name}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* module list (only modules that fit this card size) */}
                  <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                    <p className="text-xs text-ink-soft">
                      Showing modules that fit a{" "}
                      <span className="font-semibold text-ink">{sizeLabel(cardSize)}</span> card. Tap to add or
                      remove.
                    </p>
                    {fitGroups.map(({ category, modules }) => (
                      <div key={category.id}>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                          {category.name}
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {modules.map((mod) => {
                            const inCard = pickerSlot.moduleIds.includes(mod.id);
                            return (
                              <ModuleOption
                                key={mod.id}
                                id={mod.id}
                                name={mod.name}
                                blurb={mod.blurb}
                                inCard={inCard}
                                blocked={!inCard && cardFull}
                                difficulty={pickerSlot.moduleDifficulty?.[mod.id] ?? defaultDifficulty}
                                onToggle={() => toggleInCard(pickerSlot.id, mod.id)}
                                onDifficulty={(v) => setModuleDifficulty(pickerSlot.id, mod.id, v)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-rule px-5 py-3 text-right">
                    <button type="button" onClick={() => setPickerSlotId(null)} className="btn-primary">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        : null}
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
            Pick a few to start — you can add or swap modules anytime.
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
