import assert from "node:assert/strict";
import { test } from "node:test";
import { mazeSizeForDifficulty } from "../src/lib/difficulty";
import { generateStrip } from "../src/lib/generateStrip";
import { buildFreeKid, editionById, freeSettings, replaceUnfilledNews, slotsForEdition } from "../src/lib/free/editions";
import { generateMaze, mazeToSvg } from "../src/lib/puzzles/maze";
import type { AgeBand, MazeData } from "../src/lib/types";

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Mirrors shapeFor in src/lib/puzzles/maze.ts. Difficulty 5 and under is a tree.
 * Difficulty 6 and up asks addLoops to open this many extra passages.
 */
function expectedLoops(difficulty: number, cols: number, rows: number): number {
  const x = Math.max(1, Math.min(20, difficulty));
  return x <= 5 ? 0 : Math.round(cols * rows * Math.min(0.05, (x - 5) * 0.004));
}

function passageCount(maze: MazeData, label: string): number {
  const { cells, cols, rows } = maze;
  let passages = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      if (c + 1 < cols) {
        assert.equal(cell.e, cells[r][c + 1].w, `${label} east/west walls disagree at ${r},${c}`);
        if (!cell.e) passages++;
      } else {
        assert.equal(cell.e, true, `${label} opens off the right edge`);
      }
      if (r + 1 < rows) {
        assert.equal(cell.s, cells[r + 1][c].n, `${label} south/north walls disagree at ${r},${c}`);
        if (!cell.s) passages++;
      } else {
        assert.equal(cell.s, true, `${label} opens off the bottom edge`);
      }
      if (r === 0) assert.equal(cell.n, true, `${label} opens off the top edge`);
      if (c === 0) assert.equal(cell.w, true, `${label} opens off the left edge`);
    }
  }
  return passages;
}

function reachable(maze: MazeData): Set<string> {
  const { cells, cols, rows } = maze;
  const seen = new Set<string>([`${maze.start[0]},${maze.start[1]}`]);
  const queue: [number, number][] = [[maze.start[0], maze.start[1]]];
  while (queue.length) {
    const [r, c] = queue.pop()!;
    const cell = cells[r][c];
    const next: [number, number][] = [];
    if (!cell.n && r > 0) next.push([r - 1, c]);
    if (!cell.s && r + 1 < rows) next.push([r + 1, c]);
    if (!cell.w && c > 0) next.push([r, c - 1]);
    if (!cell.e && c + 1 < cols) next.push([r, c + 1]);
    for (const [nr, nc] of next) {
      const key = `${nr},${nc}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push([nr, nc]);
    }
  }
  return seen;
}

/** Shortest start-to-end length, in steps, by an independent BFS. The answer key uses BFS. */
function shortestSteps(maze: MazeData): number {
  const { cells, cols, rows, start, end } = maze;
  const dist = new Map<string, number>([[`${start[0]},${start[1]}`, 0]]);
  const queue: [number, number][] = [[start[0], start[1]]];
  for (let i = 0; i < queue.length; i++) {
    const [r, c] = queue[i];
    const d = dist.get(`${r},${c}`)!;
    if (r === end[0] && c === end[1]) return d;
    const cell = cells[r][c];
    const next: [number, number][] = [];
    if (!cell.n && r > 0) next.push([r - 1, c]);
    if (!cell.s && r + 1 < rows) next.push([r + 1, c]);
    if (!cell.w && c > 0) next.push([r, c - 1]);
    if (!cell.e && c + 1 < cols) next.push([r, c + 1]);
    for (const [nr, nc] of next) {
      const key = `${nr},${nc}`;
      if (dist.has(key)) continue;
      dist.set(key, d + 1);
      queue.push([nr, nc]);
    }
  }
  return -1;
}

function wallOpen(maze: MazeData, r: number, c: number, nr: number, nc: number): boolean {
  const cell = maze.cells[r][c];
  if (nr === r - 1 && nc === c) return !cell.n;
  if (nr === r + 1 && nc === c) return !cell.s;
  if (nr === r && nc === c - 1) return !cell.w;
  if (nr === r && nc === c + 1) return !cell.e;
  return false;
}

function assertMaze(maze: MazeData, difficulty: number, label: string) {
  const cells = maze.cols * maze.rows;
  const passages = passageCount(maze, label);
  const loops = expectedLoops(difficulty, maze.cols, maze.rows);
  const seen = reachable(maze);
  assert.equal(seen.size, cells, `${label} reaches ${seen.size} of ${cells} cells`);
  assert.ok(seen.has(`${maze.end[0]},${maze.end[1]}`), `${label} finish is not connected to the start`);

  const extra = passages - (cells - 1);
  if (difficulty <= 5) {
    assert.equal(loops, 0);
    assert.equal(extra, 0, `${label} ${maze.cols}x${maze.rows} has ${passages} passages, wanted ${cells - 1}`);
  } else if (difficulty <= 13) {
    // addLoops places every requested opening on these grids.
    assert.equal(extra, loops, `${label} ${maze.cols}x${maze.rows} has ${extra} extra passages, shapeFor wants ${loops}`);
  } else {
    // Larger grids still ask for `loops` openings, but addLoops stops after
    // count × 25 tries, so a printed maze can have fewer. It never has more.
    assert.ok(extra <= loops, `${label} has ${extra} extra passages, above the ${loops} shapeFor asks for`);
    assert.ok(extra > 0, `${label} difficulty ${difficulty} opened no loops`);
  }

  const { path, start, end } = maze;
  assert.ok(path.length > 1, `${label} answer path is empty`);
  assert.deepEqual(path[0], start, `${label} answer path does not start at the entrance`);
  assert.deepEqual(path[path.length - 1], end, `${label} answer path does not finish at the exit`);
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i - 1];
    const [nr, nc] = path[i];
    assert.equal(Math.abs(nr - r) + Math.abs(nc - c), 1, `${label} answer path jumps at step ${i}`);
    assert.ok(wallOpen(maze, r, c, nr, nc), `${label} answer path crosses a wall at step ${i}`);
  }
  assert.equal(path.length - 1, shortestSteps(maze), `${label} answer path is not the shortest route`);

  const svg = mazeToSvg(maze, { showPath: true });
  const printed = path.map(([r, c]) => {
    const cell = Math.floor(340 / maze.cols);
    return `${6 + c * cell + cell / 2},${6 + r * cell + cell / 2}`;
  }).join(" ");
  assert.ok(svg.includes(`points="${printed}"`), `${label} printed answer does not follow the key`);
}

test("maze sizes match the loop count shapeFor asks for", () => {
  for (let difficulty = 1; difficulty <= 20; difficulty++) {
    const dims = mazeSizeForDifficulty(difficulty);
    for (const square of [false, true]) {
      const maze = generateMaze(20261120 + difficulty, "7-9", difficulty, { square });
      if (!square) assert.deepEqual({ cols: maze.cols, rows: maze.rows }, dims);
      assertMaze(maze, difficulty, `d${difficulty}${square ? " square" : ""}`);
    }
  }

  const bands: [AgeBand, number][] = [
    ["4-6", 3],
    ["7-9", 9],
    ["10-12", 15],
  ];
  for (const [band, difficulty] of bands) {
    assertMaze(generateMaze(7, band), difficulty, `band ${band}`);
  }
});

test("free-edition mazes, including the news substitute, keep the intended route", () => {
  let checked = 0;
  const substitutes: string[] = [];
  for (const id of ["generic-4-6", "generic-7-10", "nyc-4-6"]) {
    const edition = editionById(id)!;
    for (let day = 0; day < 8; day++) {
      const date = addDays("2026-11-20", day);
      const raw = slotsForEdition(edition, date);
      const filled = replaceUnfilledNews(raw, {}, edition, date);
      raw.forEach((slot, i) => {
        const wasNews = slot.moduleIds.some((m) => m.startsWith("news_"));
        if (wasNews && filled.slots[i].moduleIds.includes("maze")) substitutes.push(`${id} ${date}`);
      });
      const kid = buildFreeKid(edition, date);
      kid.slots = filled.slots;
      kid.modules = filled.slots.flatMap((s) => s.moduleIds);
      const job = generateStrip(kid, freeSettings(edition), { dateISO: date, nonce: 0 });
      for (const section of job.sections) {
        if (!section.maze) continue;
        assertMaze(section.maze, edition.difficulty, `${id} ${date} ${section.id}`);
        checked++;
      }
    }
  }
  assert.ok(checked > 1, "expected printed mazes on several dates");
  assert.ok(substitutes.length > 1, `expected the news substitute to be a maze on several dates, saw ${substitutes.join(", ")}`);

  const medium = editionById("generic-7-10")!;
  const date = "2026-11-20";
  const filled = replaceUnfilledNews(slotsForEdition(medium, date), {}, medium, date);
  assert.ok(filled.slots.some((s) => s.moduleIds.includes("maze")));
  const kid = buildFreeKid(medium, date);
  kid.slots = filled.slots;
  kid.modules = filled.slots.flatMap((s) => s.moduleIds);
  const job = generateStrip(kid, freeSettings(medium), { dateISO: date, nonce: 0 });
  const maze = job.sections.find((s) => s.maze)?.maze;
  assert.ok(maze);
  assert.equal(maze.cols, 19);
  assert.equal(maze.rows, 25);
  assert.equal(passageCount(maze, "generic-7-10 2026-11-20"), 19 * 25 - 1 + 6);
  assertMaze(maze, 8, "generic-7-10 2026-11-20 substitute");
});
