import type { AgeBand } from "../types";
import type { CrosswordEntry } from "../puzzles/crossword";
import { pickRotating, type RotateKey } from "./rotate";
import { CROSSWORD_46 } from "./bank/crossword-46";
import { CROSSWORD_79 } from "./bank/crossword-79";
import { CROSSWORD_1012 } from "./bank/crossword-1012";

export interface CrosswordTheme {
  theme: string;
  bands: AgeBand[];
  entries: CrosswordEntry[];
}

/** Themed word + clue lists for the crossword, written per age band. */
export const CROSSWORD_THEMES: CrosswordTheme[] = [...CROSSWORD_46, ...CROSSWORD_79, ...CROSSWORD_1012];

/** Today's theme for a kid — walks every theme for the band before repeating. */
export function crosswordThemeForDay(band: AgeBand, key: RotateKey): CrosswordTheme {
  const pool = CROSSWORD_THEMES.filter((t) => t.bands.includes(band));
  return pickRotating(pool.length ? pool : CROSSWORD_THEMES, key, `crossword|${band}`);
}
