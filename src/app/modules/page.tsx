"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppNav";
import { HowItWorks } from "@/components/HowItWorks";
import { MODULE_CATALOG, MODULE_CATEGORIES, moduleSize } from "@/lib/modules";
import { useModuleVisibility } from "@/lib/useModuleVisibility";
import { NOUN } from "@/lib/copy";
import type { ModuleCategoryId, SlotSize } from "@/lib/types";

const SIZE_LABEL: Record<SlotSize, string> = { half: "½", full: "1×", double: "2×" };

export default function BrowseModulesPage() {
  const vis = useModuleVisibility();
  const [type, setType] = useState<ModuleCategoryId | "all">("all");
  const [size, setSize] = useState<SlotSize | "all">("all");

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-semibold transition ${
      active ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft hover:border-ink/30"
    }`;
  const shown = MODULE_CATALOG.filter(
    (m) => vis.isVisible(m.id) && (type === "all" || m.category === type) && (size === "all" || moduleSize(m.id) === size),
  );
  const catName = (id: ModuleCategoryId) => MODULE_CATEGORIES.find((c) => c.id === id)?.name ?? id;

  return (
    <AppShell title="Modules" subtitle={`Everything you can put on a ${NOUN.one}. Browse here, then add them when you build a page.`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <HowItWorks />
        <Link href="/app/setup" className="btn-primary text-sm">
          Create {NOUN.one}
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={chip(type === "all")} onClick={() => setType("all")}>
            All types
          </button>
          {MODULE_CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={chip(type === c.id)} onClick={() => setType(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={chip(size === "all")} onClick={() => setSize("all")}>
            All sizes
          </button>
          {(["half", "full", "double"] as SlotSize[]).map((s) => (
            <button key={s} type="button" className={chip(size === s)} onClick={() => setSize(s)}>
              {SIZE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-ink-soft">No modules match those filters.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {shown.map((m) => (
            <Link
              key={m.id}
              href={`/modules/${m.id}`}
              className="block rounded-xl border border-rule bg-paper px-3 py-2.5 transition hover:border-ink/40 hover:bg-cream"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-sm font-semibold text-ink">{m.name}</span>
                <span
                  className="rounded bg-cream px-1.5 py-px text-[0.6rem] font-bold text-ink-soft"
                  title={`${SIZE_LABEL[moduleSize(m.id)]} card`}
                >
                  {SIZE_LABEL[moduleSize(m.id)]}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-ink-soft">{m.blurb}</p>
              <span className="mt-1 inline-block text-[0.6rem] font-semibold uppercase tracking-wide text-ink-soft/70">
                {catName(m.category)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
