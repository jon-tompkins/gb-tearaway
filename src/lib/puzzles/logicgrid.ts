import type { AgeBand } from "../types";

/**
 * Logic Grid: N kids each own exactly one item (pets, lunches, sports…). Clues
 * narrow it down; the kid fills a name × item grid with ✗ and ✓. A solver counts
 * every consistent assignment, so each puzzle is guaranteed to have exactly one
 * answer, and clues are pruned to a minimal set. 7–9 → 3×3 with ~3 clues,
 * 10–12 → 4×4 with ~6 clues (4–6 gets the easy 3×3).
 */
type RNG = () => number;

interface Cat {
  third: string;
  base: string;
  art: boolean;
  intro: string;
  items: string[];
}
const CATS: Cat[] = [
  { third: "has", base: "have", art: true, intro: "Each kid has one pet.", items: ["cat", "dog", "fish", "bird", "rabbit", "turtle", "hamster", "lizard"] },
  { third: "packs", base: "pack", art: true, intro: "Each kid packed one lunch.", items: ["pizza", "apple", "salad", "pasta", "soup", "bagel", "taco", "rice"] },
  { third: "plays", base: "play", art: false, intro: "Each kid plays one sport.", items: ["soccer", "tennis", "hockey", "golf", "chess", "rugby", "karate"] },
];
const NAMES = ["Ava", "Ben", "Cy", "Dee", "Eli", "Fay", "Gus", "Ivy", "Jo", "Kai", "Lia", "Max", "Nia", "Zed"];

type Clue =
  | { t: "pos"; p: number; i: number }
  | { t: "neg"; p: number; i: number }
  | { t: "either"; ps: [number, number]; i: number }
  | { t: "neither"; ps: [number, number]; i: number };

const holds = (c: Clue, a: number[]): boolean => {
  switch (c.t) {
    case "pos": return a[c.p] === c.i;
    case "neg": return a[c.p] !== c.i;
    case "either": return a[c.ps[0]] === c.i || a[c.ps[1]] === c.i;
    case "neither": return a[c.ps[0]] !== c.i && a[c.ps[1]] !== c.i;
  }
};

function perms(n: number): number[][] {
  const out: number[][] = [];
  const rec = (cur: number[], used: boolean[]) => {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = 0; i < n; i++) if (!used[i]) { used[i] = true; cur.push(i); rec(cur, used); cur.pop(); used[i] = false; }
  };
  rec([], Array(n).fill(false));
  return out;
}

function shuffle<T>(rng: RNG, a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export interface LogicGrid {
  lines: string[];
  svg: string;
  answer: string;
  n: number;
}

function trueClues(sol: number[], n: number, allowPos: boolean): Clue[] {
  const cl: Clue[] = [];
  for (let p = 0; p < n; p++) for (let i = 0; i < n; i++) {
    if (sol[p] === i) { if (allowPos) cl.push({ t: "pos", p, i }); }
    else cl.push({ t: "neg", p, i });
  }
  for (let i = 0; i < n; i++) {
    const owner = sol.indexOf(i);
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (p === owner || q === owner) cl.push({ t: "either", ps: [p, q], i });
      else cl.push({ t: "neither", ps: [p, q], i });
    }
  }
  return cl;
}

function solveClues(rng: RNG, n: number, max: number, min = 0): { sol: number[]; clues: Clue[] } | null {
  const all = perms(n);
  const sol = all[Math.floor(rng() * all.length)];
  const pool = trueClues(sol, n, n === 3);
  let alive = all;
  const chosen: Clue[] = [];
  const left = shuffle(rng, pool);
  while (alive.length > 1 && chosen.length < max + 3 && left.length) {
    const scored = left.map((c) => ({ c, k: alive.filter((a) => holds(c, a)).length })).sort((x, y) => x.k - y.k);
    // skip clues that teach nothing, pick among the sharper few for variety
    const useful = scored.filter((s) => s.k < alive.length);
    if (!useful.length) return null;
    // 4×4 takes the gentlest useful clues, so it needs several to crack
    const top = n === 3 ? useful.slice(0, 3) : useful.slice(-3);
    const pickd = top[Math.floor(rng() * top.length)].c;
    chosen.push(pickd);
    left.splice(left.indexOf(pickd), 1);
    alive = alive.filter((a) => holds(pickd, a));
  }
  if (alive.length !== 1) return null;
  // prune redundant clues
  for (let i = chosen.length - 1; i >= 0; i--) {
    const rest = chosen.filter((_, j) => j !== i);
    if (all.filter((a) => rest.every((c) => holds(c, a))).length === 1) chosen.splice(i, 1);
  }
  return chosen.length <= max && chosen.length >= min ? { sol, clues: chosen } : null;
}

const obj = (cat: Cat, item: string) => (cat.art ? "the " : "") + item;

function clueText(c: Clue, cat: Cat, names: string[], items: string[]): string {
  switch (c.t) {
    case "pos": return `${names[c.p]} ${cat.third} ${obj(cat, items[c.i])}.`;
    case "neg": return `${names[c.p]} does not ${cat.base} ${obj(cat, items[c.i])}.`;
    case "either": return `Either ${names[c.ps[0]]} or ${names[c.ps[1]]} ${cat.third} ${obj(cat, items[c.i])}.`;
    case "neither": return `Neither ${names[c.ps[0]]} nor ${names[c.ps[1]]} ${cat.third} ${obj(cat, items[c.i])}.`;
  }
}

function gridSvg(names: string[], items: string[]): string {
  const n = names.length;
  const cell = n === 3 ? 40 : 34;
  const lw = 44, th = 26;
  const W = lw + cell * n + 2, H = th + cell * n + 2;
  const g: string[] = [];
  items.forEach((it, i) => g.push(`<text x="${lw + cell * i + cell / 2}" y="${th - 8}" text-anchor="middle" font-size="${n === 3 ? 9.5 : 8}" font-family="ui-monospace,Menlo,monospace" font-weight="700">${it}</text>`));
  names.forEach((nm, p) => g.push(`<text x="${lw - 5}" y="${th + cell * p + cell / 2 + 3.5}" text-anchor="end" font-size="10" font-family="ui-monospace,Menlo,monospace" font-weight="700">${nm}</text>`));
  for (let p = 0; p <= n; p++) g.push(`<line x1="${lw}" y1="${th + cell * p}" x2="${lw + cell * n}" y2="${th + cell * p}" stroke="#111" stroke-width="1.6"/>`);
  for (let i = 0; i <= n; i++) g.push(`<line x1="${lw + cell * i}" y1="${th}" x2="${lw + cell * i}" y2="${th + cell * n}" stroke="#111" stroke-width="1.6"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Logic grid">${g.join("")}</svg>`;
}

export function generateLogicGrid(band: AgeBand, rng: RNG): LogicGrid {
  const n = band === "10-12" ? 4 : 3;
  const max = n === 3 ? 3 : 7;
  const min = n === 3 ? 0 : 5;
  const cat = CATS[Math.floor(rng() * CATS.length)];
  const names = shuffle(rng, NAMES).slice(0, n);
  const items = shuffle(rng, cat.items).slice(0, n);
  let best: { sol: number[]; clues: Clue[] } | null = null;
  for (let t = 0; t < 600 && !best; t++) best = solveClues(rng, n, max, min);
  if (!best) best = solveClues(rng, n, max + 3) ?? { sol: shuffle(rng, [...Array(n).keys()]), clues: [] };
  const lines = [
    `${cat.intro} Use the clues: mark ✗ for no, ✓ for yes.`,
    ...best.clues.map((c, i) => `${i + 1}. ${clueText(c, cat, names, items)}`),
  ];
  const answer = names.map((nm, p) => `${nm}: ${items[best!.sol[p]]}`).join(", ");
  return { lines, svg: gridSvg(names, items), answer, n };
}
