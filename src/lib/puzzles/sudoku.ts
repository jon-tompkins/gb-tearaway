import type { AgeBand, SudokuData } from "../types";
import { mulberry32 } from "../rng";

function configForBand(band: AgeBand): {
  size: number; boxRows: number; boxCols: number; blanks: number; label: string;
} {
  if (band === "4-6") return { size: 4, boxRows: 2, boxCols: 2, blanks: 6, label: "4×4 Number Grid" };
  if (band === "7-9") return { size: 6, boxRows: 2, boxCols: 3, blanks: 14, label: "6×6 Number Grid" };
  return { size: 9, boxRows: 3, boxCols: 3, blanks: 32, label: "Easy Sudoku" };
}

function isValid(
  grid: number[][], r: number, c: number, n: number,
  size: number, boxRows: number, boxCols: number,
): boolean {
  for (let i = 0; i < size; i++) {
    if (grid[r][i] === n || grid[i][c] === n) return false;
  }
  const br = Math.floor(r / boxRows) * boxRows;
  const bc = Math.floor(c / boxCols) * boxCols;
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      if (grid[br + i][bc + j] === n) return false;
    }
  }
  return true;
}

function fillGrid(
  grid: number[][], size: number, boxRows: number, boxCols: number, rand: () => number,
): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 0) continue;
      const nums = Array.from({ length: size }, (_, i) => i + 1);
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      for (const n of nums) {
        if (!isValid(grid, r, c, n, size, boxRows, boxCols)) continue;
        grid[r][c] = n;
        if (fillGrid(grid, size, boxRows, boxCols, rand)) return true;
        grid[r][c] = 0;
      }
      return false;
    }
  }
  return true;
}

export function generateSudoku(seed: number, band: AgeBand): SudokuData {
  const { size, boxRows, boxCols, blanks, label } = configForBand(band);
  const rand = mulberry32(seed);
  const solution = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  fillGrid(solution, size, boxRows, boxCols, rand);
  const puzzle = solution.map((row) => [...row]);
  const positions = Array.from({ length: size * size }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let i = 0; i < blanks && i < positions.length; i++) {
    const p = positions[i];
    puzzle[Math.floor(p / size)][p % size] = 0;
  }
  return { size, boxRows, boxCols, puzzle, solution, label };
}

export function sudokuToSvg(data: SudokuData, opts: { showSolution?: boolean } = {}): string {
  const { size, boxRows, boxCols, puzzle, solution } = data;
  const grid = opts.showSolution ? solution : puzzle;
  const cell = size <= 4 ? 36 : size <= 6 ? 30 : 24;
  const pad = 4;
  const w = size * cell + pad * 2;
  const h = size * cell + pad * 2;
  const parts: string[] = [];
  parts.push(`<rect x="${pad}" y="${pad}" width="${size * cell}" height="${size * cell}" fill="#fff" stroke="#111" stroke-width="2"/>`);
  for (let i = 1; i < size; i++) {
    const thick = i % boxCols === 0;
    const x = pad + i * cell;
    parts.push(`<line x1="${x}" y1="${pad}" x2="${x}" y2="${pad + size * cell}" stroke="#111" stroke-width="${thick ? 2.5 : 1}"/>`);
  }
  for (let i = 1; i < size; i++) {
    const thick = i % boxRows === 0;
    const y = pad + i * cell;
    parts.push(`<line x1="${pad}" y1="${y}" x2="${pad + size * cell}" y2="${y}" stroke="#111" stroke-width="${thick ? 2.5 : 1}"/>`);
  }
  const fontSize = size <= 4 ? 18 : size <= 6 ? 15 : 12;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const n = grid[r][c];
      if (!n) continue;
      const given = puzzle[r][c] !== 0;
      const fill = opts.showSolution && !given ? "#c45c26" : "#111";
      const x = pad + c * cell + cell / 2;
      const y = pad + r * cell + cell / 2 + fontSize * 0.35;
      parts.push(`<text x="${x}" y="${y}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${fontSize}" font-weight="700" fill="${fill}">${n}</text>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Number puzzle">${parts.join("")}</svg>`;
}
