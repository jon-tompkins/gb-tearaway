import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface ScrambleItem {
  word: string;
  hint: string;
}

interface ScrambleEntry extends ScrambleItem {
  bands: AgeBand[];
}

/** Age-banded word bank. Short/common for littles, longer/trickier for olders. */
const SCRAMBLES: ScrambleEntry[] = [
  // 4–6 — short, concrete, phonetic
  { bands: ["4-6"], word: "cat", hint: "A pet that says meow." },
  { bands: ["4-6"], word: "dog", hint: "A pet that says woof." },
  { bands: ["4-6"], word: "sun", hint: "It shines in the day sky." },
  { bands: ["4-6"], word: "star", hint: "It twinkles at night." },
  { bands: ["4-6"], word: "fish", hint: "It swims and has fins." },
  { bands: ["4-6"], word: "milk", hint: "A white drink from a cow." },
  { bands: ["4-6"], word: "frog", hint: "Green and it hops." },
  { bands: ["4-6"], word: "moon", hint: "It glows at night." },
  { bands: ["4-6"], word: "bird", hint: "It has wings and sings." },
  { bands: ["4-6"], word: "cake", hint: "A sweet treat for birthdays." },
  { bands: ["4-6"], word: "ball", hint: "You bounce, kick, or throw it." },
  { bands: ["4-6"], word: "tree", hint: "It has leaves and branches." },

  // 7–9 — everyday vocabulary
  { bands: ["7-9"], word: "planet", hint: "Earth is one of these." },
  { bands: ["7-9"], word: "garden", hint: "A place where flowers grow." },
  { bands: ["7-9"], word: "rocket", hint: "It blasts off into space." },
  { bands: ["7-9"], word: "puzzle", hint: "You solve it, piece by piece." },
  { bands: ["7-9"], word: "dragon", hint: "A mythical beast that breathes fire." },
  { bands: ["7-9"], word: "island", hint: "Land surrounded by water." },
  { bands: ["7-9"], word: "rainbow", hint: "Colored arc after the rain." },
  { bands: ["7-9"], word: "monster", hint: "A scary make-believe creature." },
  { bands: ["7-9"], word: "kitchen", hint: "The room where meals are cooked." },
  { bands: ["7-9"], word: "octopus", hint: "A sea animal with eight arms." },
  { bands: ["7-9", "10-12"], word: "compass", hint: "It always points north." },
  { bands: ["7-9", "10-12"], word: "volcano", hint: "A mountain that can erupt." },

  // 10–12 — longer, science & world words
  { bands: ["10-12"], word: "gravity", hint: "The force that pulls things down." },
  { bands: ["10-12"], word: "molecule", hint: "Two or more atoms bonded together." },
  { bands: ["10-12"], word: "telescope", hint: "You use it to see far-off stars." },
  { bands: ["10-12"], word: "dinosaur", hint: "A giant reptile from long ago." },
  { bands: ["10-12"], word: "continent", hint: "Africa and Asia are each one." },
  { bands: ["10-12"], word: "electric", hint: "___ current powers your lamp." },
  { bands: ["10-12"], word: "mountain", hint: "Everest is the tallest one." },
  { bands: ["10-12"], word: "pyramid", hint: "Ancient Egyptians built these." },
  { bands: ["10-12"], word: "magnetic", hint: "A ___ field moves a compass needle." },
  { bands: ["10-12"], word: "hurricane", hint: "A huge spinning ocean storm." },
];

export function pickScramble(band: AgeBand, rng: () => number): ScrambleItem {
  const pool = SCRAMBLES.filter((s) => s.bands.includes(band));
  const src = pool.length ? pool : SCRAMBLES;
  const { word, hint } = pick(rng, src);
  return { word, hint };
}

/**
 * Deterministically shuffle a word's letters into an UPPERCASE scramble,
 * spaced out for young solvers. Guarantees the result differs from the word.
 */
export function scrambleWord(word: string, rng: () => number): string {
  const letters = word.toUpperCase().split("");
  if (letters.length < 2) return letters.join("");
  let out = letters.slice();
  for (let attempt = 0; attempt < 12; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.join("") !== letters.join("")) break;
  }
  // Fallback: if we somehow still match, rotate by one.
  if (out.join("") === letters.join("")) out = [...out.slice(1), out[0]];
  return out.join(" ");
}
