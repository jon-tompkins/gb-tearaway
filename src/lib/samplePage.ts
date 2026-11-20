import { SAMPLE_NEWS } from "./content/sampleNews";
import { buildJobForKid } from "./serverStrip";
import { DEMO_KEY, seedKid } from "./store";
import type { AgeBand, ModuleSlot, PrintJob } from "./types";

/**
 * Public sample layout: puzzles, a news card, and a joke, packed to a letter page
 * (8 half-units per column). Shared by GET /api/sample/[band] and the render test.
 */
export function sampleSlots(): ModuleSlot[] {
  return [
    { id: "slot-0", moduleIds: ["crossword"], mode: "single", cursor: 0, size: "double", column: 0 },
    { id: "slot-1", moduleIds: ["maze"], mode: "single", cursor: 0, size: "double", column: 0 },
    { id: "slot-2", moduleIds: ["news_world"], mode: "single", cursor: 0, size: "double", column: 1 },
    { id: "slot-3", moduleIds: ["sudoku"], mode: "single", cursor: 0, size: "full", column: 1 },
    { id: "slot-4", moduleIds: ["joke"], mode: "single", cursor: 0, size: "half", column: 1 },
    { id: "slot-5", moduleIds: ["sequence"], mode: "single", cursor: 0, size: "half", column: 1 },
  ];
}

export function sampleKid(band: AgeBand) {
  return seedKid({
    id: `sample-${band}`,
    name: "Sample",
    ageBand: band,
    paperSize: "letter",
    slots: sampleSlots(),
  });
}

/** Same generate path as /api/sample/*. Live news wins; otherwise the sample bank fills the card. */
export function buildSampleJob(band: AgeBand): Promise<PrintJob> {
  return buildJobForKid(sampleKid(band), {
    userKey: DEMO_KEY,
    nonce: 0,
    newsFallback: { news_world: SAMPLE_NEWS },
  });
}
