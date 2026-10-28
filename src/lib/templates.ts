import type { ModuleId, ModuleSlot, PaperSize, SlotSize } from "./types";
import { COLUMN_CAPACITY_UNITS, columnCountForPaper, slotSizeUnits } from "./types";
import { moduleSize } from "./modules";

/** One card: every module in it must share the card's natural size. */
type Card = ModuleId[];

export interface StartTemplate {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Biggest cards first so both columns pack tidily. */
  cards: Card[];
}

/** "Start from a template" presets. Parents tweak them afterwards in the layout editor. */
export const START_TEMPLATES: StartTemplate[] = [
  {
    id: "animal",
    name: "Animal Lover",
    emoji: "🦁",
    blurb: "Animal of the day, nature facts, mazes and dots",
    cards: [["maze"], ["dots"], ["animal"], ["fact", "records"], ["weather"], ["word", "spanish"], ["joke"], ["history", "riddle"]],
  },
  {
    id: "reader",
    name: "Big Reader",
    emoji: "📚",
    blurb: "Poems, vocabulary, word games and a news story",
    cards: [["news_national"], ["wordfind"], ["poem"], ["word", "spanish"], ["scramble", "tonguetwister"], ["fact"], ["weather"], ["joke"]],
  },
  {
    id: "sports",
    name: "Sports Enthusiast",
    emoji: "🏀",
    blurb: "Scores, news on their team, and world records",
    cards: [["maze"], ["sportsnews"], ["sports"], ["records", "fact"], ["weather"], ["word"], ["joke", "riddle"], ["sequence"]],
  },
  {
    id: "gamer",
    name: "Big Gamer",
    emoji: "🎮",
    blurb: "Gaming news, logic puzzles and secret codes",
    cards: [["news_gamer"], ["maze"], ["logicgrid"], ["battleship"], ["sudoku"], ["cryptogram", "sequence"], ["weather"]],
  },
  {
    id: "puzzle",
    name: "Puzzle Whiz",
    emoji: "🧩",
    blurb: "Crosswords, sudoku, logic grids and number games",
    cards: [["crossword"], ["maze"], ["sudoku"], ["logicgrid"], ["numbercross"], ["cryptogram", "sequence"], ["weather"]],
  },
  {
    id: "scientist",
    name: "Little Scientist",
    emoji: "🔬",
    blurb: "Tech news, animals, aircraft and amazing facts",
    cards: [["news_tech"], ["maze"], ["animal"], ["planes"], ["fact", "records"], ["history"], ["weather"], ["sequence", "riddle"]],
  },
];

/** Drop cards into the least-filled column that has room (same rule as packModulesIntoSlots). */
export function templateSlots(t: StartTemplate, paper: PaperSize): ModuleSlot[] {
  const columns = columnCountForPaper(paper);
  const used = new Array<number>(columns).fill(0);
  const slots: ModuleSlot[] = [];
  for (const ids of t.cards) {
    const size: SlotSize = moduleSize(ids[0]);
    const units = slotSizeUnits(size);
    let best = -1;
    for (let c = 0; c < columns; c++) {
      if (used[c] + units <= COLUMN_CAPACITY_UNITS && (best < 0 || used[c] < used[best])) best = c;
    }
    if (best < 0) continue;
    used[best] += units;
    slots.push({
      id: `slot-${slots.length}`,
      moduleIds: ids,
      mode: ids.length > 1 ? "in_order" : "single",
      cursor: 0,
      size,
      column: best,
    });
  }
  return slots;
}
