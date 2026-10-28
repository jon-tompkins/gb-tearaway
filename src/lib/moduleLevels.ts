import type { ModuleId } from "./types";

const BANK = "Content comes from three age sets: dial 1–6 (ages 4–6), 7–10 (7–9), 11+ (10–12).";
const NEWS = "Starts at 5. Stories are rewritten for 7–9 at 5–10 and for 10–12 at 11+.";
const COUNTRY = "Lower levels use well-known countries and capitals; higher levels add harder ones.";
const FLAT = "Not age-tuned: same at every level.";

/**
 * One short line per module: what the 1–20 dial changes. Shown on the module
 * page and in the card's dial popover so parents know what's affected.
 */
export const MODULE_LEVELS: Record<ModuleId, string> = {
  maze: "Smooth scale: about 10×13 cells at 3, 17×22 at 7, 25×33 at 11, up to 42×55.",
  wordfind: "Smooth scale: grid 6→14 and 4→12 words; diagonals from 6, backwards words from 11.",
  dots: "Two ranges: simple shapes at 1–6, trickier shapes from 7.",
  riddle: BANK,
  sudoku: "1–6: 4×4 grid · 7–13: 6×6 · 14+: 9×9. More blanks as it climbs.",
  battleship: "1–5: 6×6 board · 6–10: 7×7 · 11–14: 8×8 · 15+: 9×9 with a bigger fleet.",
  crossword: "Smooth scale: 5→13 words on an 8→14 grid. Theme and clues follow the three age sets.",
  sequence: "1–4: small steps · 5–8: bigger steps, doubling · 9–12: squares, growing jumps · 13+: multi-rule and prime patterns.",
  word: BANK,
  poem: BANK,
  joke: BANK,
  spanish: BANK,
  logicgrid: "Fewer clues up to 10, an extra person to match from 11.",
  planes: "1–6: a school-bus size comparison and a fun fact. 7–9 add length, wingspan and speed; 10+ add first-flight year and crew.",
  animal: "Familiar animals for 1–6; fiercer and extinct ones added from 7. Same fact layout.",
  tonguetwister: "Three age sets: 1–6 short and easy, 7–10 medium, 11+ tricky.",
  cryptogram: BANK,
  numbercross: "Number size grows by set: 1–6 up to 2 digits, 7–10 up to 3, 11+ up to 4.",
  scramble: BANK,
  usstate: "Easier at lower levels (state named, star on the map); harder at 9+ (blank outline).",
  country_eu: COUNTRY,
  country_af: COUNTRY,
  country_asia_oce: COUNTRY,
  country_americas: COUNTRY,
  history: BANK + " The youngest set is smaller.",
  records: BANK,
  fact: BANK,
  news_world: NEWS + " Scary or violent stories are always left out.",
  news_national: NEWS + " Scary or violent stories are always left out.",
  news_city: NEWS,
  news_tech: NEWS,
  news_gamer: NEWS,
  weather: FLAT,
  stocks: FLAT,
  sports: FLAT,
  calendar: FLAT,
};
