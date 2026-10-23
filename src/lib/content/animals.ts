import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";
import { mergeBank } from "./mergeBank";
import { ANIMALS as RAW, type AnimalEntry } from "./bank/animals";
import { animalSvg } from "../puzzles/animal-art";

/** Exported for the admin bank view. */
export const ANIMALS: AnimalEntry[] = mergeBank(RAW, (a) => a.name);

export interface AnimalCard {
  name: string;
  lines: string[];
  svg: string;
}

export function animalCard(a: AnimalEntry, band: AgeBand): AnimalCard {
  const lines = [a.name.toUpperCase(), `Lives: ${a.lives}.`, `Size: ${a.size}.`, `Fun fact: ${a.fact}`];
  if (band === "4-6") lines.push("Color me in!");
  else lines.push("Color me in, then draw where I live.");
  return { name: a.name, lines, svg: animalSvg(a.spec, a.name) };
}

export function pickAnimal(band: AgeBand, rng: () => number): AnimalCard {
  return animalCard(pick(rng, ANIMALS), band);
}

export function pickAnimalForDay(band: AgeBand, key: RotateKey): AnimalCard {
  return animalCard(pickRotating(ANIMALS, key, `animal|${band}`), band);
}
