import type { ModuleCategoryId, ModuleId, ModuleSlot, SlotSize } from "./types";

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  blurb: string;
  category: ModuleCategoryId;
  defaultOn: boolean;
  /** Natural card footprint for this module. */
  size: SlotSize;
}

export interface ModuleCategoryMeta {
  id: ModuleCategoryId;
  name: string;
  blurb: string;
}

/** Display order for the modules UI. */
export const MODULE_CATEGORIES: ModuleCategoryMeta[] = [
  { id: "play", name: "Play / puzzles", blurb: "Mazes, finds, dots, riddles, numbers." },
  { id: "words", name: "Words & language", blurb: "Vocabulary, poems, jokes, Spanish." },
  { id: "facts", name: "Curious facts", blurb: "True things and this-day history." },
  { id: "news", name: "Kid-friendly news", blurb: "Curated wonder blurbs — not live scrapes." },
  { id: "today", name: "Today’s world", blurb: "Weather, watchlist, calendar." },
];

export const MODULE_CATALOG: ModuleMeta[] = [
  // Play / puzzles
  { id: "maze", name: "Maze", blurb: "A fresh, solvable maze. Harder as they grow.", category: "play", defaultOn: true, size: "double" },
  { id: "wordfind", name: "Word Find", blurb: "Tiny word-search that fits the 58mm strip.", category: "play", defaultOn: false, size: "double" },
  { id: "dots", name: "Connect the Dots", blurb: "Funny numbered dots + a silly caption.", category: "play", defaultOn: false, size: "double" },
  { id: "riddle", name: "Riddle", blurb: "Think first — answer shows in the app, never on paper.", category: "play", defaultOn: false, size: "half" },
  { id: "sudoku", name: "Sudoku", blurb: "4×4 for little kids, 6×6, then easy 9×9 — always one unique solution. Answer key stays off the paper.", category: "play", defaultOn: false, size: "full" },
  { id: "battleship", name: "Battleship Solitaire", blurb: "Place the fleet using the row/column counts — ships never touch. One unique solution; answer shows in the app.", category: "play", defaultOn: false, size: "full" },
  { id: "crossword", name: "Themed Crossword", blurb: "A real criss-cross crossword on a daily theme, with Across and Down clues. Answers show in the app.", category: "play", defaultOn: false, size: "double" },
  { id: "sequence", name: "Number Sequence", blurb: "Spot the pattern and find the next number. Difficulty scales the trickiness; answer shows in the app.", category: "play", defaultOn: false, size: "half" },
  // Words & language
  { id: "word", name: "Word of the Day", blurb: "A real word, said out loud, used in a sentence — age-banded.", category: "words", defaultOn: true, size: "half" },
  { id: "poem", name: "Poem of the Day", blurb: "A short printable poem — soft, silly, or thoughtful.", category: "words", defaultOn: false, size: "full" },
  { id: "joke", name: "Breakfast Joke", blurb: "One groaner a day. Age-checked, no mean stuff.", category: "words", defaultOn: true, size: "half" },
  { id: "spanish", name: "Spanish Word", blurb: "A second language bite beside English Word of the Day.", category: "words", defaultOn: false, size: "half" },
  { id: "logicgrid", name: "Logic Grid", blurb: "Who has what? Use the clues to fill in the grid. Every puzzle has exactly one answer.", category: "play", defaultOn: false, size: "full" },
  { id: "animal", name: "Animal of the Day", blurb: "A different animal each day to color in, with where it lives, how big it is and a fun fact.", category: "facts", defaultOn: false, size: "full" },
  { id: "tonguetwister", name: "Tongue Twister", blurb: "A tongue twister to say fast, with a tally box. Easy ones for little kids, tricky ones for olders.", category: "words", defaultOn: false, size: "half" },
  { id: "cryptogram", name: "Secret Code", blurb: "Crack a coded message: a number code for little kids, a letter shift for middle, a real cryptogram for olders. Answer shows in the app.", category: "play", defaultOn: false, size: "half" },
  { id: "numbercross", name: "Number Cross", blurb: "A criss-cross where every answer is a number and every clue is a little calculation. Answers show in the app.", category: "play", defaultOn: false, size: "full" },
  { id: "scramble", name: "Word Scramble", blurb: "Unscramble the letters with a hint — answer shows in the app, never on paper.", category: "words", defaultOn: false, size: "half" },
  // Curious facts
  { id: "usstate", name: "Name the State", blurb: "A US state outline, with a small US map showing where it is. Easy names the state + marks its capital with a star; harder shows just the outline (answer in the app).", category: "facts", defaultOn: false, size: "full" },
  { id: "country_eu", name: "Countries: Europe", blurb: "A European country outline, with a small map of Europe showing where it is. Easy names it + stars the capital; harder is outline-only (answer in the app).", category: "facts", defaultOn: false, size: "full" },
  { id: "country_af", name: "Countries: Africa", blurb: "An African country outline, with a small map of Africa showing where it is. Easy names it + stars the capital; harder is outline-only (answer in the app).", category: "facts", defaultOn: false, size: "full" },
  { id: "country_asia_oce", name: "Countries: Asia & Oceania", blurb: "An Asian or Oceanian country outline, with a small regional map showing where it is. Easy names it + stars the capital; harder is outline-only.", category: "facts", defaultOn: false, size: "full" },
  { id: "country_americas", name: "Countries: Americas", blurb: "A country of the Americas (N or S), with a small map showing where it is. Easy names it + stars the capital; harder is outline-only.", category: "facts", defaultOn: false, size: "full" },
  { id: "history", name: "This Day in History", blurb: "Something that really happened on this date — kid-appropriate.", category: "facts", defaultOn: true, size: "half" },
  { id: "records", name: "World Records", blurb: "A real world record — fastest, biggest, oldest, most — with something to compare it to.", category: "facts", defaultOn: false, size: "half" },
  { id: "fact", name: "Fun Fact", blurb: "One true thing worth knowing before cereal.", category: "facts", defaultOn: true, size: "half" },
  // Kid-friendly news
  { id: "news_world", name: "World News", blurb: "Wonder from far away — animals, space, discoveries.", category: "news", defaultOn: false, size: "double" },
  { id: "news_national", name: "National News", blurb: "Real kind, kid-safe US stories: parks, science fairs, community wins.", category: "news", defaultOn: false, size: "double" },
  // Hometown News (news_city) is parked: local feeds rarely yield kid-safe stories,
  // and it's the one news cost that grows per city. Pipeline code is kept.
  { id: "news_tech", name: "Tech News", blurb: "Real robots, code, and gadgets news — curiosity, not hype.", category: "news", defaultOn: false, size: "double" },
  { id: "news_gamer", name: "Gamer News", blurb: "Real gaming news: new releases, updates, and esports results.", category: "news", defaultOn: false, size: "double" },
  // Today’s world
  { id: "weather", name: "Weather", blurb: "Today’s sky and a jacket tip, plus the week ahead.", category: "today", defaultOn: true, size: "half" },
  { id: "stocks", name: "Stock Watchlist", blurb: "Parent-picked tickers — a simple up-or-down check.", category: "today", defaultOn: false, size: "double" },
  { id: "sports", name: "Sports Scores", blurb: "Pick your favorite teams — last result and next game, real scores.", category: "today", defaultOn: false, size: "full" },
  { id: "calendar", name: "Calendar", blurb: "A short list of today’s events. Stub list you can edit.", category: "today", defaultOn: false, size: "half" },
];

/**
 * Card sizes each module can be placed in. Grid and picture puzzles need at
 * least a 1× card (a ½ card makes the grid unreadable); the crossword needs
 * 2×; short text bites fit ½ or 1×. Modules not listed allow only their
 * natural size.
 */
const MODULE_SIZES: Partial<Record<ModuleId, SlotSize[]>> = {
  maze: ["full", "double"],
  wordfind: ["full", "double"],
  dots: ["full", "double"],
  sudoku: ["full", "double"],
  battleship: ["full", "double"],
  crossword: ["double"],
  numbercross: ["full", "double"],
  usstate: ["full", "double"],
  country_eu: ["full", "double"],
  country_af: ["full", "double"],
  country_asia_oce: ["full", "double"],
  country_americas: ["full", "double"],
  news_world: ["full", "double"],
  news_national: ["full", "double"],
  news_tech: ["full", "double"],
  news_gamer: ["full", "double"],
  stocks: ["full", "double"],
  sports: ["full", "double"],
  weather: ["half", "full", "double"],
  poem: ["half", "full", "double"],
  word: ["half", "full"],
  joke: ["half", "full"],
  riddle: ["half", "full"],
  sequence: ["half", "full"],
  scramble: ["half", "full"],
  cryptogram: ["half", "full"],
  tonguetwister: ["half", "full"],
  animal: ["full"],
  logicgrid: ["full"],
  spanish: ["half", "full"],
  fact: ["half", "full"],
  history: ["half", "full"],
  calendar: ["half", "full"],
};

/** Sizes a module may be placed in (always includes its natural size). */
export function moduleSizes(id: ModuleId): SlotSize[] {
  const list = MODULE_SIZES[id] ?? [moduleSize(id)];
  return list.includes(moduleSize(id)) ? list : [...list, moduleSize(id)];
}

/** Natural size for a module (used as the card default). */
export function moduleSize(id: ModuleId): SlotSize {
  return MODULE_CATALOG.find((m) => m.id === id)?.size ?? "full";
}

export interface Template {
  id: string;
  name: string;
  blurb: string;
  slots: { moduleIds: ModuleId[]; size: SlotSize }[];
}

/** A few ready-made layouts (each fills two columns of 4 units). */
export const TEMPLATES: Template[] = [
  {
    id: "news-day",
    name: "News Day",
    blurb: "Big news column + weather, word, joke",
    slots: [
      { moduleIds: ["news_world"], size: "double" },
      { moduleIds: ["weather"], size: "full" },
      { moduleIds: ["word"], size: "half" },
      { moduleIds: ["joke"], size: "half" },
    ],
  },
  {
    id: "puzzle-morning",
    name: "Puzzle Morning",
    blurb: "Maze + word find, word, fact, riddle",
    slots: [
      { moduleIds: ["maze"], size: "full" },
      { moduleIds: ["wordfind"], size: "full" },
      { moduleIds: ["word"], size: "half" },
      { moduleIds: ["fact"], size: "half" },
      { moduleIds: ["joke"], size: "half" },
      { moduleIds: ["riddle"], size: "half" },
    ],
  },
  {
    id: "classic",
    name: "Classic",
    blurb: "Weather + maze, and four quick bites",
    slots: [
      { moduleIds: ["weather"], size: "full" },
      { moduleIds: ["maze"], size: "full" },
      { moduleIds: ["word"], size: "half" },
      { moduleIds: ["joke"], size: "half" },
      { moduleIds: ["fact"], size: "half" },
      { moduleIds: ["history"], size: "half" },
    ],
  },
  {
    id: "explorer",
    name: "Explorer",
    blurb: "News + fun fact | maze + spanish + scramble",
    slots: [
      { moduleIds: ["news_national"], size: "double" },
      { moduleIds: ["maze"], size: "full" },
      { moduleIds: ["spanish"], size: "half" },
      { moduleIds: ["scramble"], size: "half" },
    ],
  },
];

/** Build ModuleSlots from a template (for applying in the editor). */
export function templateToSlots(t: Template): ModuleSlot[] {
  // Greedily balance a template's cards across the two print columns by
  // ½-slot units (half=1, full=2, double=4) so Letter sheets fill both sides.
  let uA = 0;
  let uB = 0;
  return t.slots.map((s, i) => {
    const size = moduleSize(s.moduleIds[0]);
    const u = size === "double" ? 4 : size === "half" ? 1 : 2;
    const column = uA <= uB ? 0 : 1;
    if (column === 0) uA += u;
    else uB += u;
    return {
      id: `slot-${i}`,
      moduleIds: [...s.moduleIds],
      mode: "single" as const,
      cursor: 0,
      size,
      column,
    };
  });
}

export interface MarketplacePack {
  id: string;
  name: string;
  blurb: string;
  price: string;
  status: "coming-soon";
}

/** Paid packs later — first-party modules above are not listed here. */
export const MARKETPLACE_PACKS: MarketplacePack[] = [
  { id: "space", name: "Space Week", blurb: "Planets, rockets, and one constellation to find after dark.", price: "$2.99", status: "coming-soon" },
  { id: "sports", name: "Scorecard", blurb: "Last night’s kid-friendly scores for the teams you pick.", price: "$1.99", status: "coming-soon" },
  { id: "gratitude", name: "Gratitude Note", blurb: "One prompt to name something good before the bus.", price: "$1.99", status: "coming-soon" },
  { id: "tongue", name: "Tongue Twister", blurb: "Say it three times fast. Age-banded and spit-free.", price: "$1.99", status: "coming-soon" },
];

export function moduleById(id: ModuleId): ModuleMeta {
  const found = MODULE_CATALOG.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown module ${id}`);
  return found;
}

export function modulesByCategory(): { category: ModuleCategoryMeta; modules: ModuleMeta[] }[] {
  return MODULE_CATEGORIES.map((category) => ({
    category,
    modules: MODULE_CATALOG.filter((m) => m.category === category.id),
  })).filter((g) => g.modules.length > 0);
}

export const ALL_MODULE_IDS: ModuleId[] = MODULE_CATALOG.map((m) => m.id);

export function isModuleId(id: string): id is ModuleId {
  return MODULE_CATALOG.some((m) => m.id === id);
}
