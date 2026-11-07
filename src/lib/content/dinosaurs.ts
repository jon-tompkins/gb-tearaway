import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";
import { mergeBank } from "./mergeBank";
import { DINOSAURS as RAW, type DinoEntry } from "./bank/dinosaurs";
import { dinoSvg } from "../puzzles/dino-art";

/** Exported for the admin bank view. */
export const DINOSAURS: DinoEntry[] = mergeBank(RAW, (d) => d.name);

export interface DinoCard {
  name: string;
  lines: string[];
  svg: string;
}

const BUS_M = 12; // a school bus, for the little kids' size comparison

export function dinoCard(d: DinoEntry, band: AgeBand): DinoCard {
  const lines = [d.name.toUpperCase(), `${d.diet} · ${d.when}`];
  if (band === "4-6") {
    const buses = d.lengthM / BUS_M;
    lines.push(
      buses < 0.6
        ? "Long as: a few big kids lying in a row."
        : `Long as: about ${Math.max(1, Math.round(buses))} school bus${Math.round(buses) <= 1 ? "" : "es"}.`,
    );
    lines.push(`Fun fact: ${d.fact}`);
    lines.push("Color me in!");
  } else {
    lines.push(`Length: about ${d.lengthM} m. Weight: about ${d.weightKg.toLocaleString("en-US")} kg.`);
    lines.push(`Fun fact: ${d.fact}`);
    if (d.note && band === "10-12") lines.push(d.note);
    lines.push("Color me in, then invent a nickname for it.");
  }
  return { name: d.name, lines, svg: dinoSvg(d.name) };
}

export function pickDino(band: AgeBand, rng: () => number): DinoCard {
  return dinoCard(pick(rng, DINOSAURS), band);
}

export function pickDinoForDay(band: AgeBand, key: RotateKey): DinoCard {
  return dinoCard(pickRotating(DINOSAURS, key, `dinosaurs|${band}`), band);
}
