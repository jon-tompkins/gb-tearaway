export type AgeBand = "4-6" | "7-9" | "10-12";

export type ModuleId =
  | "word"
  | "fact"
  | "maze"
  | "sudoku"
  | "history"
  | "weather"
  | "stocks"
  | "calendar"
  | "joke"
  | "doodle"
  | "riddle"
  | "spanish"
  | "wyr"
  | "poem"
  | "wordfind"
  | "dots"
  | "news_world"
  | "news_national"
  | "news_city"
  | "news_tech"
  | "news_gamer";

/**
 * Paper / slot template.
 * - strip58: 58mm thermal strip → 4 fixed slots
 * - letter: US Letter / N80 roll → 7 fixed slots
 * Legacy paperWidth ("58mm"|"80mm") is migrated to strip58 on read.
 */
export type PaperSize = "strip58" | "letter";

/** @deprecated Use PaperSize. Kept for migrating old store.json. */
export type PaperWidth = "58mm" | "80mm";

export type SlotMode = "single" | "in_order" | "random";

/** Relative footprint of a card on the page: half a cell, one cell, or two. */
export type SlotSize = "half" | "full" | "double";

/** One fixed strip position. May hold multiple modules with a pick mode. */
export interface ModuleSlot {
  id: string;
  moduleIds: ModuleId[];
  mode: SlotMode;
  /** Index into moduleIds for in_order; advanced after generate/print. */
  cursor?: number;
  /** Card footprint. Defaults to "full". */
  size?: SlotSize;
}

export const PAPER_SLOT_COUNTS: Record<PaperSize, number> = {
  strip58: 8,
  letter: 8,
};

export const PAPER_SIZE_META: {
  id: PaperSize;
  label: string;
  blurb: string;
  slots: number;
}[] = [
  {
    id: "strip58",
    label: "58mm strip",
    blurb: "Kitchen thermal strip · stacked column",
    slots: 8,
  },
  {
    id: "letter",
    label: "US Letter (8.5×11)",
    blurb: "Home printer page · 12 slots",
    slots: 8,
  },
];

export type ModuleCategoryId =
  | "play"
  | "words"
  | "facts"
  | "news"
  | "today"
  | "create";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
}

export interface KidProfile {
  id: string;
  name: string;
  ageBand: AgeBand;
  timezone: string;
  printTime: string;
  /** Per-kid paper template (controls slot count). */
  paperSize: PaperSize;
  /** Fixed slots for the chosen paper size. */
  slots: ModuleSlot[];
  /**
   * Legacy flat list — kept in sync as the unique pool across slots.
   * Prefer `slots` + resolveActiveModules for generate/print.
   */
  modules: ModuleId[];
  /** The palette the user has chosen to have available. Cards can only pull from this. */
  accessModules: ModuleId[];
  watchlist: string[];
  events: CalendarEvent[];
  createdAt: string;
}

export interface AppSettings {
  /**
   * Kitchen default paper size for new kids.
   * Active layout lives on each kid (`kid.paperSize` + `kid.slots`).
   */
  paperSize: PaperSize;
  /** @deprecated Migrated to paperSize. */
  paperWidth?: PaperWidth;
  timezone: string;
  printTime: string;
  weatherCity: string;
  weatherZip: string;
  /**
   * Future subscription tier: max unique modules in a kid's pool.
   * null = unlock all first-party modules (MVP default).
   * Do not enforce payments here — structure only.
   */
  modulePoolLimit: number | null;
}

export interface MazeCell {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
}

export interface MazeData {
  cols: number;
  rows: number;
  cells: MazeCell[][];
  /** [row, col] */
  start: [number, number];
  /** [row, col] */
  end: [number, number];
  path: [number, number][];
}

export interface SudokuData {
  size: number;
  boxRows: number;
  boxCols: number;
  puzzle: number[][];
  solution: number[][];
  label: string;
}

export interface WordFindData {
  cols: number;
  rows: number;
  grid: string[][];
  words: string[];
}

export interface DotPoint {
  n: number;
  x: number;
  y: number;
}

export interface DotsData {
  points: DotPoint[];
  caption: string;
  /** viewBox width/height for SVG */
  size: number;
}

export interface WordItem {
  word: string;
  phonetic: string;
  pos: string;
  definition: string;
  example: string;
  tryThis?: string;
}

export interface FactItem {
  fact: string;
  extra: string;
}

/** Live Open-Meteo or offline mock forecast. */
export interface WeatherPeriod {
  label: string; // Morning / Afternoon / Evening
  code: number; // WMO weather code
  tempF: number | null;
}
export interface WeatherDay {
  day: string; // Mon, Tue…
  code: number;
  hi: number | null;
  lo: number | null;
}
export interface WeatherSnapshot {
  label: string;
  summary: string;
  tempF: number | null;
  highF: number | null;
  lowF: number | null;
  tip: string;
  source: "open-meteo" | "mock";
  /** WMO code for the current conditions (drives the icon). */
  code?: number;
  /** Morning / afternoon / evening outlook for today. */
  periods?: WeatherPeriod[];
  /** 7-day forecast. */
  daily?: WeatherDay[];
}

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  demo: true;
}

export interface StripSection {
  id: string;
  moduleId: ModuleId | "header" | "footer";
  title: string;
  kind:
    | "header"
    | "text"
    | "maze"
    | "sudoku"
    | "wordfind"
    | "dots"
    | "weather"
    | "stocks"
    | "calendar"
    | "footer";
  lines: string[];
  maze?: MazeData;
  sudoku?: SudokuData;
  wordfind?: WordFindData;
  dots?: DotsData;
  weather?: WeatherSnapshot;
  stocks?: StockQuote[];
  events?: CalendarEvent[];
  /** Optional pre-rendered SVG for maze/sudoku/wordfind/dots (paper has no parent key). */
  svg?: string;
  /** Card footprint carried from the owning slot (half/full/double). */
  size?: SlotSize;
  /** For news modules: a short column of headlines. */
  news?: { headline: string; blurb: string }[];
}

/** Firmware-ready job. Today: preview payload. Later: ESC/POS or a raster. */
export interface PrintJob {
  id: string;
  createdAt: string;
  date: string;
  timezone: string;
  kidId: string;
  kidName: string;
  ageBand: AgeBand;
  modules: ModuleId[];
  paperSize: PaperSize;
  /** Physical width hint: 58 (strip), 80 (legacy), or 216 (letter ~8.5in @ 203dpi preview scale). */
  paperWidthMm: 58 | 80 | 216;
  dpi: 203;
  widthPx: number;
  sections: StripSection[];
  /** Full HTML document for GET /api/render?format=html */
  previewHtml: string;
  nonce: number;
  status: "preview" | "queued" | "printed";
  payload: {
    format: "preview";
  };
}

export interface AppState {
  kids: KidProfile[];
  activeKidId: string | null;
  settings: AppSettings;
  lastPrintByKid: Record<string, PrintJob>;
  nonceByKid: Record<string, number>;
}

export const STRIP_WIDTH_PX = 384;
/** Letter preview width — readable page, not full 203dpi. */
export const LETTER_WIDTH_PX = 612;
export const STRIP_DPI = 203;
/** @deprecated Slot count is fixed by paperSize (4 or 7). */
export const MIN_SLOTS = 1;
export const MAX_SLOTS = 7;

export const AGE_BANDS: { id: AgeBand; label: string; hint: string }[] = [
  { id: "4-6", label: "4–6", hint: "Short words, chunky maze, 4×4 numbers" },
  { id: "7-9", label: "7–9", hint: "Vocabulary, a real maze, 6×6 grid" },
  { id: "10-12", label: "10–12", hint: "Denser facts, tougher maze, easy 9×9" },
];

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Mexico_City",
  "UTC",
] as const;

export const DEFAULT_MODULES: ModuleId[] = [
  "word",
  "fact",
  "maze",
  "history",
  "weather",
];

export const DEFAULT_WATCHLIST = ["AAPL", "DIS", "NKE"];

export const DEFAULT_SETTINGS: AppSettings = {
  paperSize: "strip58",
  timezone: "America/New_York",
  printTime: "07:00",
  weatherCity: "Brooklyn",
  weatherZip: "11201",
  modulePoolLimit: null,
};
