// Generates many crosswords across difficulties and checks each with the
// independent validator. Run: node --experimental-strip-types scripts/verify-crossword.ts
import { buildCrossword, crosswordConfigForDifficulty, validateCrossword, crosswordToSvg } from "../src/lib/puzzles/crossword.ts";

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Theme = { theme: string; entries: { word: string; clue: string }[] };
const banks: Theme[][] = [];
for (const f of ["crossword-46", "crossword-79", "crossword-1012"]) {
  try {
    const m = await import(`../src/lib/content/bank/${f}.ts`);
    banks.push(Object.values(m)[0] as Theme[]);
  } catch { /* not written yet */ }
}
let themes: Theme[] = banks.flat();
if (!themes.length) {
  // Stand-in until the clue banks exist: word-find themes with dummy clues.
  for (const f of ["wordfind-46", "wordfind-79", "wordfind-1012"]) {
    const m = await import(`../src/lib/content/bank/${f}.ts`);
    for (const t of Object.values(m)[0] as { theme: string; words: string[] }[])
      themes.push({ theme: t.theme, entries: t.words.map((w) => ({ word: w, clue: "x" })) });
  }
  console.log("(using word-find themes as stand-in words)");
}

let bad = 0, total = 0, fails = 0;
const byD: Record<number, { words: number[]; sizes: string[]; ms: number[] }> = {};
for (const d of [1, 3, 5, 7, 9, 11, 14, 17, 20]) {
  byD[d] = { words: [], sizes: [], ms: [] };
  for (let s = 0; s < 120; s++) {
    const rng = mulberry32(s * 7919 + d);
    const t = themes[Math.floor(rng() * themes.length)];
    const cfg = crosswordConfigForDifficulty(d);
    const t0 = performance.now();
    const cw = buildCrossword(rng, t.theme, t.entries, cfg);
    byD[d].ms.push(performance.now() - t0);
    total++;
    if (!cw) { fails++; continue; }
    const p = validateCrossword(cw);
    if (p.length) { bad++; if (bad < 5) console.log("INVALID", t.theme, p.slice(0, 3)); }
    byD[d].words.push(cw.words.length);
    byD[d].sizes.push(`${cw.cols}x${cw.rows}`);
  }
}
for (const [d, v] of Object.entries(byD)) {
  const cfg = crosswordConfigForDifficulty(Number(d));
  const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(1);
  const max = Math.max(...v.ms).toFixed(0);
  console.log(`dial ${d.padStart(2)}: target ${cfg.target} in ≤${cfg.maxSize}² → avg ${avg(v.words)} words (min ${Math.min(...v.words)}), avg ${avg(v.ms)}ms, max ${max}ms, e.g. ${v.sizes.slice(0, 4).join(" ")}`);
}
console.log(`${total} built, ${fails} returned null, ${bad} INVALID`);
// one sample, printed as text
const rng = mulberry32(42); const t = themes[3];
const cw = buildCrossword(rng, t.theme, t.entries, crosswordConfigForDifficulty(9))!;
console.log(`\nSample "${t.theme}":`); for (const row of cw.grid) console.log("  " + row.map((c) => c ?? "·").join(" "));
for (const w of cw.words) console.log(`  ${w.num} ${w.dir.padEnd(6)} ${w.word}`);
void crosswordToSvg;
