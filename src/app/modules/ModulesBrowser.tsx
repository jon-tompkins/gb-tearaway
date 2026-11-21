"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppNav";
import { GetStartedButton } from "@/components/GetStartedButton";
import { HowItWorks } from "@/components/HowItWorks";
import { MODULE_CATALOG, MODULE_CATEGORIES, moduleAudience, moduleSize } from "@/lib/modules";
import { useModuleVisibility } from "@/lib/useModuleVisibility";
import { NOUN } from "@/lib/copy";
import type { ExampleMap } from "@/lib/setupExamples";
import type { ModuleCategoryId, ModuleId, SlotSize } from "@/lib/types";

const SIZE_LABEL: Record<SlotSize, string> = { half: "½", full: "1×", double: "2×" };

function Thumb({ id, examples }: { id: ModuleId; examples: ExampleMap }) {
  const ex = examples[id];
  if (ex?.svg) {
    return (
      <div
        className="flex h-full items-center justify-center gap-2 [&_svg]:h-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: ex.svg + (ex.locator ? `<div style="width:38%;flex:none">${ex.locator}</div>` : "") }}
      />
    );
  }
  if (ex?.text?.length) {
    return (
      <div className="font-mono text-[0.68rem] leading-snug text-ink">
        {ex.text.slice(0, 6).map((line, i) => (
          <p key={i} className={i === 0 ? "font-semibold" : ""}>
            {line}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function ModulesBrowser({ examples }: { examples: ExampleMap }) {
  const vis = useModuleVisibility();
  const [type, setType] = useState<ModuleCategoryId | "all">("all");
  const [size, setSize] = useState<SlotSize | "all">("all");
  const [aud, setAud] = useState<"any" | "kids" | "grownups">("any");

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-semibold transition ${
      active ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft hover:border-ink/30"
    }`;
  const shown = MODULE_CATALOG.filter(
    (m) => vis.isVisible(m.id) && (type === "all" || m.category === type) && (size === "all" || moduleSize(m.id) === size) &&
      (aud === "any" || (aud === "kids" ? moduleAudience(m.id) === "kids" : moduleAudience(m.id) === "all")),
  );
  const groups = MODULE_CATEGORIES.map((category) => ({
    category,
    modules: shown.filter((m) => m.category === category.id),
  })).filter((g) => g.modules.length > 0);

  return (
    <AppShell title="Modules" subtitle={`Everything you can put on a ${NOUN.one}. Browse here, then add them when you build a page.`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <HowItWorks />
        <GetStartedButton className="btn-primary whitespace-nowrap text-sm" label="Start 30 days free" signedInHref="/app/setup" />
      </div>
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={chip(aud === "any")} onClick={() => setAud("any")}>
            Everyone
          </button>
          <button type="button" className={chip(aud === "kids")} onClick={() => setAud("kids")}>
            Kid-focused
          </button>
          <button type="button" className={chip(aud === "grownups")} onClick={() => setAud("grownups")}>
            For grown-ups &amp; seniors
          </button>
        </div>
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
      {groups.length === 0 ? (
        <p className="text-sm text-ink-soft">No modules match those filters.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(({ category, modules }) => (
            <section key={category.id}>
              <h2 className="font-display text-xl text-ink">{category.name}</h2>
              <p className="mt-0.5 text-xs text-ink-soft">{category.blurb}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {modules.map((m) => (
                  <Link
                    key={m.id}
                    href={`/modules/${m.id}`}
                    className="block overflow-hidden rounded-xl border border-rule bg-paper transition hover:border-ink/40 hover:bg-cream"
                  >
                    <div className="relative h-36 overflow-hidden border-b border-rule/60 bg-[#fbf8f1] p-3">
                      <Thumb id={m.id} examples={examples} />
                      <span
                        className="absolute right-2 top-2 rounded bg-paper px-1.5 py-px text-[0.6rem] font-bold text-ink-soft border border-rule"
                        title={`${SIZE_LABEL[moduleSize(m.id)]} card`}
                      >
                        {SIZE_LABEL[moduleSize(m.id)]}
                      </span>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-ink">{m.name}</p>
                      <p className="mt-0.5 text-xs leading-snug text-ink-soft">{m.blurb}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
