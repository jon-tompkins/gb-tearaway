import { clampDifficulty } from "../difficulty";

/**
 * A number-sequence puzzle: show the first terms, ask for the next one.
 * Fully procedural and seeded. The dial (1 ≈ kindergarten … 20 ≈ adult) picks
 * a tier of rule families AND scales the numbers inside each family, so a
 * high level never produces a "1, 2, 4, 8" warm-up. Harder rules show more
 * terms so the answer stays unambiguous. The answer + rule are shown only in
 * the app (Parent key).
 */
export interface SequencePuzzle {
  /** The terms shown on paper (a blank follows). */
  terms: number[];
  /** The next term — the answer. */
  answer: number;
  /** Plain-language rule, shown in the app only. */
  ruleLabel: string;
}

type RNG = () => number;
type Family = (rng: RNG) => SequencePuzzle;

function randInt(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
function pick<T>(rng: RNG, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)];
}

/** Build a puzzle from a full term list: all but the last are shown. */
function fromTerms(all: number[], ruleLabel: string): SequencePuzzle {
  return { terms: all.slice(0, -1), answer: all[all.length - 1], ruleLabel };
}

/** Sequence where term i+1 = f(term i, i). `count` = shown terms + answer. */
function iterate(start: number, count: number, f: (x: number, i: number) => number): number[] {
  const out = [start];
  while (out.length < count) out.push(f(out[out.length - 1], out.length - 1));
  return out;
}

const PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
  101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199,
];

// ── Rule families ────────────────────────────────────────────────────────────
// Each takes the rng and returns a full puzzle. Parameters are chosen per tier
// below so the same family can be gentle or nasty.

const add = (stepMin: number, stepMax: number, startMax: number, shown = 4): Family => (rng) => {
  const step = randInt(rng, stepMin, stepMax);
  const start = randInt(rng, 0, startMax);
  return fromTerms(iterate(start, shown + 1, (x) => x + step), `add ${step} each time`);
};

const subtract = (stepMin: number, stepMax: number, shown = 4): Family => (rng) => {
  const step = randInt(rng, stepMin, stepMax);
  const start = step * shown + randInt(rng, 0, step * 3);
  return fromTerms(iterate(start, shown + 1, (x) => x - step), `subtract ${step} each time`);
};

/** Step grows by `grow` each time: +s, +s+g, +s+2g … */
const growingStep = (sMin: number, sMax: number, gMin: number, gMax: number, startMax: number, shown = 5): Family =>
  (rng) => {
    const s = randInt(rng, sMin, sMax);
    const g = randInt(rng, gMin, gMax);
    const start = randInt(rng, 1, startMax);
    const all = iterate(start, shown + 1, (x, i) => x + s + g * i);
    return fromTerms(all, g === 1 ? `add ${s}, then one more each step (+${s}, +${s + 1}, +${s + 2}…)` : `the jump grows by ${g} each time (+${s}, +${s + g}, +${s + 2 * g}…)`);
  };

const multiply = (rMin: number, rMax: number, startMin: number, startMax: number, shown = 4): Family => (rng) => {
  const r = randInt(rng, rMin, rMax);
  const start = randInt(rng, startMin, startMax);
  return fromTerms(iterate(start, shown + 1, (x) => x * r), `multiply by ${r}`);
};

/** Halve (or ÷3) down from a number built to divide evenly. */
const divide = (r: number, shown = 4): Family => (rng) => {
  const tail = randInt(rng, 1, 9);
  const start = tail * r ** shown;
  return fromTerms(iterate(start, shown + 1, (x) => x / r), `divide by ${r}`);
};

const squares = (startMin: number, startMax: number, offsetMax = 0, shown = 4): Family => (rng) => {
  const n0 = randInt(rng, startMin, startMax);
  const k = offsetMax ? pick(rng, [-1, 1]) * randInt(rng, 1, offsetMax) : 0;
  const all = Array.from({ length: shown + 1 }, (_, i) => (n0 + i) ** 2 + k);
  const label = k === 0 ? "square numbers (n × n)" : `square numbers ${k > 0 ? "plus" : "minus"} ${Math.abs(k)}`;
  return fromTerms(all, label);
};

const cubes = (startMin: number, startMax: number, shown = 4): Family => (rng) => {
  const n0 = randInt(rng, startMin, startMax);
  return fromTerms(Array.from({ length: shown + 1 }, (_, i) => (n0 + i) ** 3), "cube numbers (n × n × n)");
};

const fibLike = (aMax: number, bMax: number, shown = 5): Family => (rng) => {
  const a = randInt(rng, 1, aMax);
  const b = randInt(rng, a + 1, Math.max(a + 2, bMax));
  const all = [a, b];
  while (all.length < shown + 1) all.push(all[all.length - 1] + all[all.length - 2]);
  return fromTerms(all, "add the two numbers before it");
};

const tribonacci = (shown = 6): Family => (rng) => {
  const all = [randInt(rng, 1, 3), randInt(rng, 1, 4), randInt(rng, 2, 6)];
  while (all.length < shown + 1) all.push(all[all.length - 1] + all[all.length - 2] + all[all.length - 3]);
  return fromTerms(all, "add the three numbers before it");
};

/** +a, −b, +a, −b … */
const alternating = (aMin: number, aMax: number, shown = 6): Family => (rng) => {
  const a = randInt(rng, aMin, aMax);
  const b = randInt(rng, 1, a - 1);
  const start = randInt(rng, 5, 30);
  return fromTerms(iterate(start, shown + 1, (x, i) => (i % 2 === 0 ? x + a : x - b)), `add ${a}, then subtract ${b}, over and over`);
};

/** ×m, +c alternating (e.g. ×2, +3, ×2, +3 …). */
const alternatingOps = (shown = 6): Family => (rng) => {
  const m = randInt(rng, 2, 3);
  const c = randInt(rng, 1, 6);
  const start = randInt(rng, 1, 5);
  return fromTerms(iterate(start, shown + 1, (x, i) => (i % 2 === 0 ? x * m : x + c)), `multiply by ${m}, then add ${c}, over and over`);
};

/** x → m·x + c (c may be negative). */
const affine = (mMin: number, mMax: number, cMax: number, shown = 5): Family => (rng) => {
  const m = randInt(rng, mMin, mMax);
  let c = randInt(rng, 1, cMax) * pick(rng, [1, -1]);
  const start = randInt(rng, 2, 6);
  if (start * m + c <= start) c = Math.abs(c); // keep it growing and positive
  const word = m === 2 ? "double it" : m === 3 ? "triple it" : `multiply by ${m}`;
  return fromTerms(iterate(start, shown + 1, (x) => x * m + c), `${word}, then ${c > 0 ? "add" : "subtract"} ${Math.abs(c)}`);
};

/** Multiplier climbs: ×2, ×3, ×4 … (or ×1, ×2, ×3 — factorial-style). */
const growingMultiplier = (shown = 5): Family => (rng) => {
  const m0 = randInt(rng, 1, 2);
  const start = randInt(rng, 1, 3);
  const all = iterate(start, shown + 1, (x, i) => x * (m0 + i));
  return fromTerms(all, `multiply by ${m0}, then ${m0 + 1}, then ${m0 + 2}… (one more each time)`);
};

/** Two sequences woven together: odd positions follow one rule, even another. */
const interleaved = (hard: boolean, shown = 7): Family => (rng) => {
  const s1 = randInt(rng, 2, 9);
  const a0 = randInt(rng, 1, 20);
  const b0 = randInt(rng, 2, 6);
  const r = hard ? randInt(rng, 2, 3) : 0;
  const s2 = randInt(rng, 2, 9);
  const all: number[] = [];
  let a = a0;
  let b = hard ? b0 : randInt(rng, 30, 60);
  for (let i = 0; i <= shown; i++) {
    if (i % 2 === 0) {
      all.push(a);
      a += s1;
    } else {
      all.push(b);
      b = hard ? b * r : b - s2;
    }
  }
  const second = hard ? `multiply by ${r}` : `subtract ${s2}`;
  return fromTerms(all, `two patterns woven together: every other number adds ${s1}; the ones between ${second}`);
};

/** The jumps themselves double: +d, +2d, +4d, +8d … */
const doublingGaps = (shown = 5): Family => (rng) => {
  const dd = randInt(rng, 1, 5);
  const start = randInt(rng, 1, 20);
  return fromTerms(iterate(start, shown + 1, (x, i) => x + dd * 2 ** i), `the jump doubles each time (+${dd}, +${dd * 2}, +${dd * 4}…)`);
};

/** The jumps are square numbers: +1, +4, +9, +16 … (or starting later). */
const squareGaps = (shown = 5): Family => (rng) => {
  const k0 = randInt(rng, 1, 3);
  const start = randInt(rng, 1, 15);
  return fromTerms(iterate(start, shown + 1, (x, i) => x + (k0 + i) ** 2), `the jumps are square numbers (+${k0 ** 2}, +${(k0 + 1) ** 2}, +${(k0 + 2) ** 2}…)`);
};

/** The jumps are primes: +2, +3, +5, +7, +11 … */
const primeGaps = (shown = 5): Family => (rng) => {
  const p0 = randInt(rng, 0, 2);
  const start = randInt(rng, 1, 20);
  return fromTerms(iterate(start, shown + 1, (x, i) => x + PRIMES[p0 + i]), `the jumps are prime numbers (+${PRIMES[p0]}, +${PRIMES[p0 + 1]}, +${PRIMES[p0 + 2]}…)`);
};

/** The jumps follow Fibonacci: +1, +1, +2, +3, +5 … */
const fibGaps = (shown = 6): Family => (rng) => {
  const g = [randInt(rng, 1, 2), randInt(rng, 2, 3)];
  while (g.length < shown) g.push(g[g.length - 1] + g[g.length - 2]);
  const start = randInt(rng, 1, 15);
  return fromTerms(iterate(start, shown + 1, (x, i) => x + g[i]), `each jump is the two jumps before it added (+${g[0]}, +${g[1]}, +${g[2]}, +${g[3]}…)`);
};

const primes = (fromIdx: number, toIdx: number, shown = 5): Family => (rng) => {
  const i0 = randInt(rng, fromIdx, toIdx);
  return fromTerms(PRIMES.slice(i0, i0 + shown + 1), "prime numbers (only divisible by 1 and themselves)");
};

/** Primes squared or primes ×2 / +1 — a prime pattern in disguise. */
const disguisedPrimes = (shown = 5): Family => (rng) => {
  const i0 = randInt(rng, 0, 3);
  const ps = PRIMES.slice(i0, i0 + shown + 1);
  const kind = randInt(rng, 0, 2);
  if (kind === 0) return fromTerms(ps.map((p) => p * p), "prime numbers, squared (2², 3², 5², 7²…)");
  if (kind === 1) return fromTerms(ps.map((p) => p * 2), "prime numbers, doubled");
  return fromTerms(ps.map((p) => p - 1), "one less than each prime number");
};

/** n² + n, n³ − n, n(n+1)/2 — polynomial patterns. */
const polynomial = (shown = 5): Family => (rng) => {
  const n0 = randInt(rng, 1, 4);
  const kind = randInt(rng, 0, 2);
  const ns = Array.from({ length: shown + 1 }, (_, i) => n0 + i);
  if (kind === 0) return fromTerms(ns.map((n) => n * n + n), "n × n + n  (or n × (n + 1))");
  if (kind === 1) return fromTerms(ns.map((n) => n ** 3 - n), "n × n × n − n");
  return fromTerms(ns.map((n) => 2 ** n + n), "2 to the power n, plus n");
};

// ── Tiers ────────────────────────────────────────────────────────────────────
// 1 ≈ kindergarten … 20 ≈ adult. Each tier lists families with tier-sized
// parameters; numbers grow and rules stack as the dial climbs.

function familiesFor(d: number): Family[] {
  if (d <= 2) return [add(1, 2, 5), add(1, 2, 5), add(5, 5, 0), add(10, 10, 0)];
  if (d <= 4) return [add(2, 5, 10), add(2, 5, 10), subtract(1, 3), add(10, 10, 20)];
  if (d <= 6) return [add(3, 9, 20), subtract(2, 5), growingStep(1, 1, 1, 1, 5, 4), multiply(2, 2, 1, 3)];
  if (d <= 8) return [add(6, 12, 40), subtract(3, 9), growingStep(1, 3, 1, 1, 10, 4), multiply(2, 2, 2, 5), squares(1, 3)];
  if (d <= 10)
    return [add(11, 25, 60), subtract(6, 15), growingStep(2, 5, 1, 2, 15), multiply(2, 3, 2, 6), squares(2, 6), alternating(3, 9), fibLike(3, 5)];
  if (d <= 12)
    return [growingStep(2, 6, 2, 3, 20), multiply(3, 4, 2, 7), divide(2), squares(3, 9, 0, 5), alternating(5, 15), fibLike(4, 8), primes(0, 5), cubes(1, 2)];
  if (d <= 14)
    return [squares(3, 8, 3, 5), fibLike(5, 12), affine(2, 2, 5), alternatingOps(), interleaved(false), primes(4, 15), cubes(2, 4), doublingGaps()];
  if (d <= 16)
    return [affine(2, 3, 7), alternatingOps(), interleaved(true), squareGaps(), doublingGaps(), primeGaps(), primes(10, 30), tribonacci(), growingMultiplier(), polynomial()];
  if (d <= 18)
    return [affine(3, 3, 9), interleaved(true), squareGaps(), primeGaps(), fibGaps(), tribonacci(), growingMultiplier(), polynomial(), disguisedPrimes()];
  return [fibGaps(), primeGaps(), polynomial(), disguisedPrimes(), interleaved(true), growingMultiplier(), affine(3, 4, 9, 5), squareGaps()];
}

/** Constant gap or constant ratio — the patterns any kid spots first. */
function isPlain(all: number[]): boolean {
  const arith = all.every((x, i) => i < 2 || x - all[i - 1] === all[1] - all[0]);
  const geom = all[0] !== 0 && all.every((x, i) => i < 2 || x * all[0] === all[i - 1] * all[1]);
  return arith || geom;
}

export function generateSequence(rng: RNG, difficulty: number): SequencePuzzle {
  const d = clampDifficulty(difficulty);
  const families = familiesFor(d);
  // From 13 up, never print a plain add/multiply pattern — some families can
  // collapse into one by chance (e.g. two woven sequences that line up).
  for (let tries = 0; ; tries++) {
    const puz = pick(rng, families)(rng);
    if (d < 13 || tries >= 30 || !isPlain([...puz.terms, puz.answer])) return puz;
  }
}
