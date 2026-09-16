import type { ModuleId } from "./types";

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  blurb: string;
  defaultOn: boolean;
}

export const MODULE_CATALOG: ModuleMeta[] = [
  { id: "word", name: "Word of the Day", blurb: "A real word, said out loud, used in a sentence — age-banded.", defaultOn: true },
  { id: "fact", name: "Fun Fact", blurb: "One true thing worth knowing before cereal.", defaultOn: true },
  { id: "maze", name: "Maze", blurb: "A fresh, solvable maze. Harder as they grow.", defaultOn: true },
  { id: "sudoku", name: "Number Puzzle", blurb: "4×4 for little kids, 6×6, then easy 9×9. Parent key stays off the paper.", defaultOn: false },
  { id: "history", name: "This Day in History", blurb: "Something that really happened on this date — kid-appropriate.", defaultOn: true },
  { id: "weather", name: "Weather", blurb: "Today’s sky via Open-Meteo (no API key) plus a jacket tip.", defaultOn: true },
  { id: "stocks", name: "Stock Watchlist", blurb: "Parent-picked tickers, simple up or down. Demo prices.", defaultOn: false },
  { id: "calendar", name: "Calendar", blurb: "A short list of today’s events. Stub list you can edit.", defaultOn: false },
];

export interface MarketplacePack {
  id: string;
  name: string;
  blurb: string;
  price: string;
  status: "coming-soon";
}

export const MARKETPLACE_PACKS: MarketplacePack[] = [
  { id: "jokes", name: "Breakfast Jokes", blurb: "One groaner a day. Age-checked, no mean stuff.", price: "$1.99", status: "coming-soon" },
  { id: "spanish", name: "Spanish Word Pack", blurb: "A second language beside the English word of the day.", price: "$2.99", status: "coming-soon" },
  { id: "space", name: "Space Week", blurb: "Planets, rockets, and one constellation to find after dark.", price: "$2.99", status: "coming-soon" },
  { id: "sports", name: "Scorecard", blurb: "Last night’s kid-friendly scores for the teams you pick.", price: "$1.99", status: "coming-soon" },
  { id: "doodle", name: "Tiny Doodle", blurb: "A 30-second drawing prompt that fits the strip.", price: "$1.99", status: "coming-soon" },
];

export function moduleById(id: ModuleId): ModuleMeta {
  const found = MODULE_CATALOG.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown module ${id}`);
  return found;
}
