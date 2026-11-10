import { MODULE_CATALOG } from "@/lib/modules";
import { moduleExample, type ModuleExample } from "@/lib/moduleExample";

export type ExampleMap = Partial<Record<string, { svg?: string; locator?: string; text?: string[] }>>;

/** Previews are rendered server-side (the content banks are big) and trimmed for the wire. */
export function buildExamples(ids?: readonly string[]): ExampleMap {
  const out: ExampleMap = {};
  for (const m of MODULE_CATALOG) {
    if (ids && !ids.includes(m.id)) continue;
    try {
      const ex: ModuleExample = moduleExample(m.id);
      out[m.id] = {
        svg: ex.svg,
        locator: ex.locator?.replace(/<div class="geo-cap">.*?<\/div>/, ""),
        text: ex.text?.slice(0, 6),
      };
    } catch {
      /* no preview — tile falls back to the blurb */
    }
  }
  return out;
}
