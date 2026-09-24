import type { AgeBand, ModuleId } from "./types";

/**
 * Difficulty is a 1–20 dial per module on a dispatch.
 *   1  ≈ kindergarten        20 ≈ adult
 * Age band picks the default; the parent can nudge each module up or down.
 */
export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 20;

export function clampDifficulty(d: number): number {
  if (!Number.isFinite(d)) return 10;
  return Math.min(DIFFICULTY_MAX, Math.max(DIFFICULTY_MIN, Math.round(d)));
}

/** Age band → default difficulty (10–12 defaults to 11, per spec). */
export function defaultDifficultyForBand(band: AgeBand): number {
  if (band === "4-6") return 3;
  if (band === "7-9") return 7;
  return 11;
}

/** Difficulty → age band, for content that is age-graded (words, jokes, news…). */
export function bandFromDifficulty(d: number): AgeBand {
  const x = clampDifficulty(d);
  if (x <= 6) return "4-6";
  if (x <= 12) return "7-9";
  return "10-12";
}

/** Modules whose puzzle difficulty can be tuned per dispatch. */
export const DIFFICULTY_MODULES: ReadonlySet<ModuleId> = new Set<ModuleId>([
  "maze",
  "sudoku",
  "wordfind",
  "dots",
]);

export function isDifficultyModule(id: ModuleId): boolean {
  return DIFFICULTY_MODULES.has(id);
}

/** Maze grid grows smoothly with difficulty (continuous with the old bands). */
export function mazeSizeForDifficulty(d: number): { cols: number; rows: number } {
  const x = clampDifficulty(d);
  const cols = Math.max(6, Math.round(4 + x * 1.9)); // d3≈10, d7≈17, d11≈25, d20≈42
  const rows = Math.round(cols * 1.31);
  return { cols, rows };
}

/** Sudoku: 4×4 → 6×6 → 9×9, with more blanks as difficulty climbs. */
export function sudokuConfigForDifficulty(d: number): {
  size: number; boxRows: number; boxCols: number; blanks: number; label: string;
} {
  const x = clampDifficulty(d);
  if (x <= 6) {
    return { size: 4, boxRows: 2, boxCols: 2, blanks: Math.min(9, 4 + Math.round(x * 0.7)), label: "4×4 Number Grid" };
  }
  if (x <= 13) {
    return { size: 6, boxRows: 2, boxCols: 3, blanks: Math.min(20, 9 + (x - 7) * 2), label: "6×6 Number Grid" };
  }
  const blanks = Math.min(46, 28 + (x - 14) * 3);
  return { size: 9, boxRows: 3, boxCols: 3, blanks, label: x >= 18 ? "Sudoku" : "Easy Sudoku" };
}

/** Word search grows and adds directions with difficulty. */
export function wordFindConfigForDifficulty(d: number): {
  cols: number; rows: number; count: number; diagonals: boolean; backwards: boolean;
} {
  const x = clampDifficulty(d);
  const size = Math.min(14, Math.max(6, Math.round(5 + x * 0.5)));
  const count = Math.min(12, Math.max(4, Math.round(3 + x * 0.5)));
  return { cols: size, rows: size, count, diagonals: x >= 6, backwards: x >= 11 };
}

/** How many candidate mazes to score when selecting the hardest (more = harder). */
export function mazeCandidatesForDifficulty(d: number): number {
  return Math.min(44, 6 + clampDifficulty(d) * 2);
}
