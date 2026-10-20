import type { AgeBand } from "../types";

const norm = (t: string) =>
  t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();

/** Collapse entries with the same text into one, keeping every age band any copy had. */
export function mergeBank<T extends { bands: AgeBand[] }>(entries: T[], keyOf: (e: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const e of entries) {
    const k = norm(keyOf(e));
    const prev = byKey.get(k);
    if (!prev) byKey.set(k, { ...e, bands: [...e.bands] });
    else for (const b of e.bands) if (!prev.bands.includes(b)) prev.bands.push(b);
  }
  return [...byKey.values()];
}
