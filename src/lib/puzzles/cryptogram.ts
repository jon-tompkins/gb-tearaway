import type { AgeBand } from "../types";

/**
 * A cryptogram: decode a short message.
 *  - 4–6:  number code (A=1 … Z=26) with the full key printed.
 *  - 7–9:  letter-shift cipher; one pair (e.g. "A = E") is given, the rest is up to the kid.
 *  - 10–12: random substitution cipher with two letters revealed.
 * Seeded, so the same kid/day always gets the same puzzle. The answer is shown in the app only.
 */
export interface Cryptogram {
  /** Lines to print (encoded message + instructions). */
  lines: string[];
  /** The decoded message. */
  answer: string;
}

type RNG = () => number;
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randInt(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Letters grouped in 5s for readability, with a dot between words kept as double space. */
function numberCode(text: string): string {
  return text
    .split(" ")
    .map((w) => [...w].map((c) => ALPHA.indexOf(c) + 1).join(" "))
    .join("   |   ");
}

function shiftCipher(text: string, shift: number): string {
  return [...text].map((c) => (c === " " ? " " : ALPHA[(ALPHA.indexOf(c) + shift) % 26])).join("");
}

/** A random substitution with no letter mapping to itself. */
function derangement(rng: RNG): string[] {
  const letters = [...ALPHA];
  for (let tries = 0; tries < 200; tries++) {
    const s = [...letters];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    if (s.every((c, i) => c !== letters[i])) return s;
  }
  return letters.map((_, i) => letters[(i + 7) % 26]);
}

export function generateCryptogram(text: string, band: AgeBand, rng: RNG): Cryptogram {
  if (band === "4-6") {
    return {
      lines: [
        numberCode(text),
        "A1 B2 C3 D4 E5 F6 G7 H8 I9",
        "J10 K11 L12 M13 N14 O15 P16 Q17 R18",
        "S19 T20 U21 V22 W23 X24 Y25 Z26",
      ],
      answer: text,
    };
  }
  if (band === "7-9") {
    const shift = randInt(rng, 1, 25);
    const enc = shiftCipher(text, shift);
    return {
      lines: [
        "SECRET MESSAGE: each letter slid the same number of steps along the alphabet.",
        enc,
        `Clue: A = ${ALPHA[shift]}.  Work out the rest and decode it.`,
      ],
      answer: text,
    };
  }
  const map = derangement(rng);
  const enc = [...text].map((c) => (c === " " ? " " : map[ALPHA.indexOf(c)])).join("");
  // Reveal two of the most common letters in the message.
  const counts = new Map<string, number>();
  for (const c of text) if (c !== " ") counts.set(c, (counts.get(c) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([c]) => c);
  const reveals = top.map((c) => `${map[ALPHA.indexOf(c)]} = ${c}`).join(", ");
  return {
    lines: [
      "CRYPTOGRAM: each letter stands for a different letter. Crack the code!",
      enc,
      `Letters given:  ${reveals}`,
    ],
    answer: text,
  };
}
