"use client";

import Link from "next/link";
import type { KidProfile } from "@/lib/types";
import { AGE_BANDS } from "@/lib/types";

export function KidSwitcher({
  kids,
  activeKidId,
  onSelect,
}: {
  kids: KidProfile[];
  activeKidId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {kids.map((kid) => {
        const active = kid.id === activeKidId;
        const band = AGE_BANDS.find((b) => b.id === kid.ageBand)?.label;
        return (
          <button
            key={kid.id}
            type="button"
            onClick={() => onSelect(kid.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-ink bg-ink text-cream"
                : "border-rule bg-paper text-ink hover:border-ink/40"
            }`}
            aria-pressed={active}
          >
            {kid.name}
            <span className={`ml-1.5 text-xs ${active ? "text-cream/70" : "text-ink-soft"}`}>
              {band}
            </span>
          </button>
        );
      })}
      <Link
        href="/app/setup"
        className="rounded-full border border-dashed border-rule px-3 py-1.5 text-sm text-ink-soft hover:border-stamp hover:text-stamp"
      >
        + Add kid
      </Link>
    </div>
  );
}
