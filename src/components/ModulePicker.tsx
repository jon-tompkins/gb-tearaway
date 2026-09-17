"use client";

import type { ModuleId } from "@/lib/types";
import { MAX_SLOTS, MIN_SLOTS } from "@/lib/types";
import { MARKETPLACE_PACKS, modulesByCategory } from "@/lib/modules";

export function ModulePicker({
  selected,
  onChange,
}: {
  selected: ModuleId[];
  onChange: (next: ModuleId[]) => void;
}) {
  function toggle(id: ModuleId) {
    if (selected.includes(id)) {
      if (selected.length <= MIN_SLOTS) return;
      onChange(selected.filter((m) => m !== id));
      return;
    }
    if (selected.length >= MAX_SLOTS) return;
    onChange([...selected, id]);
  }

  const groups = modulesByCategory();

  return (
    <div className="space-y-10">
      <div className="mb-1 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Morning slots</h2>
          <p className="text-sm text-ink-soft">
            Pick {MIN_SLOTS}–{MAX_SLOTS} modules. Order is print order.
          </p>
        </div>
        <div className="rounded-full bg-paper px-3 py-1 text-sm tabular-nums text-ink-soft">
          {selected.length}/{MAX_SLOTS}
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
              const atMax = !on && selected.length >= MAX_SLOTS;
              const atMin = on && selected.length <= MIN_SLOTS;
              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => toggle(mod.id)}
                    disabled={atMax || atMin}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      on ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
                    } ${atMax || atMin ? "opacity-60" : ""}`}
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
