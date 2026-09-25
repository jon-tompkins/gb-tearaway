import type { BattleshipData } from "../types";

/**
 * Battleship Solitaire (Bimaru). Fully procedural + seeded, self-grading.
 * A fleet is placed on an N×N grid with the classic no-touch rule (ships never
 * touch, not even diagonally); row/column counts are derived from the placement
 * and a minimal set of cells is revealed so the puzzle has EXACTLY one solution
 * (verified by the solver below). The solution is the answer key (in-app only).
 *
 * Dependency-free on purpose (RNG is injected, difficulty math is inlined) so it
 * can be unit-tested directly with `node --experimental-strip-types`.
 */

type RNG = () => number;

const clampD = (d: number): number =>
  !Number.isFinite(d) ? 10 : Math.min(20, Math.max(1, Math.round(d)));

/** Grid size + fleet (each ship listed individually) for an appropriateness dial. */
export function battleshipConfig(difficulty: number): { n: number; ships: number[]; label: string } {
  const d = clampD(difficulty);
  if (d <= 5) return { n: 6, ships: [3, 2, 2, 1, 1, 1], label: "Battleship Solitaire" };
  if (d <= 10) return { n: 7, ships: [4, 3, 2, 2, 1, 1, 1], label: "Battleship Solitaire" };
  if (d <= 14) return { n: 8, ships: [4, 3, 3, 2, 2, 1, 1, 1], label: "Battleship Solitaire" };
  return { n: 9, ships: [5, 4, 3, 2, 2, 1, 1, 1, 1], label: "Battleship Solitaire" };
}

type Cell = [number, number];

/** Try to place the whole fleet with the no-touch rule. Returns solution grid or null. */
function placeFleet(n: number, ships: number[], rng: RNG): number[][] | null {
  const grid = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const order = [...ships].sort((a, b) => b - a);
  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const fits = (cells: Cell[]): boolean => {
    const set = new Set(cells.map(([r, c]) => r * n + c));
    for (const [r, c] of cells) {
      if (r < 0 || r >= n || c < 0 || c >= n) return false;
      if (grid[r][c] === 1) return false;
    }
    for (const [r, c] of cells) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && grid[rr][cc] === 1 && !set.has(rr * n + cc))
            return false;
        }
    }
    return true;
  };
  const place = (i: number): boolean => {
    if (i === order.length) return true;
    const L = order[i];
    const orients: Cell[] = L === 1 ? [[0, 1]] : [[0, 1], [1, 0]];
    const positions: [number, number, number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        for (const [dr, dc] of orients) positions.push([r, c, dr, dc]);
    shuffle(positions);
    for (const [r, c, dr, dc] of positions) {
      const cells: Cell[] = [];
      for (let k = 0; k < L; k++) cells.push([r + dr * k, c + dc * k]);
      if (!fits(cells)) continue;
      for (const [rr, cc] of cells) grid[rr][cc] = 1;
      if (place(i + 1)) return true;
      for (const [rr, cc] of cells) grid[rr][cc] = 0;
    }
    return false;
  };
  return place(0) ? grid : null;
}

/** Part type of a ship cell in a finished grid: 'sub' | 'mid' | 'end:L|R|U|D' (cap faces outward). */
export function partAt(grid: number[][], r: number, c: number): string {
  const n = grid.length;
  const left = c > 0 && grid[r][c - 1] === 1;
  const right = c < n - 1 && grid[r][c + 1] === 1;
  const up = r > 0 && grid[r - 1][c] === 1;
  const down = r < n - 1 && grid[r + 1][c] === 1;
  if (!left && !right && !up && !down) return "sub";
  if (left || right) {
    if (left && right) return "mid";
    return right ? "end:L" : "end:R"; // body to the right → rounded left
  }
  if (up && down) return "mid";
  return down ? "end:U" : "end:D"; // body below → rounded top
}

function partForPlacement(cells: Cell[], idx: number, horizontal: boolean): string {
  const L = cells.length;
  if (L === 1) return "sub";
  if (idx === 0) return horizontal ? "end:L" : "end:U";
  if (idx === L - 1) return horizontal ? "end:R" : "end:D";
  return "mid";
}

/**
 * Count solutions (up to `cap`) consistent with the counts, fleet, and clues.
 * Identical-length ships are placed in a canonical order so fleet permutations
 * aren't counted as distinct solutions.
 */
/**
 * `budget` caps DFS node expansions; if exceeded before `cap` solutions are
 * found the search throws `bs-budget` (the caller treats that as "not yet
 * verifiably unique" and adds another clue, which shrinks the search).
 */
export class BudgetExceeded extends Error {}
export function countSolutions(
  n: number,
  rows: number[],
  cols: number[],
  ships: number[],
  waterSet: Set<number>,
  shipReveal: Map<number, string>,
  cap: number,
  budget = Infinity,
): number {
  const order = [...ships].sort((a, b) => b - a);
  const grid = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const rowRem = [...rows];
  const colRem = [...cols];
  const placements = new Map<number, { cells: Cell[]; horizontal: boolean; key: number }[]>();
  const placementsFor = (L: number) => {
    let list = placements.get(L);
    if (list) return list;
    list = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c + L <= n; c++) {
        const cells: Cell[] = [];
        for (let k = 0; k < L; k++) cells.push([r, c + k]);
        list.push({ cells, horizontal: true, key: (r * n + c) * 2 });
      }
    if (L > 1)
      for (let r = 0; r + L <= n; r++)
        for (let c = 0; c < n; c++) {
          const cells: Cell[] = [];
          for (let k = 0; k < L; k++) cells.push([r + k, c]);
          list.push({ cells, horizontal: false, key: (r * n + c) * 2 + 1 });
        }
    placements.set(L, list);
    return list;
  };
  const canPlace = (cells: Cell[], horizontal: boolean): boolean => {
    const set = new Set(cells.map(([r, c]) => r * n + c));
    for (let idx = 0; idx < cells.length; idx++) {
      const [r, c] = cells[idx];
      const id = r * n + c;
      if (grid[r][c] !== 0) return false;
      if (waterSet.has(id)) return false;
      if (rowRem[r] <= 0 || colRem[c] <= 0) return false;
      const want = shipReveal.get(id);
      if (want != null && want !== partForPlacement(cells, idx, horizontal)) return false;
    }
    for (const [r, c] of cells)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && grid[rr][cc] === 1 && !set.has(rr * n + cc))
            return false;
        }
    return true;
  };
  let solutions = 0;
  let nodes = 0;
  const dfs = (i: number, prevKey: number): void => {
    if (++nodes > budget) throw new BudgetExceeded("bs-budget");
    if (solutions >= cap) return;
    if (i === order.length) {
      for (const [id] of shipReveal) if (grid[Math.floor(id / n)][id % n] !== 1) return;
      solutions++;
      return;
    }
    const L = order[i];
    const sameAsPrev = i > 0 && order[i - 1] === L;
    for (const p of placementsFor(L)) {
      if (sameAsPrev && p.key <= prevKey) continue;
      if (!canPlace(p.cells, p.horizontal)) continue;
      for (const [r, c] of p.cells) { grid[r][c] = 1; rowRem[r]--; colRem[c]--; }
      dfs(i + 1, p.key);
      for (const [r, c] of p.cells) { grid[r][c] = 0; rowRem[r]++; colRem[c]++; }
      if (solutions >= cap) return;
    }
  };
  dfs(0, -1);
  return solutions;
}

/** Generate a uniquely-solvable puzzle. Throws if it can't (caller can retry). */
export function generateBattleship(rng: RNG, difficulty: number): BattleshipData {
  const { n, ships, label } = battleshipConfig(difficulty);
  for (let attempt = 0; attempt < 60; attempt++) {
    const sol = placeFleet(n, ships, rng);
    if (!sol) continue;
    const rows = sol.map((row) => row.reduce((a, b) => a + b, 0));
    const cols = Array.from({ length: n }, (_, c) => sol.reduce((a, row) => a + row[c], 0));

    // Split cells into ship parts and water, each shuffled for variety.
    const shipCells: { id: number; type: string }[] = [];
    const waterCells: { id: number; type: string }[] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const id = r * n + c;
        if (sol[r][c] === 1) shipCells.push({ id, type: partAt(sol, r, c) });
        else waterCells.push({ id, type: "water" });
      }
    const shuffle = (arr: { id: number; type: string }[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    shuffle(shipCells);
    shuffle(waterCells);

    const water = new Set<number>();
    const shipR = new Map<number, string>();
    const add = (e: { id: number; type: string }) =>
      e.type === "water" ? water.add(e.id) : shipR.set(e.id, e.type);

    // Target clue mix: mostly ship parts (subs / ends / middles) with a few water
    // easers. Kept fairly dense (bigger grid + fleet carry the difficulty, not a
    // razor-sparse board) so the uniqueness check stays cheap and the puzzle is
    // kid-friendly.
    const d = clampD(difficulty);
    const shipFrac = d <= 5 ? 0.55 : d <= 10 ? 0.5 : d <= 14 ? 0.45 : 0.42;
    const waterFrac = d <= 5 ? 0.18 : d <= 10 ? 0.16 : d <= 14 ? 0.14 : 0.12;
    const nShip = Math.min(shipCells.length, Math.max(2, Math.round(shipCells.length * shipFrac)));
    const nWater = Math.min(waterCells.length, Math.round(waterCells.length * waterFrac));
    for (let i = 0; i < nShip; i++) add(shipCells[i]);
    for (let i = 0; i < nWater; i++) add(waterCells[i]);

    // Verifiably unique WITHIN a node budget: if a clue set can't be confirmed
    // unique cheaply, add another clue (prefer ship parts, then water) — more
    // clues shrink the search. Terminates: revealing everything is trivially unique.
    const BUDGET = 40000;
    const uniqueNow = (): boolean => {
      try {
        return countSolutions(n, rows, cols, ships, water, shipR, 2, BUDGET) === 1;
      } catch {
        return false; // budget hit → not verifiably unique yet
      }
    };
    const topup = [...shipCells.slice(nShip), ...waterCells.slice(nWater)];
    let ti = 0;
    while (!uniqueNow() && ti < topup.length) add(topup[ti++]);
    if (!uniqueNow()) continue; // couldn't make it unique cheaply — retry placement

    const reveal: Record<string, string> = {};
    for (const id of water) reveal[`${Math.floor(id / n)},${id % n}`] = "water";
    for (const [id, t] of shipR) reveal[`${Math.floor(id / n)},${id % n}`] = t;
    return { n, solution: sol, rows, cols, ships: [...ships].sort((a, b) => b - a), reveal, label };
  }
  throw new Error("battleship: failed to generate a unique puzzle");
}

/** Validate a generated puzzle. Throws with a reason if anything is off. */
export function validateBattleship(d: BattleshipData): void {
  const { n, solution, rows, cols, ships, reveal } = d;
  let cells = 0;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (solution[r][c] === 1) cells++;
  const fleetSum = ships.reduce((a, b) => a + b, 0);
  if (cells !== fleetSum) throw new Error(`cell count ${cells} != fleet ${fleetSum}`);
  for (let r = 0; r < n; r++)
    if (solution[r].reduce((a, b) => a + b, 0) !== rows[r]) throw new Error(`row ${r} count mismatch`);
  for (let c = 0; c < n; c++)
    if (solution.reduce((a, row) => a + row[c], 0) !== cols[c]) throw new Error(`col ${c} count mismatch`);
  // no diagonal touching
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (solution[r][c] === 1)
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as Cell[]) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && solution[rr][cc] === 1)
            throw new Error(`ships touch diagonally at ${r},${c}`);
        }
  // every ship must be a STRAIGHT line: no cell may have both a horizontal and a
  // vertical ship neighbor (that's an L/corner — two ships touching orthogonally).
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (solution[r][c] === 1) {
        const h = (c > 0 && solution[r][c - 1] === 1) || (c < n - 1 && solution[r][c + 1] === 1);
        const v = (r > 0 && solution[r - 1][c] === 1) || (r < n - 1 && solution[r + 1][c] === 1);
        if (h && v) throw new Error(`bent ship / orthogonal touch at ${r},${c}`);
      }
  // connected ship components must equal the fleet exactly (right count of each length)
  const seen = solution.map((row) => row.map(() => false));
  const found: number[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (solution[r][c] !== 1 || seen[r][c]) continue;
      let len = 0;
      if (c < n - 1 && solution[r][c + 1] === 1) {
        let cc = c;
        while (cc < n && solution[r][cc] === 1) { seen[r][cc] = true; cc++; len++; }
      } else if (r < n - 1 && solution[r + 1][c] === 1) {
        let rr = r;
        while (rr < n && solution[rr][c] === 1) { seen[rr][c] = true; rr++; len++; }
      } else { seen[r][c] = true; len = 1; }
      found.push(len);
    }
  const key = (a: number[]) => [...a].sort((x, y) => y - x).join(",");
  if (key(found) !== key(ships)) throw new Error(`fleet mismatch: found [${key(found)}] vs [${key(ships)}]`);
  // reveals consistent with the solution
  for (const [key, v] of Object.entries(reveal)) {
    const [r, c] = key.split(",").map(Number);
    if (v === "water") {
      if (solution[r][c] !== 0) throw new Error(`water clue on a ship at ${key}`);
    } else {
      if (solution[r][c] !== 1) throw new Error(`ship clue on water at ${key}`);
      if (partAt(solution, r, c) !== v) throw new Error(`wrong part clue at ${key}: ${v}`);
    }
  }
  // exactly one solution from the clues
  const water = new Set<number>();
  const shipR = new Map<number, string>();
  for (const [key, v] of Object.entries(reveal)) {
    const [r, c] = key.split(",").map(Number);
    if (v === "water") water.add(r * n + c);
    else shipR.set(r * n + c, v);
  }
  const sols = countSolutions(n, rows, cols, ships, water, shipR, 2);
  if (sols !== 1) throw new Error(`not unique: ${sols} solutions`);
}

// ---------------------------------------------------------------------------
// SVG render: square grid on the left, fleet stacked vertically on the right.
// ---------------------------------------------------------------------------

function shipComponents(grid: number[][]): { cells: Cell[]; horizontal: boolean }[] {
  const n = grid.length;
  const seen = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const out: { cells: Cell[]; horizontal: boolean }[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 1 || seen[r][c]) continue;
      const horizontal = c < n - 1 && grid[r][c + 1] === 1;
      const cells: Cell[] = [];
      if (!horizontal && r < n - 1 && grid[r + 1][c] === 1) {
        let rr = r;
        while (rr < n && grid[rr][c] === 1) { cells.push([rr, c]); seen[rr][c] = true; rr++; }
      } else if (horizontal) {
        let cc = c;
        while (cc < n && grid[r][cc] === 1) { cells.push([r, cc]); seen[r][cc] = true; cc++; }
      } else {
        cells.push([r, c]); seen[r][c] = true;
      }
      out.push({ cells, horizontal: cells.length > 1 ? horizontal : false });
    }
  return out;
}

export function battleshipToSvg(d: BattleshipData, opts: { showSolution?: boolean } = {}): string {
  const { n, reveal, ships, solution } = d;
  const CS = n <= 6 ? 32 : n <= 7 ? 28 : n <= 8 ? 24 : 21;
  const pad = 4;
  const gut = 16; // count labels gutter (right + bottom)
  const gap = 16; // grid → fleet gap
  const gridPx = n * CS;
  const ox = pad, oy = pad;
  const INS = 0.18;
  const p: string[] = [];

  const stad = (x0: number, y0: number, x1: number, y1: number): string => {
    const m = INS * CS, xa = x0 + m, ya = y0 + m, xb = x1 - m, yb = y1 - m;
    const w = xb - xa, h = yb - ya, r = Math.min(w, h) / 2;
    return `<rect x="${xa.toFixed(1)}" y="${ya.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r.toFixed(1)}" fill="#111"/>`;
  };
  const dome = (x0: number, y0: number, dir: string): string => {
    const m = INS * CS, x1 = x0 + CS, y1 = y0 + CS, xa = x0 + m, ya = y0 + m, xb = x1 - m, yb = y1 - m;
    if (dir === "L" || dir === "R") {
      const r = (yb - ya) / 2;
      return dir === "L"
        ? `<path d="M ${xb.toFixed(1)} ${ya.toFixed(1)} L ${(xa + r).toFixed(1)} ${ya.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${(xa + r).toFixed(1)} ${yb.toFixed(1)} L ${xb.toFixed(1)} ${yb.toFixed(1)} Z" fill="#111"/>`
        : `<path d="M ${xa.toFixed(1)} ${ya.toFixed(1)} L ${(xb - r).toFixed(1)} ${ya.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(xb - r).toFixed(1)} ${yb.toFixed(1)} L ${xa.toFixed(1)} ${yb.toFixed(1)} Z" fill="#111"/>`;
    }
    const r = (xb - xa) / 2;
    return dir === "U"
      ? `<path d="M ${xa.toFixed(1)} ${yb.toFixed(1)} L ${xa.toFixed(1)} ${(ya + r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${xb.toFixed(1)} ${(ya + r).toFixed(1)} L ${xb.toFixed(1)} ${yb.toFixed(1)} Z" fill="#111"/>`
      : `<path d="M ${xa.toFixed(1)} ${ya.toFixed(1)} L ${xa.toFixed(1)} ${(yb - r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${xb.toFixed(1)} ${(yb - r).toFixed(1)} L ${xb.toFixed(1)} ${ya.toFixed(1)} Z" fill="#111"/>`;
  };
  const sub = (x0: number, y0: number, rr = CS * 0.3): string =>
    `<circle cx="${(x0 + CS / 2).toFixed(1)}" cy="${(y0 + CS / 2).toFixed(1)}" r="${rr.toFixed(1)}" fill="#111"/>`;
  const mid = (x0: number, y0: number): string => {
    const m = INS * CS;
    return `<rect x="${(x0 + m).toFixed(1)}" y="${(y0 + m).toFixed(1)}" width="${(CS - 2 * m).toFixed(1)}" height="${(CS - 2 * m).toFixed(1)}" rx="3" fill="#111"/>`;
  };
  const water = (x0: number, y0: number): string =>
    `<circle cx="${(x0 + CS / 2).toFixed(1)}" cy="${(y0 + CS / 2).toFixed(1)}" r="2.6" fill="#9a9a9a"/>`;

  // ship fills
  if (opts.showSolution) {
    for (const { cells, horizontal } of shipComponents(solution)) {
      const [r0, c0] = cells[0], [r1, c1] = cells[cells.length - 1];
      if (cells.length === 1) p.push(sub(ox + c0 * CS, oy + r0 * CS));
      else {
        const x0 = ox + Math.min(c0, c1) * CS, y0 = oy + Math.min(r0, r1) * CS;
        const x1 = ox + (Math.max(c0, c1) + 1) * CS, y1 = oy + (Math.max(r0, r1) + 1) * CS;
        p.push(stad(x0, y0, x1, y1));
        void horizontal;
      }
    }
  } else {
    for (const [key, v] of Object.entries(reveal)) {
      const [r, c] = key.split(",").map(Number);
      const x0 = ox + c * CS, y0 = oy + r * CS;
      if (v === "water") p.push(water(x0, y0));
      else if (v === "sub") p.push(sub(x0, y0));
      else if (v === "mid") p.push(mid(x0, y0));
      else if (v.startsWith("end:")) p.push(dome(x0, y0, v.slice(4)));
    }
  }
  // grid lines
  for (let i = 0; i <= n; i++) {
    const b = i === 0 || i === n;
    const col = b ? "#111" : "#d2d2d2";
    const w = b ? 1.6 : 1;
    p.push(`<line x1="${ox + i * CS}" y1="${oy}" x2="${ox + i * CS}" y2="${oy + gridPx}" stroke="${col}" stroke-width="${w}"/>`);
    p.push(`<line x1="${ox}" y1="${oy + i * CS}" x2="${ox + gridPx}" y2="${oy + i * CS}" stroke="${col}" stroke-width="${w}"/>`);
  }
  // counts
  const fs = Math.max(11, Math.round(CS * 0.42));
  for (let r = 0; r < n; r++)
    p.push(`<text x="${(ox + gridPx + gut / 2).toFixed(0)}" y="${(oy + r * CS + CS / 2 + fs * 0.35).toFixed(0)}" font-size="${fs}" font-weight="700" text-anchor="middle" font-family="ui-monospace,monospace" fill="#111">${d.rows[r]}</text>`);
  for (let c = 0; c < n; c++)
    p.push(`<text x="${(ox + c * CS + CS / 2).toFixed(0)}" y="${(oy + gridPx + gut / 2 + fs * 0.35).toFixed(0)}" font-size="${fs}" font-weight="700" text-anchor="middle" font-family="ui-monospace,monospace" fill="#111">${d.cols[c]}</text>`);

  // fleet: vertical stack on the right, each ship in its own crossable slot
  const fleetX = ox + gridPx + gut + gap;
  const uu = Math.min(CS * 0.62, (gridPx / ships.length) * 0.5);
  const maxLen = Math.max(...ships);
  const fw = maxLen * uu + 12;
  const rowH = gridPx / ships.length;
  ships.forEach((L, i) => {
    const y = oy + i * rowH;
    const cy = y + rowH / 2;
    p.push(`<rect x="${fleetX.toFixed(1)}" y="${(y + 2).toFixed(1)}" width="${fw.toFixed(1)}" height="${(rowH - 4).toFixed(1)}" rx="4" fill="#fafafa" stroke="#d8d8d8" stroke-width="1"/>`);
    if (L === 1) {
      p.push(`<circle cx="${(fleetX + 8 + uu / 2).toFixed(1)}" cy="${cy.toFixed(1)}" r="${(uu * 0.42).toFixed(1)}" fill="#111"/>`);
    } else {
      const h = uu * 0.82;
      p.push(`<rect x="${(fleetX + 6).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${(L * uu).toFixed(1)}" height="${h.toFixed(1)}" rx="${(h / 2).toFixed(1)}" fill="#111"/>`);
    }
  });

  const W = fleetX + fw + pad;
  const H = oy + gridPx + gut + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Battleship Solitaire puzzle">${p.join("")}</svg>`;
}

/** Compact text depiction of the solution for the in-app answer key. */
export function battleshipSolutionText(d: BattleshipData): string {
  return d.solution.map((row) => row.map((v) => (v === 1 ? "■" : "·")).join(" ")).join("\n");
}
