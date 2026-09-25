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
let noShipClue = 0;
const revealCounts: Record<number, number[]> = {};
const shipShare: Record<number, number[]> = {};
const t0 = Date.now();

for (const d of difficulties) {
  revealCounts[d] = [];
  shipShare[d] = [];
  for (let i = 0; i < perDiff; i++) {
    const rng = mulberry32(1000 * d + i + 1);
    const puz = generateBattleship(rng, d);
    validateBattleship(puz); // throws if invalid or not unique
    const vals = Object.values(puz.reveal);
    const ship = vals.filter((v) => v !== "water").length;
    if (ship === 0) noShipClue++;
    revealCounts[d].push(vals.length);
    shipShare[d].push(ship);
    ok++;
  }
}

const ms = Date.now() - t0;
console.log(`✓ ${ok} puzzles generated + validated (unique) in ${ms}ms`);
console.log(`  puzzles with zero ship-part clues: ${noShipClue}`);
for (const d of difficulties) {
  const rc = revealCounts[d];
  const sh = shipShare[d];
  const avg = (rc.reduce((a, b) => a + b, 0) / rc.length).toFixed(1);
  const savg = (sh.reduce((a, b) => a + b, 0) / sh.length).toFixed(1);
  console.log(`  d=${String(d).padStart(2)}  reveals avg ${avg} (ship ${savg} / water ${(Number(avg) - Number(savg)).toFixed(1)})`);
}
