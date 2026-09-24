import type { AgeBand, MazeCell, MazeData } from "../types";
import { mulberry32 } from "../rng";

function sizeForBand(band: AgeBand): { cols: number; rows: number } {
  if (band === "4-6") return { cols: 10, rows: 13 };
  if (band === "7-9") return { cols: 19, rows: 25 };
  return { cols: 25, rows: 33 };
}

/** One recursive-backtracker perfect maze for a given seed — always solvable. */
function buildPerfectMaze(seed: number, cols: number, rows: number): MazeData {
  const rng = mulberry32(seed);

  const cells: MazeCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ n: true, e: true, s: true, w: true })),
  );
  const visited = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  );

  function neighbors(r: number, c: number): [number, number, keyof MazeCell, keyof MazeCell][] {
    const list: [number, number, keyof MazeCell, keyof MazeCell][] = [];
    if (r > 0) list.push([r - 1, c, "n", "s"]);
    if (r < rows - 1) list.push([r + 1, c, "s", "n"]);
    if (c > 0) list.push([r, c - 1, "w", "e"]);
    if (c < cols - 1) list.push([r, c + 1, "e", "w"]);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  // Iterative DFS (avoids deep recursion on big grids).
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    let advanced = false;
    for (const [nr, nc, wallHere, wallThere] of neighbors(r, c)) {
      if (visited[nr][nc]) continue;
      cells[r][c][wallHere] = false;
      cells[nr][nc][wallThere] = false;
      visited[nr][nc] = true;
      stack.push([nr, nc]);
      advanced = true;
      break;
    }
    if (!advanced) stack.pop();
  }

  const start: [number, number] = [0, 0];
  const end: [number, number] = [rows - 1, cols - 1];
  const path = solvePath(cells, start, end);
  return { cols, rows, cells, start, end, path };
}

/** Open (wall-free) orthogonal neighbours of a cell. */
function openNeighbors(cells: MazeCell[][], r: number, c: number): [number, number][] {
  const rows = cells.length;
  const cols = cells[0].length;
  const cell = cells[r][c];
  const out: [number, number][] = [];
  if (!cell.n && r > 0) out.push([r - 1, c]);
  if (!cell.s && r < rows - 1) out.push([r + 1, c]);
  if (!cell.w && c > 0) out.push([r, c - 1]);
  if (!cell.e && c < cols - 1) out.push([r, c + 1]);
  return out;
}

/**
 * Difficulty score: reward long, tempting dead-end branches that sprout off the
 * solution path (that's what makes a maze feel hard — plausible wrong turns you
 * have to walk into and back out of), plus a longer, windier solution.
 */
function difficultyScore(maze: MazeData): number {
  const { cells, rows, cols, path } = maze;
  const onPath = new Set(path.map(([r, c]) => `${r},${c}`));
  const thresh = Math.max(4, Math.round(Math.min(rows, cols) * 0.6));

  // Longest reachable depth into an off-path subtree hanging off a junction.
  function branchDepth(sr: number, sc: number): number {
    const seen = new Set<string>([`${sr},${sc}`]);
    const stack: [number, number, number][] = [[sr, sc, 1]];
    let maxD = 0;
    while (stack.length) {
      const [r, c, d] = stack.pop()!;
      if (d > maxD) maxD = d;
      for (const [nr, nc] of openNeighbors(cells, r, c)) {
        const k = `${nr},${nc}`;
        if (onPath.has(k) || seen.has(k)) continue;
        seen.add(k);
        stack.push([nr, nc, d + 1]);
      }
    }
    return maxD;
  }

  let score = path.length; // a longer solution is windier
  let longBranches = 0;
  for (const [r, c] of path) {
    for (const [nr, nc] of openNeighbors(cells, r, c)) {
      if (onPath.has(`${nr},${nc}`)) continue;
      const d = branchDepth(nr, nc);
      score += d; // total wrong-turn territory
      if (d >= thresh) {
        longBranches++;
        score += thresh; // extra weight for genuinely long false branches
      }
    }
  }
  // Strongly favour mazes that have several long false branches.
  return score + longBranches * longBranches * 3;
}

/**
 * Pick the hardest of several candidate mazes (deterministic per seed). Selecting
 * for long off-path branches gives the tempting wrong turns that make a maze
 * actually tricky instead of a single obvious corridor.
 */
export function generateMaze(seed: number, band: AgeBand): MazeData {
  const { cols, rows } = sizeForBand(band);
  // Little kids get an easy maze; bigger kids get a harder-selected one.
  const candidates = band === "4-6" ? 6 : band === "7-9" ? 28 : 40;
  let best = buildPerfectMaze(seed >>> 0, cols, rows);
  let bestScore = difficultyScore(best);
  for (let i = 1; i < candidates; i++) {
    const m = buildPerfectMaze((seed + i * 0x9e3779b1) >>> 0, cols, rows);
    const s = difficultyScore(m);
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}

function solvePath(
  cells: MazeCell[][],
  start: [number, number],
  end: [number, number],
): [number, number][] {
  const rows = cells.length;
  const cols = cells[0].length;
  const parent = new Map<string, string | null>();
  const key = (r: number, c: number) => `${r},${c}`;
  const q: [number, number][] = [start];
  parent.set(key(...start), null);

  while (q.length) {
    const [r, c] = q.shift()!;
    if (r === end[0] && c === end[1]) break;
    const cell = cells[r][c];
    const opts: [number, number][] = [];
    if (!cell.n && r > 0) opts.push([r - 1, c]);
    if (!cell.s && r < rows - 1) opts.push([r + 1, c]);
    if (!cell.w && c > 0) opts.push([r, c - 1]);
    if (!cell.e && c < cols - 1) opts.push([r, c + 1]);
    for (const [nr, nc] of opts) {
      const k = key(nr, nc);
      if (parent.has(k)) continue;
      parent.set(k, key(r, c));
      q.push([nr, nc]);
    }
  }

  const path: [number, number][] = [];
  let cur: string | null = key(...end);
  while (cur) {
    const [r, c] = cur.split(",").map(Number) as [number, number];
    path.push([r, c]);
    cur = parent.get(cur) ?? null;
  }
  path.reverse();
  return path;
}

export function mazeToSvg(
  maze: MazeData,
  opts: { showPath?: boolean; maxWidth?: number } = {},
): string {
  const { cols, rows, cells, start, end, path } = maze;
  const maxW = opts.maxWidth ?? 340;
  const cell = Math.floor(maxW / cols);
  const pad = 6;
  const stroke = Math.max(2, Math.round(cell / 10));
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  const lines: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cell;
      const y = pad + r * cell;
      const cellWalls = cells[r][c];
      if (cellWalls.n) {
        lines.push(`<line x1="${x}" y1="${y}" x2="${x + cell}" y2="${y}" stroke="#111" stroke-width="${stroke}" stroke-linecap="square"/>`);
      }
      if (cellWalls.w) {
        lines.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + cell}" stroke="#111" stroke-width="${stroke}" stroke-linecap="square"/>`);
      }
      if (c === cols - 1 && cellWalls.e) {
        lines.push(`<line x1="${x + cell}" y1="${y}" x2="${x + cell}" y2="${y + cell}" stroke="#111" stroke-width="${stroke}" stroke-linecap="square"/>`);
      }
      if (r === rows - 1 && cellWalls.s) {
        lines.push(`<line x1="${x}" y1="${y + cell}" x2="${x + cell}" y2="${y + cell}" stroke="#111" stroke-width="${stroke}" stroke-linecap="square"/>`);
      }
    }
  }

  if (opts.showPath && path.length > 1) {
    const pts = path
      .map(([r, c]) => `${pad + c * cell + cell / 2},${pad + r * cell + cell / 2}`)
      .join(" ");
    lines.push(
      `<polyline points="${pts}" fill="none" stroke="#c45c26" stroke-width="${Math.max(1.5, stroke * 0.7)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`,
    );
  }

  const sr = pad + start[0] * cell + cell / 2;
  const sc = pad + start[1] * cell + cell / 2;
  const er = pad + end[0] * cell + cell / 2;
  const ec = pad + end[1] * cell + cell / 2;
  lines.push(`<circle cx="${sc}" cy="${sr}" r="${cell * 0.18}" fill="#111"/>`);
  lines.push(`<circle cx="${ec}" cy="${er}" r="${cell * 0.18}" fill="none" stroke="#111" stroke-width="${stroke}"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" role="img" aria-label="Solvable maze puzzle">${lines.join("")}</svg>`;
}
