import type { AgeBand, WordFindData } from "../types";
import { mulberry32, pick, shuffle } from "../rng";

const WORDS_46 = ["CAT", "SUN", "HAT", "DOG", "BUG", "MAP", "CUP", "BEE", "OWL", "PIG", "BAT", "EGG"];
const WORDS_79 = ["STAR", "FROG", "CAKE", "MOON", "BIRD", "SHIP", "TREE", "RAIN", "BOOK", "FISH", "KITE", "LEAF"];
const WORDS_1012 = ["COMET", "ROBOT", "RIVER", "CLOUD", "BRAVE", "QUEST", "SPARK", "OCEAN", "PIANO", "MAPLE", "SOLAR", "PIXEL"];

function poolFor(band: AgeBand): string[] {
  if (band === "4-6") return WORDS_46;
  if (band === "7-9") return WORDS_79;
  return WORDS_1012;
}

function sizeFor(band: AgeBand): { cols: number; rows: number; count: number } {
  if (band === "4-6") return { cols: 6, rows: 6, count: 4 };
  if (band === "7-9") return { cols: 7, rows: 7, count: 5 };
  return { cols: 8, rows: 8, count: 5 };
}

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [0, -1],
  [-1, 0],
];

function canPlace(grid: (string | null)[][], word: string, r: number, c: number, dr: number, dc: number): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) return false;
    const ch = grid[rr][cc];
    if (ch && ch !== word[i]) return false;
  }
  return true;
}

function place(grid: (string | null)[][], word: string, r: number, c: number, dr: number, dc: number) {
  for (let i = 0; i < word.length; i++) {
    grid[r + dr * i][c + dc * i] = word[i];
  }
}

export function generateWordFind(seed: number, band: AgeBand): WordFindData {
  const rng = mulberry32(seed);
  const { cols, rows, count } = sizeFor(band);
  const candidates = shuffle(rng, poolFor(band));
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  const placed: string[] = [];

  for (const word of candidates) {
    if (placed.length >= count) break;
    const dirs = shuffle(rng, DIRS);
    let ok = false;
    for (let attempt = 0; attempt < 40 && !ok; attempt++) {
      const dir = dirs[attempt % dirs.length];
      const r = Math.floor(rng() * rows);
      const c = Math.floor(rng() * cols);
      if (!canPlace(grid, word, r, c, dir[0], dir[1])) continue;
      place(grid, word, r, c, dir[0], dir[1]);
      placed.push(word);
      ok = true;
    }
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const filled: string[][] = grid.map((row) =>
    row.map((ch) => ch ?? alphabet[Math.floor(rng() * 26) % 26]!),
  );

  if (placed.length === 0) {
    placed.push(pick(rng, poolFor(band)));
  }

  return { cols, rows, grid: filled, words: placed };
}

export function wordFindToSvg(data: WordFindData, maxWidth = 340): string {
  const { cols, rows, grid } = data;
  const cell = Math.min(28, Math.floor(maxWidth / cols));
  const pad = 4;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  const font = Math.max(10, Math.floor(cell * 0.55));
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cell;
      const y = pad + r * cell;
      cells.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#1c1915" stroke-width="1"/>`,
      );
      cells.push(
        `<text x="${x + cell / 2}" y="${y + cell / 2 + font * 0.35}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="${font}" font-weight="700" fill="#1c1915">${grid[r][c]}</text>`,
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Word find puzzle">${cells.join("")}</svg>`;
}
