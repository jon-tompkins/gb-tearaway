import { MODULE_CATALOG } from "@/lib/modules";
import { moduleExample, type ModuleExample } from "@/lib/moduleExample";
import SetupClient, { type ExampleMap } from "./SetupClient";

export const dynamic = "force-dynamic";

/** Previews are rendered server-side (the content banks are big) and trimmed for the wire. */
function buildExamples(): ExampleMap {
  const out: ExampleMap = {};
  for (const m of MODULE_CATALOG) {
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

export default function SetupPage() {
  return <SetupClient examples={buildExamples()} />;
}
