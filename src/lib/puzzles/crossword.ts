/**
 * Themed criss-cross crossword. Words from one theme are interlocked on a
 * grid (every word crosses another; no two letters touch unless they belong
 * to a word running through them), numbered, and printed with Across/Down
 * clues. Answers go to the in-app key / QR, never on paper.
 *
 * Dependency-free (RNG injected) so `scripts/verify-crossword.ts` can run it
 * under `node --experimental-strip-types`.
 */

type RNG = () => number;

export interface CrosswordEntry {
  word: string;
  clue: string;
}

export type Dir = "across" | "down";

export interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  dir: Dir;
  /** Clue number printed in the word's first square. */
  num: number;
}

export interface CrosswordData {
  rows: number;
  cols: number;
  /** Letter per square, null where there is no square. */
  grid: (string | null)[][];
  words: PlacedWord[];
  theme: string;
}

function shuffle<T>(rng: RNG, list: readonly T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** True if `clue` contains `word` as a whole word (case-insensitive). */
function mentions(clue: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, "i").test(clue);
}

interface Placement {
  word: string;
  clue: string;
  row: number;
  col: number;
  dir: Dir;
}

/** Sparse working board on an unbounded coordinate plane. */
class Board {
  cells = new Map<string, { ch: string; across: boolean; down: boolean }>();
  placed: Placement[] = [];
  minR = 0;
  maxR = -1;
  minC = 0;
  maxC = -1;

  private k(r: number, c: number) {
    return `${r},${c}`;
  }
  get(r: number, c: number) {
    return this.cells.get(this.k(r, c));
  }

  /** Crossings if `word` fits at (r,c) in `dir`, or -1 if it breaks a rule. */
  fit(word: string, r: number, c: number, dir: Dir, maxSize: number): number {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    // The squares just before and after the word must be empty.
    if (this.get(r - dr, c - dc) || this.get(r + dr * word.length, c + dc * word.length)) return -1;
    let crossings = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const cell = this.get(rr, cc);
      if (cell) {
        if (cell.ch !== word[i]) return -1;
        if (dir === "across" ? cell.across : cell.down) return -1; // overlapping a same-direction word
        crossings++;
      } else {
        // A new letter may not sit beside another letter across the word's
        // direction (that would spell an unintended word).
        if (this.get(rr + dc, cc + dr) || this.get(rr - dc, cc - dr)) return -1;
      }
    }
    if (this.placed.length && crossings === 0) return -1;
    // Keep the puzzle within the size budget.
    const r2 = r + dr * (word.length - 1);
    const c2 = c + dc * (word.length - 1);
    const h = Math.max(this.maxR, r2) - Math.min(this.placed.length ? this.minR : r, r) + 1;
    const w = Math.max(this.maxC, c2) - Math.min(this.placed.length ? this.minC : c, c) + 1;
    if (h > maxSize || w > maxSize) return -1;
    return crossings;
  }

  place(p: Placement) {
    const dr = p.dir === "down" ? 1 : 0;
    const dc = p.dir === "across" ? 1 : 0;
    for (let i = 0; i < p.word.length; i++) {
      const key = this.k(p.row + dr * i, p.col + dc * i);
      const cell = this.cells.get(key) ?? { ch: p.word[i], across: false, down: false };
      if (p.dir === "across") cell.across = true;
      else cell.down = true;
      this.cells.set(key, cell);
    }
    const r2 = p.row + dr * (p.word.length - 1);
    const c2 = p.col + dc * (p.word.length - 1);
    if (!this.placed.length) {
      this.minR = p.row;
      this.maxR = r2;
      this.minC = p.col;
      this.maxC = c2;
    } else {
      this.minR = Math.min(this.minR, p.row);
      this.maxR = Math.max(this.maxR, r2);
      this.minC = Math.min(this.minC, p.col);
      this.maxC = Math.max(this.maxC, c2);
    }
    this.placed.push(p);
  }

  area() {
    return (this.maxR - this.minR + 1) * (this.maxC - this.minC + 1);
  }

  /** Interlock quality: total shared squares, and how many words cross only once. */
  interlock(): { shared: number; singles: number } {
    let shared = 0;
    for (const cell of this.cells.values()) if (cell.across && cell.down) shared++;
    let singles = 0;
    for (const p of this.placed) {
      const dr = p.dir === "down" ? 1 : 0;
      const dc = p.dir === "across" ? 1 : 0;
      let n = 0;
      for (let i = 0; i < p.word.length; i++) {
        const c = this.get(p.row + dr * i, p.col + dc * i);
        if (c && c.across && c.down) n++;
      }
      if (n <= 1) singles++;
    }
    return { shared, singles };
  }
}

function attempt(rng: RNG, entries: CrosswordEntry[], target: number, maxSize: number): Board {
  const board = new Board();
  // Longer words first (they make the best spine), shuffled within length.
  const pool = shuffle(rng, entries).sort((a, b) => b.word.length - a.word.length);
  const first = pool.splice(Math.floor(rng() * Math.min(3, pool.length)), 1)[0];
  board.place({ ...first, row: 0, col: 0, dir: rng() < 0.5 ? "across" : "down" });

  while (board.placed.length < target) {
    let best: { p: Placement; score: number } | null = null;
    for (const e of pool) {
      // Don't let one clue give away another answer in the same grid.
      if (board.placed.some((pl) => mentions(e.clue, pl.word) || mentions(pl.clue, e.word))) continue;
      for (const pl of board.placed) {
        for (let i = 0; i < pl.word.length; i++) {
          for (let j = 0; j < e.word.length; j++) {
            if (pl.word[i] !== e.word[j]) continue;
            const dir: Dir = pl.dir === "across" ? "down" : "across";
            const row = pl.dir === "across" ? pl.row - j : pl.row + i;
            const col = pl.dir === "across" ? pl.col + i : pl.col - j;
            const crossings = board.fit(e.word, row, col, dir, maxSize);
            if (crossings < 1) continue;
            // Prefer more crossings and a compact, squarish grid; jitter breaks ties.
            const before = board.area();
            const trial = new Board();
            trial.minR = Math.min(board.minR, row);
            trial.maxR = Math.max(board.maxR, dir === "down" ? row + e.word.length - 1 : row);
            trial.minC = Math.min(board.minC, col);
            trial.maxC = Math.max(board.maxC, dir === "across" ? col + e.word.length - 1 : col);
            const h = trial.maxR - trial.minR + 1;
            const w = trial.maxC - trial.minC + 1;
            const score = crossings * 30 - (h * w - before) * 0.4 - Math.abs(h - w) * 0.6 + rng() * 2;
            if (!best || score > best.score) best = { p: { ...e, row, col, dir }, score };
          }
        }
      }
    }
    if (!best) break;
    board.place(best.p);
    pool.splice(pool.findIndex((e) => e.word === best!.p.word), 1);
  }
  return board;
}

/** Crop to the used area and number squares in reading order. */
function finish(board: Board, theme: string): CrosswordData {
  const rows = board.maxR - board.minR + 1;
  const cols = board.maxC - board.minC + 1;
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array<string | null>(cols).fill(null));
  for (const [key, cell] of board.cells) {
    const [r, c] = key.split(",").map(Number);
    grid[r - board.minR][c - board.minC] = cell.ch;
  }
  const words = board.placed.map((p) => ({ ...p, row: p.row - board.minR, col: p.col - board.minC, num: 0 }));
  const starts = [...new Set(words.map((w) => `${w.row},${w.col}`))]
    .map((s) => s.split(",").map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const numAt = new Map(starts.map(([r, c], i) => [`${r},${c}`, i + 1]));
  for (const w of words) w.num = numAt.get(`${w.row},${w.col}`)!;
  words.sort((a, b) => a.num - b.num || (a.dir === "across" ? -1 : 1));
  return { rows, cols, grid, words, theme };
}

/**
 * Build a crossword from a theme's entries: up to `target` words inside a
 * `maxSize`×`maxSize` box. Tries several layouts and keeps the one with the
 * most words, then the most compact. Returns null if fewer than 3 words fit.
 */
export function buildCrossword(
  rng: RNG,
  theme: string,
  entries: CrosswordEntry[],
  opts: { target: number; maxSize: number; attempts?: number },
): CrosswordData | null {
  const usable = entries.filter((e) => /^[A-Z]+$/.test(e.word) && e.word.length >= 2 && e.word.length <= opts.maxSize);
  if (usable.length < 3) return null;
  // Try many layouts (each takes well under a millisecond) and keep the best:
  // most words first, then the most interlocked — more shared squares, fewer
  // words that cross only one other — then the most compact.
  const quality = (b: Board) => {
    const { shared, singles } = b.interlock();
    return b.placed.length * 1000 + shared * 10 - singles * 6 - b.area() * 0.05;
  };
  let best: Board | null = null;
  let bestQ = -Infinity;
  const started = Date.now();
  for (let t = 0; t < (opts.attempts ?? 400); t++) {
    const b = attempt(rng, usable, opts.target, opts.maxSize);
    const q = quality(b);
    if (q > bestQ) {
      best = b;
      bestQ = q;
    }
    if (Date.now() - started > 250) break; // time cap for very large themes
  }
  if (!best || best.placed.length < 3) return null;
  return finish(best, theme);
}

/** Grid size and word count for an appropriateness level (1-20). */
export function crosswordConfigForDifficulty(d: number): { target: number; maxSize: number } {
  const x = Math.min(20, Math.max(1, Math.round(Number.isFinite(d) ? d : 10)));
  return {
    target: Math.min(13, Math.max(5, Math.round(4 + x * 0.45))),
    maxSize: Math.min(14, Math.max(8, Math.round(7 + x * 0.35))),
  };
}

/**
 * Independent rule check (used by tests): every horizontal/vertical run of 2+
 * letters is exactly one placed word, words are connected, and numbers match
 * reading order. Returns a list of problems (empty = valid).
 */
export function validateCrossword(cw: CrosswordData): string[] {
  const problems: string[] = [];
  const at = (r: number, c: number) => (r >= 0 && c >= 0 && r < cw.rows && c < cw.cols ? cw.grid[r][c] : null);
  for (const w of cw.words) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.row + (w.dir === "down" ? i : 0);
      const c = w.col + (w.dir === "across" ? i : 0);
      if (at(r, c) !== w.word[i]) problems.push(`${w.word} letter ${i} mismatch`);
    }
  }
  const key = (r: number, c: number, d: Dir) => `${r},${c},${d}`;
  const starts = new Set(cw.words.map((w) => key(w.row, w.col, w.dir)));
  const lengths = new Map(cw.words.map((w) => [key(w.row, w.col, w.dir), w.word.length]));
  for (let r = 0; r < cw.rows; r++)
    for (let c = 0; c < cw.cols; c++) {
      if (!at(r, c)) continue;
      for (const d of ["across", "down"] as Dir[]) {
        const pr = d === "down" ? r - 1 : r;
        const pc = d === "across" ? c - 1 : c;
        if (at(pr, pc)) continue; // not the start of a run
        let len = 0;
        while (at(r + (d === "down" ? len : 0), c + (d === "across" ? len : 0))) len++;
        if (len < 2) continue;
        if (!starts.has(key(r, c, d))) problems.push(`unintended ${d} run at ${r},${c} (len ${len})`);
        else if (lengths.get(key(r, c, d)) !== len) problems.push(`${d} run at ${r},${c} is ${len} long, word is ${lengths.get(key(r, c, d))}`);
      }
    }
  // Connectivity over squares.
  const filled: [number, number][] = [];
  for (let r = 0; r < cw.rows; r++) for (let c = 0; c < cw.cols; c++) if (at(r, c)) filled.push([r, c]);
  if (filled.length) {
    const seen = new Set<string>([filled[0].join(",")]);
    const stack = [filled[0]];
    while (stack.length) {
      const [r, c] = stack.pop()!;
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        const k = `${nr},${nc}`;
        if (at(nr, nc) && !seen.has(k)) {
          seen.add(k);
          stack.push([nr, nc]);
        }
      }
    }
    if (seen.size !== filled.length) problems.push("grid is not connected");
  }
  // Numbering: reading order over distinct start squares, 1..n.
  const startSquares = [...new Set(cw.words.map((w) => `${w.row},${w.col}`))]
    .map((s) => s.split(",").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  startSquares.forEach(([r, c], i) => {
    for (const w of cw.words) if (w.row === r && w.col === c && w.num !== i + 1) problems.push(`${w.word} numbered ${w.num}, expected ${i + 1}`);
  });
  if (new Set(cw.words.map((w) => w.word)).size !== cw.words.length) problems.push("duplicate word");
  for (const a of cw.words)
    for (const b of cw.words)
      if (a !== b && new RegExp(`\\b${b.word}\\b`, "i").test(a.clue)) problems.push(`clue for ${a.word} gives away ${b.word}`);
  return problems;
}

/** Printable grid: white squares with clue numbers, no letters. */
export function crosswordToSvg(cw: CrosswordData, opts: { showAnswers?: boolean } = {}): string {
  const s = 20;
  const pad = 1;
  const w = cw.cols * s + pad * 2;
  const h = cw.rows * s + pad * 2;
  const nums = new Map<string, number>();
  for (const word of cw.words) nums.set(`${word.row},${word.col}`, word.num);
  const parts: string[] = [];
  for (let r = 0; r < cw.rows; r++)
    for (let c = 0; c < cw.cols; c++) {
      const ch = cw.grid[r][c];
      if (!ch) continue;
      const x = pad + c * s;
      const y = pad + r * s;
      parts.push(`<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#fff" stroke="#111" stroke-width="1.1"/>`);
      const n = nums.get(`${r},${c}`);
      if (n) parts.push(`<text x="${x + 1.8}" y="${y + 6.6}" font-size="6.2" font-family="Helvetica,Arial,sans-serif" fill="#111">${n}</text>`);
      if (opts.showAnswers)
        parts.push(`<text x="${x + s / 2}" y="${y + s * 0.74}" font-size="12" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" fill="#111">${ch}</text>`);
    }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Crossword grid">${parts.join("")}</svg>`;
}

/** Answer key text for the in-app key / QR page. */
export function crosswordAnswerText(cw: CrosswordData): string {
  const line = (d: Dir) =>
    cw.words
      .filter((w) => w.dir === d)
      .map((w) => `${w.num}. ${w.word}`)
      .join("  ");
  return `Across: ${line("across")}\nDown: ${line("down")}`;
}
