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

  const pool: Array<() => SequencePuzzle> =
    d <= 6
      ? [arithmetic, arithmetic, triangular]
      : d <= 13
        ? [arithmetic, geometric, triangular, squares]
        : [geometric, fib, squares, triangular, arithmetic];

  return pool[Math.floor(rng() * pool.length)]();
}
