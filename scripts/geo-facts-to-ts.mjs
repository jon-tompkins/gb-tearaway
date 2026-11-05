import { readFileSync, writeFileSync } from "node:fs";
const bank = JSON.parse(readFileSync("scripts/geo-facts.json", "utf8"));
const out = Object.fromEntries(Object.entries(bank).sort().map(([k, v]) => [k, v.fact]));
const p = "src/lib/puzzles/geo-facts.ts";
const s = readFileSync(p, "utf8");
writeFileSync(p, s.replace(/export const GEO_FACTS[^;]*;/s, `export const GEO_FACTS: Record<string, string> = ${JSON.stringify(out, null, 2)};`));
console.log(Object.keys(out).length, "facts written");
