import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";
import { mergeBank } from "./mergeBank";
import { PLANES as RAW, type PlaneEntry } from "./bank/planes";
import { planeSvg } from "../puzzles/plane-art";

/** Exported for the admin bank view. */
export const PLANES: PlaneEntry[] = mergeBank(RAW, (p) => p.name);

export interface PlaneCard {
  name: string;
  lines: string[];
  svg: string;
}

const BUS_M = 12; // a school bus, for the little kids' size comparison

export function planeCard(p: PlaneEntry, band: AgeBand): PlaneCard {
  const lines = [p.name.toUpperCase(), `${p.job} · ${p.country}`];
  if (band === "4-6") {
    const buses = Math.max(1, Math.round(p.lengthM / BUS_M));
    lines.push(`Long as: about ${buses} school bus${buses === 1 ? "" : "es"}.`);
    lines.push(`Fun fact: ${p.fact}`);
    lines.push("Color me in!");
  } else {
    lines.push(`Length: about ${p.lengthM} m. Wingspan: about ${p.spanM} m.`);
    lines.push(`Top speed: ${p.speed}.`);
    if (band === "10-12") lines.push(`First flew: ${p.first}. Crew: ${p.crew}.`);
    lines.push(`Fun fact: ${p.fact}`);
    lines.push("Color me in, then give it a squadron name.");
  }
  return { name: p.name, lines, svg: planeSvg(p.spec) };
}

export function pickPlane(band: AgeBand, rng: () => number): PlaneCard {
  return planeCard(pick(rng, PLANES), band);
}

export function pickPlaneForDay(band: AgeBand, key: RotateKey): PlaneCard {
  return planeCard(pickRotating(PLANES, key, `planes|${band}`), band);
}
