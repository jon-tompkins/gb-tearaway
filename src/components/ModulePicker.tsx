"use client";

import type { ModuleId, ModuleSlot, PaperSize, SlotMode, SlotSize } from "@/lib/types";
import { PAPER_SIZE_META } from "@/lib/types";
import { moduleById, moduleSize, modulesByCategory } from "@/lib/modules";

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

function StepBadge({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-cream">
      {n}
    </span>
  );
}

/**
 * Three-step module editor:
 *   1. Choose your palette (which modules you have access to).
 *   2. See your paper as a numbered grid of cards.
 *   3. Tap a card, then pick which palette modules go in it (up to 4).
 * Cards with 2+ modules get a shuffle toggle (on = random each print).
 */
export function SlotEditor({
  paperSize,
  slots,
  selectedSlotId,
  access,
  onSelectSlot,
  onChangeSlots,
  onChangePaperSize,
  onChangeAccess,
  modulePoolLimit,
}: {
  paperSize: PaperSize;
  slots: ModuleSlot[];
  selectedSlotId: string | null;
  access: ModuleId[];
  onSelectSlot: (id: string) => void;
  onChangeSlots: (next: ModuleSlot[]) => void;
  onChangePaperSize: (size: PaperSize) => void;
  onChangeAccess: (next: ModuleId[]) => void;
  modulePoolLimit?: number | null;
}) {
  const isStrip = paperSize !== "letter";
  const limit = modulePoolLimit ?? null;
  const atAccessCap = limit != null && access.length >= limit;
  const accessSet = new Set(access);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const selectedIndex = slots.findIndex((s) => s.id === selectedSlotId);
  const groups = modulesByCategory();

  function addCard(column: number) {
    const id = `slot-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    onChangeSlots([...slots, { id, moduleIds: [], mode: "single", cursor: 0, size: "full", column }]);
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
    // Card size is manual. Modules are size-locked, so changing a card's size
    // drops any modules that no longer fit (the palette below re-filters to match).
    onChangeSlots(
      slots.map((s) =>
        s.id === slotId
          ? normalizeMode({
              ...s,
              size,
              moduleIds: s.moduleIds.filter((m) => moduleSize(m) === size),
              cursor: 0,
            })
          : s,
      ),
    );
  }
  function removeFromCard(slotId: string, id: ModuleId) {
    writeSlot(slotId, (s) => ({ ...s, moduleIds: s.moduleIds.filter((m) => m !== id), cursor: 0 }));
  }
  function toggleInCard(slotId: string, id: ModuleId) {
    const s = slots.find((x) => x.id === slotId);
    if (!s) return;
    if (s.moduleIds.includes(id)) {
      removeFromCard(slotId, id);
      return;
    }
    // only modules matching this card's size can go in it
    if (moduleSize(id) !== (s.size ?? "full")) return;
    if (s.moduleIds.length >= MAX_PER_SLOT) return;
    writeSlot(slotId, (x) => ({ ...x, moduleIds: [...x.moduleIds, id] }));
  }
  function toggleAccess(id: ModuleId) {
    if (accessSet.has(id)) {
      onChangeAccess(access.filter((m) => m !== id));
      // dropping from the palette also pulls it out of every card
      onChangeSlots(
        slots.map((s) =>
          s.moduleIds.includes(id)
            ? normalizeMode({ ...s, moduleIds: s.moduleIds.filter((m) => m !== id), cursor: 0 })
            : s,
        ),
      );
    } else {
      if (atAccessCap) return;
      onChangeAccess([...access, id]);
    }
  }

  const renderCard = (slot: ModuleSlot) => {
    const i = slots.indexOf(slot);
    const selected = selectedSlotId === slot.id;
    const n = slot.moduleIds.length;
    const multi = n >= 2;
    const shuffleOn = slot.mode === "random";
    const size = slot.size ?? "full";
    const minH = size === "double" ? 232 : size === "half" ? 76 : 148;
    return (
      <div
        key={slot.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectSlot(slot.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectSlot(slot.id);
          }
        }}
        style={{ minHeight: minH }}
        className={`flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-cream/50 px-2.5 py-2 transition ${
          selected ? "border-ink ring-2 ring-ink/20" : "border-rule hover:border-ink/30"
        }`}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[0.65rem] font-bold text-cream">
            {i + 1}
          </span>
          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            {(["half", "full", "double"] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                title={sz === "half" ? "Half card" : sz === "full" ? "One card" : "Double (tall)"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSize(slot.id, sz);
                }}
                className={`rounded px-1.5 py-0.5 text-[0.55rem] font-bold uppercase transition ${
                  size === sz ? "bg-ink text-cream" : "border border-rule bg-paper text-ink-soft"
                }`}
              >
                {sizeLabel(sz)}
              </button>
            ))}
          </div>
          <span className="ml-auto flex items-center gap-1">
            {multi ? (
              <button
                type="button"
                aria-pressed={shuffleOn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShuffle(slot.id, !shuffleOn);
                }}
                title={shuffleOn ? "Shuffle on — random each print" : "Shuffle off — in order"}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider transition ${
                  shuffleOn ? "bg-stamp text-cream" : "border border-rule bg-paper text-ink-soft"
                }`}
              >
                <span aria-hidden>🔀</span>
                {shuffleOn ? "Shuffle" : "In order"}
              </button>
            ) : null}
            <button
              type="button"
              title="Delete this card"
              onClick={(e) => {
                e.stopPropagation();
                removeCard(slot.id);
              }}
              className="rounded px-1 text-sm font-bold text-ink-soft hover:text-stamp"
            >
              ×
            </button>
          </span>
        </div>

        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-1.5">
          {Array.from({ length: MAX_PER_SLOT }).map((_, idx) => {
            const id = slot.moduleIds[idx];
            if (id) {
              return (
                <div
                  key={id}
                  title={moduleById(id).name}
                  className="flex h-full min-h-[28px] items-center rounded-lg border border-rule bg-paper px-2 py-1"
                >
                  {multi && !shuffleOn ? (
                    <span className="mr-1 text-[0.6rem] font-bold text-ink-soft">{idx + 1}.</span>
                  ) : null}
                  <span className="flex-1 truncate text-xs font-semibold text-ink">
                    {moduleById(id).name}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${moduleById(id).name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCard(slot.id, id);
                    }}
                    className="ml-1 shrink-0 rounded px-1 text-sm font-bold text-ink-soft hover:text-stamp"
                  >
                    ×
                  </button>
                </div>
              );
            }
            return (
              <div
                key={`empty-${idx}`}
                className={`flex h-full min-h-[28px] items-center justify-center rounded-lg border border-dashed text-lg ${
                  selected ? "border-ink/40 bg-paper/50 text-ink/60" : "border-rule bg-paper/30 text-ink-soft"
                }`}
              >
                +
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const addCardBtn = (col: number, label: string) => (
    <button
      type="button"
      onClick={() => addCard(col)}
      className="rounded-xl border-2 border-dashed border-rule py-2 text-sm font-semibold text-ink-soft transition hover:border-ink/40 hover:text-ink"
    >
      {label}
    </button>
  );

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

      {/* STEP 1 — PALETTE */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">
              <StepBadge n={1} />
              Choose your modules
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Pick the modules you want available — you&apos;ll drop these into the cards below.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-paper px-3 py-1 text-sm tabular-nums text-ink-soft">
            {access.length}
            {limit != null ? `/${limit}` : " · unlocked"}
          </div>
        </div>

        <div className="space-y-4">
          {groups.map(({ category, modules }) => (
            <div key={category.id}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                {category.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {modules.map((mod) => {
                  const on = accessSet.has(mod.id);
                  const blocked = !on && atAccessCap;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleAccess(mod.id)}
                      disabled={blocked}
                      title={blocked ? "Palette limit reached" : mod.blurb}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        on
                          ? "border-ink bg-ink text-cream"
                          : "border-rule bg-paper text-ink hover:border-ink/30"
                      } ${blocked ? "opacity-40" : ""}`}
                    >
                      <span className="mr-1 text-xs">{on ? "✓" : "+"}</span>
                      {mod.name}
                      <span
                        className={`ml-1.5 rounded px-1 py-px text-[0.6rem] font-bold ${
                          on ? "bg-cream/25 text-cream" : "bg-cream text-ink-soft"
                        }`}
                        title={`This module is a ${moduleSize(mod.id)} card`}
                      >
                        {sizeLabel(moduleSize(mod.id))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEP 2 — CARD GRID */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl text-ink">
            <StepBadge n={2} />
            Your paper
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {isStrip
              ? "One stacked column. Tap a card to fill it; set its size with ½ / 1× / 2×."
              : "Two print columns. Add cards to either side and set each card's size with ½ / 1× / 2×."}
          </p>
        </div>

        <div className={`mx-auto rounded-2xl border border-rule bg-paper p-3 shadow-sm ${isStrip ? "max-w-[560px]" : ""}`}>
          <div className="mb-2 border-b border-dashed border-rule pb-2 text-center">
            <div className="font-display text-base text-ink">Tearaway</div>
            <div className="text-[0.6rem] uppercase tracking-widest text-ink-soft">
              {isStrip ? "58mm strip" : "US Letter"} · {slots.length} card{slots.length === 1 ? "" : "s"}
            </div>
          </div>

          {isStrip ? (
            <div className="flex flex-col gap-3">
              {slots.filter((s) => (s.column ?? 0) === 0).map((slot) => renderCard(slot))}
              {addCardBtn(0, "+ Add card")}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((col) => (
                <div key={col} className="flex flex-col gap-3">
                  <div className="text-center text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft">
                    Column {col + 1}
                  </div>
                  {slots.filter((s) => (s.column ?? 0) === col).map((slot) => renderCard(slot))}
                  {addCardBtn(col, "+ Add card")}
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

      {/* STEP 3 — FILL SELECTED CARD */}
      <section>
        {!selectedSlot ? (
          <p className="text-sm text-ink-soft">
            <StepBadge n={3} />
            Select a card above to choose what goes in it.
          </p>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="font-display text-xl text-ink">
                <StepBadge n={3} />
                What goes in Card {selectedIndex + 1}?
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                This is a{" "}
                <span className="font-semibold text-ink">{sizeLabel(selectedSlot.size)}</span> card, so
                only {sizeLabel(selectedSlot.size)} modules fit.{" "}
                <span className="font-semibold text-ink">
                  {selectedSlot.moduleIds.length}/{MAX_PER_SLOT}
                </span>{" "}
                chosen.
              </p>
            </div>

            {(() => {
              const sizeAccess = access.filter(
                (id) => moduleSize(id) === (selectedSlot.size ?? "full"),
              );
              return sizeAccess.length === 0 ? (
              <p className="rounded-xl border border-dashed border-rule bg-paper/50 px-4 py-3 text-sm text-ink-soft">
                No {sizeLabel(selectedSlot.size)} modules in your palette — add some{" "}
                {sizeLabel(selectedSlot.size)} modules in step 1, or change this card&apos;s size.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {sizeAccess.map((id) => {
                  const inCard = selectedSlot.moduleIds.includes(id);
                  const full = selectedSlot.moduleIds.length >= MAX_PER_SLOT;
                  const meta = moduleById(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleInCard(selectedSlot.id, id)}
                      disabled={!inCard && full}
                      title={!inCard && full ? "Card is full (max 4)" : meta.blurb}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        inCard ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
                      } ${!inCard && full ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          inCard ? "bg-cream text-ink" : "bg-cream text-ink-soft"
                        }`}
                      >
                        {inCard ? "✓" : "+"}
                      </span>
                      <span className="truncate text-sm font-semibold">{meta.name}</span>
                    </button>
                  );
                })}
              </div>
            );
            })()}
          </>
        )}
      </section>
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
