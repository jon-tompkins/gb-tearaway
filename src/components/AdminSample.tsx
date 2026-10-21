"use client";

import { useState } from "react";
import type { ModuleId, SlotSize } from "@/lib/types";

const SIZES: { id: SlotSize; label: string }[] = [
  { id: "half", label: "½ card" },
  { id: "full", label: "1× card" },
  { id: "double", label: "2× card" },
];

/** Admin test output: pick appropriateness + card size, generate one card as it prints. */
export function AdminSample({
  moduleId,
  naturalSize,
  sizes,
  minLevel,
}: {
  moduleId: ModuleId;
  naturalSize: SlotSize;
  /** Card sizes this module can go in. */
  sizes: SlotSize[];
  minLevel: number;
}) {
  const [d, setD] = useState(Math.max(minLevel, 8));
  const [size, setSize] = useState<SlotSize>(naturalSize);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    const seed = Math.floor(Math.random() * 1_000_000);
    setSrc(`/api/admin/sample?module=${moduleId}&d=${d}&size=${size}&seed=${seed}`);
  }

  return (
    <section className="mt-8 rounded-xl border border-rule bg-paper p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">Test output</h2>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Appropriateness: <span className="text-base text-ink">{d}</span>
          <input
            type="range"
            min={minLevel}
            max={20}
            value={d}
            onChange={(e) => setD(Number(e.target.value))}
            className="w-48 accent-ink"
          />
        </label>
        <div className="flex gap-1">
          {SIZES.filter((s) => sizes.includes(s.id)).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSize(s.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                size === s.id ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft"
              }`}
            >
              {s.label}
              {s.id === naturalSize ? " ★" : ""}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary text-sm" onClick={generate}>
          {loading ? "Generating…" : src ? "Generate another" : "Generate"}
        </button>
        {src ? (
          <a href={src} target="_blank" rel="noreferrer" className="text-xs font-semibold text-ink-soft underline">
            open full size
          </a>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-ink-soft">★ = the module’s usual card size. Shown at real print size (Letter column).</p>
      {src ? (
        <iframe
          key={src}
          src={src}
          onLoad={() => setLoading(false)}
          className="mt-4 h-[560px] w-full rounded-lg border border-rule bg-cream"
          title="Test output"
        />
      ) : null}
    </section>
  );
}
