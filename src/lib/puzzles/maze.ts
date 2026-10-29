import type { AgeBand, MazeCell, MazeData } from "../types";
import { mulberry32 } from "../rng";
import { mazeSizeForDifficulty, mazeCandidatesForDifficulty } from "../difficulty";

function sizeForBand(band: AgeBand): { cols: number; rows: number } {
  if (band === "4-6") return { cols: 10, rows: 13 };
  if (band === "7-9") return { cols: 19, rows: 25 };
  return { cols: 25, rows: 33 };
}

/** Shape knobs derived from difficulty (1–20). */
interface MazeShape {
  /** Chance of extending the newest cell (long corridors) vs a random one (more forks). */
  newest: number;
  /** Walls to knock out afterwards, making wrong turns that loop instead of dead-ending. */
  loops: number;
}

function shapeFor(difficulty: number, cols: number, rows: number): MazeShape {
  const x = Math.max(1, Math.min(20, difficulty));
  // Easy: near-pure backtracker. Harder: lots of forks, then loops on top.
  const newest = x <= 4 ? 0.9 : Math.max(0.72, 0.9 - (x - 4) * 0.012);
  const loops = x <= 5 ? 0 : Math.round(cols * rows * Math.min(0.05, (x - 5) * 0.004));
  return { newest, loops };
}

/**
 * One spanning-tree maze for a given seed — always solvable. Growing-tree
 * generation blends "newest cell" (long winding corridors) with "random cell"
 * (many forks), so false branches are plentiful and not all stubby.
 */
function buildMaze(seed: number, cols: number, rows: number, shape: MazeShape): MazeData {
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

  // Growing tree (iterative, so big grids are fine).
  const active: [number, number][] = [[0, 0]];
  visited[0][0] = true;
  while (active.length) {
    const idx = rng() < shape.newest ? active.length - 1 : Math.floor(rng() * active.length);
    const [r, c] = active[idx];
    let advanced = false;
    for (const [nr, nc, wallHere, wallThere] of neighbors(r, c)) {
      if (visited[nr][nc]) continue;
      cells[r][c][wallHere] = false;
      cells[nr][nc][wallThere] = false;
      visited[nr][nc] = true;
      active.push([nr, nc]);
      advanced = true;
      break;
    }
    if (!advanced) active.splice(idx, 1);
  }

  addLoops(cells, shape.loops, rng);

  const start: [number, number] = [0, 0];
  const end: [number, number] = [rows - 1, cols - 1];
  const path = solvePath(cells, start, end);
  return { cols, rows, cells, start, end, path };
}

/**
 * Knock out walls between cells that are far apart through the maze, so a wrong
 * turn can loop round and rejoin instead of simply dead-ending. Short shortcuts
 * are skipped: they'd just be clutter, or flatten the real route.
 */
function addLoops(cells: MazeCell[][], count: number, rng: () => number): void {
  const rows = cells.length;
  const cols = cells[0].length;
  const minGap = Math.max(10, Math.round((rows + cols) / 3));
  let added = 0;
  for (let tries = 0; added < count && tries < count * 25; tries++) {
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    const horiz = rng() < 0.5;
    const nr = horiz ? r : r + 1;
    const nc = horiz ? c + 1 : c;
    if (nr >= rows || nc >= cols) continue;
    if (horiz ? !cells[r][c].e : !cells[r][c].s) continue; // already open
    // BFS distance between the two cells through the existing maze.
    const dist = new Map<number, number>([[r * cols + c, 0]]);
    const q: [number, number][] = [[r, c]];
    let found = -1;
    for (let h = 0; h < q.length && found < 0; h++) {
      const [qr, qc] = q[h];
      const d = dist.get(qr * cols + qc)!;
      for (const [ar, ac] of openNeighbors(cells, qr, qc)) {
        const k = ar * cols + ac;
        if (dist.has(k)) continue;
        dist.set(k, d + 1);
        if (ar === nr && ac === nc) { found = d + 1; break; }
        q.push([ar, ac]);
      }
    }
    if (found < minGap) continue;
    if (horiz) { cells[r][c].e = false; cells[nr][nc].w = false; }
    else { cells[r][c].s = false; cells[nr][nc].n = false; }
    added++;
  }
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
  let stubs = 0;
  let forks = 0;
  for (const [r, c] of path) {
    let offPath = 0;
    for (const [nr, nc] of openNeighbors(cells, r, c)) {
      if (onPath.has(`${nr},${nc}`)) continue;
      offPath++;
      const d = branchDepth(nr, nc);
      score += d; // total wrong-turn territory
      if (d >= thresh) {
        longBranches++;
        score += thresh; // extra weight for genuinely long false branches
      } else if (d <= 2) {
        stubs++; // obvious little nubs: they don't make you think
      }
    }
    if (offPath) forks++; // every fork is a decision the solver must make
  }
  // Favour many decisions and several long false branches; punish stubby ones.
  return score + forks * 4 + longBranches * longBranches * 3 - stubs * 3;
}

/**
 * Pick the hardest of several candidate mazes (deterministic per seed). Selecting
 * for long off-path branches gives the tempting wrong turns that make a maze
 * actually tricky instead of a single obvious corridor.
 */
export function generateMaze(
  seed: number,
  band: AgeBand,
  difficulty?: number,
  opts: { square?: boolean; dims?: { cols: number; rows: number } } = {},
): MazeData {
  const base = difficulty != null ? mazeSizeForDifficulty(difficulty) : sizeForBand(band);
  // A square maze (Letter 1× card) uses fewer columns so its cells stay about
  // the size they'd be in a tall card.
  const side = Math.max(6, Math.round(base.cols * 0.75));
  const { cols, rows } = opts.dims ?? (opts.square ? { cols: side, rows: side } : base);
  // Little kids get an easy maze; bigger kids get a harder-selected one.
  const candidates =
    difficulty != null
      ? mazeCandidatesForDifficulty(difficulty)
      : band === "4-6"
        ? 6
        : band === "7-9"
          ? 10
          : 14;
  const effective = difficulty ?? (band === "4-6" ? 3 : band === "7-9" ? 9 : 15);
  const shape = shapeFor(effective, cols, rows);
  let best = buildMaze(seed >>> 0, cols, rows, shape);
  let bestScore = difficultyScore(best);
  for (let i = 1; i < candidates; i++) {
    const m = buildMaze((seed + i * 0x9e3779b1) >>> 0, cols, rows, shape);
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
