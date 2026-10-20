// Interlock stats: how many other words each word crosses. Run with node --experimental-strip-types.
import { buildCrossword, crosswordConfigForDifficulty, validateCrossword, type CrosswordData } from "../src/lib/puzzles/crossword.ts";
import { CROSSWORD_46 } from "../src/lib/content/bank/crossword-46.ts";
import { CROSSWORD_79 } from "../src/lib/content/bank/crossword-79.ts";
import { CROSSWORD_1012 } from "../src/lib/content/bank/crossword-1012.ts";
function mulberry32(a: number) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function crossingsPerWord(cw: CrosswordData): number[] {
  const owner = new Map<string, number>();
  const counts = cw.words.map(() => 0);
  cw.words.forEach((w, i) => { for (let k = 0; k < w.word.length; k++) { const key = `${w.row + (w.dir === "down" ? k : 0)},${w.col + (w.dir === "across" ? k : 0)}`; if (owner.has(key)) { counts[i]++; counts[owner.get(key)!]++; } else owner.set(key, i); } });
  return counts;
}
const bands = [["4-6", CROSSWORD_46, 5], ["7-9", CROSSWORD_79, 9], ["10-12", CROSSWORD_1012, 15]] as const;
let invalid = 0;
for (const [band, themes, d] of bands) {
  let words = 0, single = 0, cross = 0, totalMs = 0, short = 0; const n = 200;
  const cfg = crosswordConfigForDifficulty(d);
  for (let s = 0; s < n; s++) {
    const rng = mulberry32(s * 7919 + d); const t = themes[s % themes.length];
    const t0 = performance.now(); const cw = buildCrossword(rng, t.theme, t.entries, cfg)!; totalMs += performance.now() - t0;
    if (validateCrossword(cw).length) invalid++;
    if (cw.words.length < cfg.target) short++;
    const c = crossingsPerWord(cw); words += c.length; single += c.filter((x) => x <= 1).length; cross += c.reduce((a, b) => a + b, 0);
  }
  console.log(`${band.padEnd(5)} dial ${String(d).padStart(2)} (target ${cfg.target}): avg crossings/word ${(cross / words).toFixed(2)} | words with only 1 crossing ${(100 * single / words).toFixed(0)}% | short of target ${short}/${n} | ${(totalMs / n).toFixed(0)}ms`);
}
console.log("invalid:", invalid);
