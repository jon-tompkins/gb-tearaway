// Sanity-check the sequence generator at every dial level:
//   npx tsx scripts/verify-sequence.ts [samplesPerLevel]
import { generateSequence } from "../src/lib/puzzles/sequence";

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const isArith = (t: number[]) => t.every((x, i) => i < 2 || x - t[i - 1] === t[1] - t[0]);
const isGeom = (t: number[]) => t[0] !== 0 && t.every((x, i) => i < 2 || x * t[0] === t[i - 1] * t[1]);

const N = Number(process.argv[2] ?? 2000);
let bad = 0;
for (let d = 1; d <= 20; d++) {
  const rng = mulberry32(d * 7919);
  let maxV = 0, simple = 0, maxLen = 0;
  const samples: string[] = [];
  for (let i = 0; i < N; i++) {
    const p = generateSequence(rng, d);
    const all = [...p.terms, p.answer];
    const line = `${p.terms.join(", ")}, __`;
    maxLen = Math.max(maxLen, line.length);
    for (const x of all) {
      if (!Number.isInteger(x) || x < 0) { bad++; console.log("BAD value", d, all, p.ruleLabel); break; }
    }
    maxV = Math.max(maxV, ...all);
    if (isArith(all) || isGeom(all)) simple++;
    if (samples.length < 4 && !samples.some((s) => s.includes(p.ruleLabel))) samples.push(`${line}  → ${p.answer}  (${p.ruleLabel})`);
  }
  const simplePct = Math.round((simple / N) * 100);
  if (d >= 13 && simple > 0) { bad++; console.log(`level ${d}: ${simple} plain add/multiply puzzles`); }
  if (maxV > 99999) { bad++; console.log(`level ${d}: value too big ${maxV}`); }
  console.log(`\nlevel ${d}  (plain add/×: ${simplePct}%, max ${maxV}, longest line ${maxLen} chars)`);
  for (const s of samples) console.log("   " + s);
}
console.log(bad ? `\n${bad} problems` : "\nall good");
process.exit(bad ? 1 : 0);
