export type AgeBand = "4-6" | "7-9" | "10-12";

export type ModuleId =
  | "word"
  | "fact"
  | "maze"
  | "sudoku"
  | "history"
  | "weather"
  | "stocks"
  | "calendar";

export type PaperWidth = "58mm" | "80mm";

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
  modules: ModuleId[];
  watchlist: string[];
  events: CalendarEvent[];
  createdAt: string;
}

export interface AppSettings {
  paperWidth: PaperWidth;
  timezone: string;
  printTime: string;
  weatherCity: string;
  weatherZip: string;
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
export interface WeatherSnapshot {
  label: string;
  summary: string;
  tempF: number | null;
  highF: number | null;
  lowF: number | null;
  tip: string;
  source: "open-meteo" | "mock";
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
    | "weather"
    | "stocks"
    | "calendar"
    | "footer";
  lines: string[];
  maze?: MazeData;
  sudoku?: SudokuData;
  weather?: WeatherSnapshot;
  stocks?: StockQuote[];
  events?: CalendarEvent[];
  /** Optional pre-rendered SVG for maze/sudoku (paper has no parent key). */
  svg?: string;
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
  paperWidthMm: 58 | 80;
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
export const STRIP_DPI = 203;
export const MIN_SLOTS = 3;
export const MAX_SLOTS = 5;

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
  paperWidth: "58mm",
  timezone: "America/New_York",
  printTime: "07:00",
  weatherCity: "Brooklyn",
  weatherZip: "11201",
};
