import { clampDifficulty } from "../difficulty";

/**
 * A number-sequence puzzle: show the first terms, ask for the next one.
 * Fully procedural and seeded, so it scales smoothly with difficulty and needs
 * no content bank. The answer + rule are shown only in the app (Parent key).
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

function randInt(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateSequence(rng: RNG, difficulty: number): SequencePuzzle {
  const d = clampDifficulty(difficulty);
  const shown = 4;

  // Arithmetic: add a constant step.
  const arithmetic = (): SequencePuzzle => {
    const step = randInt(rng, 1, d <= 6 ? 5 : d <= 13 ? 9 : 15);
    const start = randInt(rng, 0, d <= 6 ? 6 : 20);
    const terms = Array.from({ length: shown + 1 }, (_, i) => start + step * i);
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: `add ${step} each time` };
  };
  // Geometric: multiply by a constant ratio.
  const geometric = (): SequencePuzzle => {
    const ratio = d <= 13 ? 2 : randInt(rng, 2, 3);
    const start = randInt(rng, 1, 4);
    const terms = Array.from({ length: shown + 1 }, (_, i) => start * ratio ** i);
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: `multiply by ${ratio}` };
  };
  // Triangular: the step grows by one each time (+1, +2, +3 …).
  const triangular = (): SequencePuzzle => {
    let cur = randInt(rng, 1, 6);
    const terms = [cur];
    for (let i = 1; i <= shown; i++) {
      cur += i;
      terms.push(cur);
    }
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: "add one more each step" };
  };
  // Fibonacci-like: each term is the sum of the two before it.
  const fib = (): SequencePuzzle => {
    let a = randInt(rng, 1, 4);
    let b = randInt(rng, 2, 5);
    const terms = [a, b];
    while (terms.length <= shown) {
      const n = a + b;
      terms.push(n);
      a = b;
      b = n;
    }
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: "add the two before it" };
  };
  // Perfect squares: 1, 4, 9, 16 …
  const squares = (): SequencePuzzle => {
    const start = randInt(rng, 1, 3);
    const terms = Array.from({ length: shown + 1 }, (_, i) => (start + i) ** 2);
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: "square numbers" };
  };
  // Countdown: subtract a constant step (kept non-negative).
  const subtract = (): SequencePuzzle => {
    const step = randInt(rng, 1, d <= 6 ? 5 : 9);
    const start = step * shown + randInt(rng, 0, 8);
    const terms = Array.from({ length: shown + 1 }, (_, i) => start - step * i);
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: `subtract ${step} each time` };
  };
  // Alternating: +a then −b, repeating (e.g. +5, −2, +5, −2 …).
  const alternating = (): SequencePuzzle => {
    const a = randInt(rng, 3, 9);
    const b = randInt(rng, 1, a - 1);
    let cur = randInt(rng, 5, 15);
    const terms = [cur];
    for (let i = 1; i <= shown; i++) {
      cur += i % 2 === 1 ? a : -b;
      terms.push(cur);
    }
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: `add ${a}, then subtract ${b}, over and over` };
  };
  // Prime numbers: 2, 3, 5, 7, 11 …
  const primes = (): SequencePuzzle => {
    const P = [
      2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
      101, 103, 107, 109, 113,
    ];
    const start = randInt(rng, 0, P.length - (shown + 2));
    const terms = P.slice(start, start + shown);
    return { terms, answer: P[start + shown], ruleLabel: "prime numbers (only divisible by 1 and themselves)" };
  };
  // Cubes: 1, 8, 27, 64 …
  const cubes = (): SequencePuzzle => {
    const start = randInt(rng, 1, 2);
    const terms = Array.from({ length: shown + 1 }, (_, i) => (start + i) ** 3);
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: "cube numbers (n × n × n)" };
  };
  // Recurrence: each term is the one before, times m, plus c.
  const mulAdd = (): SequencePuzzle => {
    const m = 2;
    const c = randInt(rng, 1, 3);
    let cur = randInt(rng, 1, 3);
    const terms = [cur];
    for (let i = 1; i <= shown; i++) {
      cur = cur * m + c;
      terms.push(cur);
    }
    return { terms: terms.slice(0, shown), answer: terms[shown], ruleLabel: `double it, then add ${c}` };
  };

  const pool: Array<() => SequencePuzzle> =
    d <= 6
      ? [arithmetic, arithmetic, triangular, subtract]
      : d <= 13
        ? [arithmetic, geometric, triangular, squares, subtract, alternating]
        : [geometric, fib, squares, triangular, primes, cubes, mulAdd, alternating];

  return pool[Math.floor(rng() * pool.length)]();
}
