import type { ModuleCategoryId, ModuleId } from "./types";

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  blurb: string;
  category: ModuleCategoryId;
  defaultOn: boolean;
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
  { id: "maze", name: "Maze", blurb: "A fresh, solvable maze. Harder as they grow.", category: "play", defaultOn: true },
  { id: "wordfind", name: "Word Find", blurb: "Tiny word-search that fits the 58mm strip.", category: "play", defaultOn: false },
  { id: "dots", name: "Connect the Dots", blurb: "Funny numbered dots + a silly caption.", category: "play", defaultOn: false },
  { id: "riddle", name: "Riddle", blurb: "Think first — answer printed below for parents.", category: "play", defaultOn: false },
  { id: "sudoku", name: "Number Puzzle", blurb: "4×4 for little kids, 6×6, then easy 9×9. Parent key stays off the paper.", category: "play", defaultOn: false },
  // Words & language
  { id: "word", name: "Word of the Day", blurb: "A real word, said out loud, used in a sentence — age-banded.", category: "words", defaultOn: true },
  { id: "poem", name: "Poem of the Day", blurb: "A short printable poem — soft, silly, or thoughtful.", category: "words", defaultOn: false },
  { id: "joke", name: "Breakfast Joke", blurb: "One groaner a day. Age-checked, no mean stuff.", category: "words", defaultOn: true },
  { id: "spanish", name: "Spanish Word", blurb: "A second language bite beside English Word of the Day.", category: "words", defaultOn: false },
  // Curious facts
  { id: "history", name: "This Day in History", blurb: "Something that really happened on this date — kid-appropriate.", category: "facts", defaultOn: true },
  { id: "fact", name: "Fun Fact", blurb: "One true thing worth knowing before cereal.", category: "facts", defaultOn: true },
  // Kid-friendly news
  { id: "news_world", name: "World News", blurb: "Wonder from far away — animals, space, discoveries.", category: "news", defaultOn: false },
  { id: "news_national", name: "National News", blurb: "Kid-safe US blurbs: parks, science fairs, kindness.", category: "news", defaultOn: false },
  { id: "news_city", name: "Hometown News", blurb: "Generic hometown vibes — library, playground, neighbors.", category: "news", defaultOn: false },
  { id: "news_tech", name: "Tech News", blurb: "Robots, code, and gadgets — curiosity, not hype.", category: "news", defaultOn: false },
  { id: "news_gamer", name: "Gamer News", blurb: "Games, makers, and fair play — age-banded.", category: "news", defaultOn: false },
  // Today’s world
  { id: "weather", name: "Weather", blurb: "Today’s sky via Open-Meteo (no API key) plus a jacket tip.", category: "today", defaultOn: true },
  { id: "stocks", name: "Stock Watchlist", blurb: "Parent-picked tickers, simple up or down. Demo prices.", category: "today", defaultOn: false },
  { id: "calendar", name: "Calendar", blurb: "A short list of today’s events. Stub list you can edit.", category: "today", defaultOn: false },
  // Create
  { id: "doodle", name: "Tiny Doodle", blurb: "A 30-second drawing prompt that fits the strip.", category: "create", defaultOn: false },
  { id: "wyr", name: "Would You Rather", blurb: "Two silly choices. Debate over cereal.", category: "create", defaultOn: false },
];

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
