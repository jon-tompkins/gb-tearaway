"use client";

import Link from "next/link";
import { useState } from "react";
import type { ModuleCategoryId, SlotSize } from "@/lib/types";
import { MODULE_CATALOG, MODULE_CATEGORIES, moduleSize } from "@/lib/modules";

function sizeLabel(sz: SlotSize): string {
  return sz === "half" ? "½" : sz === "double" ? "2×" : "1×";
}

export default function ModulesBrowse() {
  const [type, setType] = useState<ModuleCategoryId | "all">("all");
  const [size, setSize] = useState<SlotSize | "all">("all");

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
  const catName = (id: ModuleCategoryId) => MODULE_CATEGORIES.find((c) => c.id === id)?.name ?? id;

  const shown = MODULE_CATALOG.filter(
    (m) =>
      (type === "all" || m.category === type) && (size === "all" || moduleSize(m.id) === size),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
          ← Back of the Box
        </Link>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Modules</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every block you can put on a morning dispatch — puzzles, real news, geography, weather, and
          more. Tap one to see how it works, an example, and what you can set.
        </p>
      </header>

      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {typeFilters.map((f) => (
            <button key={f.id} type="button" onClick={() => setType(f.id)} className={chip(type === f.id)}>
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sizeFilters.map((f) => (
            <button key={f.id} type="button" onClick={() => setSize(f.id)} className={chip(size === f.id)}>
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((m) => (
          <Link
            key={m.id}
            href={`/modules/${m.id}`}
            className="group rounded-xl border border-rule bg-paper px-4 py-3 transition hover:border-ink/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-display text-lg text-ink group-hover:underline">
                {m.name}
              </span>
              <span className="rounded bg-cream px-1.5 py-px text-[0.6rem] font-bold text-ink-soft">
                {sizeLabel(moduleSize(m.id))}
              </span>
            </div>
            <p className="mt-1 text-sm leading-snug text-ink-soft">{m.blurb}</p>
            <span className="mt-2 inline-block text-[0.6rem] font-semibold uppercase tracking-wide text-ink-soft/70">
              {catName(m.category)}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
