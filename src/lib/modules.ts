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
  { id: "create", name: "Create", blurb: "Draw and debate." },
];

export const MODULE_CATALOG: ModuleMeta[] = [
  // Play / puzzles
  { id: "maze", name: "Maze", blurb: "A fresh, solvable maze. Harder as they grow.", category: "play", defaultOn: true, size: "double" },
  { id: "wordfind", name: "Word Find", blurb: "Tiny word-search that fits the 58mm strip.", category: "play", defaultOn: false, size: "double" },
  { id: "dots", name: "Connect the Dots", blurb: "Funny numbered dots + a silly caption.", category: "play", defaultOn: false, size: "double" },
  { id: "riddle", name: "Riddle", blurb: "Think first — answer shows in the app, never on paper.", category: "play", defaultOn: false, size: "half" },
  { id: "sudoku", name: "Sudoku", blurb: "4×4 for little kids, 6×6, then easy 9×9 — always one unique solution. Answer key stays off the paper.", category: "play", defaultOn: false, size: "full" },
  { id: "sequence", name: "Number Sequence", blurb: "Spot the pattern and find the next number. Difficulty scales the trickiness; answer shows in the app.", category: "play", defaultOn: false, size: "half" },
  // Words & language
  { id: "word", name: "Word of the Day", blurb: "A real word, said out loud, used in a sentence — age-banded.", category: "words", defaultOn: true, size: "half" },
  { id: "poem", name: "Poem of the Day", blurb: "A short printable poem — soft, silly, or thoughtful.", category: "words", defaultOn: false, size: "full" },
  { id: "joke", name: "Breakfast Joke", blurb: "One groaner a day. Age-checked, no mean stuff.", category: "words", defaultOn: true, size: "half" },
  { id: "spanish", name: "Spanish Word", blurb: "A second language bite beside English Word of the Day.", category: "words", defaultOn: false, size: "half" },
  { id: "scramble", name: "Word Scramble", blurb: "Unscramble the letters with a hint — answer shows in the app, never on paper.", category: "words", defaultOn: false, size: "full" },
  // Curious facts
  { id: "history", name: "This Day in History", blurb: "Something that really happened on this date — kid-appropriate.", category: "facts", defaultOn: true, size: "half" },
  { id: "fact", name: "Fun Fact", blurb: "One true thing worth knowing before cereal.", category: "facts", defaultOn: true, size: "half" },
  // Kid-friendly news
  { id: "news_world", name: "World News", blurb: "Wonder from far away — animals, space, discoveries.", category: "news", defaultOn: false, size: "double" },
  { id: "news_national", name: "National News", blurb: "Kid-safe US blurbs: parks, science fairs, kindness.", category: "news", defaultOn: false, size: "double" },
  { id: "news_city", name: "Hometown News", blurb: "Generic hometown vibes — library, playground, neighbors.", category: "news", defaultOn: false, size: "double" },
  { id: "news_tech", name: "Tech News", blurb: "Robots, code, and gadgets — curiosity, not hype.", category: "news", defaultOn: false, size: "double" },
  { id: "news_gamer", name: "Gamer News", blurb: "Games, makers, and fair play — age-banded.", category: "news", defaultOn: false, size: "double" },
  // Today’s world
  { id: "weather", name: "Weather", blurb: "Today’s sky and a jacket tip, plus the week ahead.", category: "today", defaultOn: true, size: "half" },
  { id: "stocks", name: "Stock Watchlist", blurb: "Parent-picked tickers — a simple up-or-down check.", category: "today", defaultOn: false, size: "double" },
  { id: "calendar", name: "Calendar", blurb: "A short list of today’s events. Stub list you can edit.", category: "today", defaultOn: false, size: "half" },
  // Create
  { id: "doodle", name: "Tiny Doodle", blurb: "A 30-second drawing prompt that fits the strip.", category: "create", defaultOn: false, size: "half" },
  { id: "wyr", name: "Would You Rather", blurb: "Two silly choices. Debate over cereal.", category: "create", defaultOn: false, size: "half" },
];

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
    blurb: "Maze + word find, word, fact, doodle",
    slots: [
      { moduleIds: ["maze"], size: "full" },
      { moduleIds: ["wordfind"], size: "full" },
      { moduleIds: ["word"], size: "half" },
      { moduleIds: ["fact"], size: "half" },
      { moduleIds: ["joke"], size: "half" },
      { moduleIds: ["doodle"], size: "half" },
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
    blurb: "News + fun fact | maze + spanish + doodle",
    slots: [
      { moduleIds: ["news_national"], size: "double" },
      { moduleIds: ["maze"], size: "full" },
      { moduleIds: ["spanish"], size: "half" },
      { moduleIds: ["doodle"], size: "half" },
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
