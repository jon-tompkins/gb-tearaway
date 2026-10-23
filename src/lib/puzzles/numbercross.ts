import type { AgeBand } from "../types";
import { buildCrossword, type CrosswordData, type CrosswordEntry } from "./crossword";

/**
 * Number Cross: a criss-cross where every answer is a NUMBER and every clue is
 * a little calculation. It reuses the crossword layout engine by encoding the
 * digits 0–9 as the letters A–J, then decoding the finished grid back.
 * Each clue has exactly one numeric answer, so crossings only have to agree
 * digit-for-digit. Answers go to the in-app key / QR page, never on paper.
 */
type RNG = () => number;
type Gen = (rng: RNG) => { n: number; clue: string };

const int = (rng: RNG, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T,>(rng: RNG, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];

// ── Clue families (each returns an answer of 2+ digits) ──────────────────────
const addSmall: Gen = (r) => { const a = int(r, 4, 14), b = int(r, 4, 14); return { n: a + b, clue: `${a} + ${b}` }; };
const subSmall: Gen = (r) => { const b = int(r, 2, 8), n = int(r, 10, 20); return { n, clue: `${n + b} − ${b}` }; };
const doubleIt: Gen = (r) => { const k = int(r, 5, 40); return { n: k * 2, clue: `Double ${k}` }; };
const halfIt: Gen = (r) => { const n = int(r, 10, 60); return { n, clue: `Half of ${n * 2}` }; };
const legs: Gen = (r) => { const k = int(r, 2, 9); return { n: k * 8, clue: `Legs on ${k} spiders` }; };
const eggs: Gen = (r) => { const k = int(r, 1, 9); return { n: k * 12, clue: `Eggs in ${k === 1 ? "a" : k} dozen`.replace("1 dozen", "a dozen") }; };
const skip: Gen = (r) => { const s = pick(r, [5, 10]); const st = int(r, 2, 4); return { n: s * (st + 1), clue: `${s}, ${s * 2}${st > 1 ? `, ${s * 3}` : ""}, … what comes ${st > 1 ? "4th" : "3rd"}?`.replace("what comes 4th", "4th").replace("what comes 3rd", "3rd") }; };
const times: Gen = (r) => { const a = int(r, 3, 12), b = int(r, 3, 12); return { n: a * b, clue: `${a} × ${b}` }; };
const addBig: Gen = (r) => { const a = int(r, 20, 79), b = int(r, 15, 60); return { n: a + b, clue: `${a} + ${b}` }; };
const subBig: Gen = (r) => { const b = int(r, 15, 60), n = int(r, 12, 70); return { n, clue: `${n + b} − ${b}` }; };
const weeks: Gen = (r) => { const k = int(r, 2, 30); return { n: k * 7, clue: `Days in ${k} weeks` }; };
const hours: Gen = (r) => { const k = int(r, 2, 9); return { n: k * 60, clue: `Minutes in ${k} hours` }; };
const dollars: Gen = (r) => { const k = int(r, 2, 40); return { n: k * 100, clue: `Cents in $${k}` }; };
const hexes: Gen = (r) => { const k = int(r, 3, 12); return { n: k * 6, clue: `Sides on ${k} hexagons` }; };
const triples: Gen = (r) => { const k = int(r, 4, 33); return { n: k * 3, clue: `Triple ${k}` }; };
const square: Gen = (r) => { const k = int(r, 5, 25); return { n: k * k, clue: `${k} squared` }; };
const cube: Gen = (r) => { const k = int(r, 3, 9); return { n: k ** 3, clue: `${k} cubed` }; };
const root: Gen = (r) => { const k = int(r, 10, 25); return { n: k, clue: `Square root of ${k * k}` }; };
const percent: Gen = (r) => { const p = pick(r, [10, 20, 25, 50, 75]); const base = pick(r, [40, 60, 80, 120, 160, 200, 240, 400]); return { n: (p * base) / 100, clue: `${p}% of ${base}` }; };
const timesBig: Gen = (r) => { const a = int(r, 12, 25), b = int(r, 3, 9); return { n: a * b, clue: `${a} × ${b}` }; };
const perim: Gen = (r) => { const w = int(r, 6, 30), h = int(r, 5, 25); return { n: 2 * (w + h), clue: `Perimeter of a ${w} by ${h} rectangle` }; };
const area: Gen = (r) => { const w = int(r, 8, 25), h = int(r, 6, 20); return { n: w * h, clue: `Area of a ${w} by ${h} rectangle` }; };
const secs: Gen = (r) => { const k = int(r, 2, 15); return { n: k * 60, clue: `Seconds in ${k} minutes` }; };
const countdown: Gen = (r) => { const n = int(r, 11, 99); return { n, clue: `1000 − ${1000 - n}` }; };
const FIXED: { n: number; clue: string }[] = [
  { n: 180, clue: "Degrees in a triangle" }, { n: 360, clue: "Degrees in a circle" },
  { n: 365, clue: "Days in a normal year" }, { n: 52, clue: "Weeks in a year" },
  { n: 24, clue: "Hours in a day" }, { n: 12, clue: "Months in a year" },
  { n: 26, clue: "Letters in the alphabet" }, { n: 88, clue: "Keys on a piano" },
  { n: 50, clue: "States in the USA" }, { n: 206, clue: "Bones in an adult body" },
  { n: 100, clue: "Years in a century" }, { n: 1000, clue: "Meters in a kilometer" },
];
const fixed: Gen = (r) => pick(r, FIXED);

const FAMILIES: Record<AgeBand, Gen[]> = {
  "4-6": [addSmall, addSmall, subSmall, doubleIt, halfIt, legs, eggs, skip],
  "7-9": [times, times, addBig, subBig, halfIt, weeks, hours, dollars, hexes, triples, fixed],
  "10-12": [square, cube, root, percent, timesBig, timesBig, perim, area, secs, countdown, times, fixed],
};

const enc = (n: number) => [...String(n)].map((d) => "ABCDEFGHIJ"[+d]).join("");
const dec = (s: string) => [...s].map((c) => "ABCDEFGHIJ".indexOf(c)).join("");

/** A pool of ~60 distinct (number → clue) entries for the age band, sized for the grid. */
function pool(band: AgeBand, rng: RNG, maxDigits: number): CrosswordEntry[] {
  const byNum = new Map<number, string>();
  const fams = FAMILIES[band];
  for (let i = 0; i < 600 && byNum.size < 70; i++) {
    const { n, clue } = pick(rng, fams)(rng);
    if (!Number.isInteger(n) || n < 10 || String(n).length > maxDigits || byNum.has(n)) continue;
    byNum.set(n, clue);
  }
  return [...byNum.entries()].map(([n, clue]) => ({ word: enc(n), clue }));
}

export interface NumberCross {
  cw: CrosswordData;
}

/** Build a number cross, or null if no good layout was found. */
export function buildNumberCross(rng: RNG, band: AgeBand, card: "half" | "full" | "double"): NumberCross | null {
  const target = card === "double" ? 10 : card === "full" ? 6 : 4;
  const maxSize = card === "double" ? 10 : 8;
  const maxDigits = band === "4-6" ? 2 : band === "7-9" ? 3 : 4;
  let best: CrosswordData | null = null;
  for (let t = 0; t < 8; t++) {
    const cw = buildCrossword(rng, "Numbers", pool(band, rng, maxDigits), { target, maxSize, attempts: 300 });
    if (cw && (!best || cw.words.length > best.words.length)) best = cw;
    if (best && best.words.length >= target) break;
  }
  if (!best) return null;
  const grid = best.grid.map((row) => row.map((ch) => (ch ? dec(ch) : null)));
  const words = best.words.map((w) => ({ ...w, word: dec(w.word) }));
  return { cw: { ...best, grid, words } };
}
