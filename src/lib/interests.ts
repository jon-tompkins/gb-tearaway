import type { AgeBand, ModuleId } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { packModulesIntoSlots } from "./slots";

/** Plain-language interests → modules. Shared by the page builder wizard and the connector. */
export interface Interest {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  ids: ModuleId[];
  kidsOnly?: boolean;
}

export const INTERESTS: Interest[] = [
  { id: "cross", emoji: "✏️", title: "Crosswords & word games", blurb: "Crossword, word find, word scramble", ids: ["crossword", "wordfind", "scramble"] },
  { id: "num", emoji: "🔢", title: "Number puzzles", blurb: "Sudoku, number patterns, number cross", ids: ["sudoku", "sequence", "numbercross"] },
  { id: "logic", emoji: "🧠", title: "Brain teasers", blurb: "Logic grid and secret codes", ids: ["logicgrid", "cryptogram"] },
  { id: "read", emoji: "📖", title: "Poems & quotes", blurb: "A poem, a famous quote, a word of the day", ids: ["poem", "quote", "word"] },
  { id: "hist", emoji: "🏛️", title: "History & trivia", blurb: "This day in history, fun facts, world records", ids: ["history", "fact", "records"] },
  { id: "maze", emoji: "🌀", title: "Mazes & pictures", blurb: "Mazes, connect the dots, color by number", ids: ["maze", "dots", "colorbynumber"], kidsOnly: true },
  { id: "animals", emoji: "🦁", title: "Animals & nature", blurb: "An animal of the day, jokes and riddles", ids: ["animal", "joke", "riddle"], kidsOnly: true },
];

export const LEVELS: { id: AgeBand; key: "easier" | "medium" | "harder"; title: string; blurb: string }[] = [
  { id: "4-6", key: "easier", title: "Easier", blurb: "Short, simple, quick wins" },
  { id: "7-9", key: "medium", title: "Medium", blurb: "A good everyday mix" },
  { id: "10-12", key: "harder", title: "Harder", blurb: "A real challenge" },
];

export function packedCount(slots: ReturnType<typeof packModulesIntoSlots>): number {
  return slots.reduce((n, s) => n + s.moduleIds.length, 0);
}

/** Add `id` to `list` only if the whole page still fits on the paper. */
export function addIfFits(list: ModuleId[], id: ModuleId): boolean {
  if (list.includes(id)) return false;
  const next = [...list, id];
  if (packedCount(packModulesIntoSlots(next, DEFAULT_SETTINGS.paperSize)) !== next.length) return false;
  list.push(id);
  return true;
}

/** Round-robin one card per interest until the page is full; weather last when anything was picked. */
export function pickFromInterests(chosen: Interest[], extra: ModuleId[] = []): ModuleId[] {
  const out: ModuleId[] = [];
  for (const id of extra) addIfFits(out, id);
  const queues = chosen.map((c) => [...c.ids]);
  let progress = true;
  while (progress) {
    progress = false;
    for (const q of queues) {
      const id = q.shift();
      if (id) {
        addIfFits(out, id);
        progress = true;
      }
    }
  }
  if (chosen.length || extra.length) addIfFits(out, "weather");
  return out;
}
