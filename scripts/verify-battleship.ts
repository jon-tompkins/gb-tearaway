/**
 * Validation harness for the Battleship Solitaire generator.
 * Run: node --experimental-strip-types scripts/verify-battleship.ts
 * Generates many puzzles across the difficulty range and asserts each is a
 * valid, uniquely-solvable instance (throws on the first bad one).
 */
import { generateBattleship, validateBattleship } from "../src/lib/puzzles/battleship.ts";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const difficulties = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const perDiff = 25;
let ok = 0;
const revealCounts: Record<number, number[]> = {};
const t0 = Date.now();

for (const d of difficulties) {
  revealCounts[d] = [];
  for (let i = 0; i < perDiff; i++) {
    const rng = mulberry32(1000 * d + i + 1);
    const puz = generateBattleship(rng, d);
    validateBattleship(puz); // throws if invalid or not unique
    revealCounts[d].push(Object.keys(puz.reveal).length);
    ok++;
  }
}

const ms = Date.now() - t0;
console.log(`✓ ${ok} puzzles generated + validated (unique) in ${ms}ms`);
for (const d of difficulties) {
  const rc = revealCounts[d];
  const avg = (rc.reduce((a, b) => a + b, 0) / rc.length).toFixed(1);
  console.log(`  d=${String(d).padStart(2)}  reveals avg ${avg}  (min ${Math.min(...rc)}, max ${Math.max(...rc)})`);
}
