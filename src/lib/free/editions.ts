import { parseISODate } from "../dates";
import { moduleSizes } from "../modules";
import { hashString } from "../rng";
import type { AgeBand, AppSettings, KidProfile, ModuleId, ModuleSlot, SlotSize } from "../types";
import { DEFAULT_SETTINGS, slotSizeUnits } from "../types";

/**
 * Shared daily editions. Launch with `live: true`. NYC 7–10 and the LA editions
 * are already shaped: flip `live` (or copy one object and change the city) to
 * add another. Generic and New York send at 6:00 America/New_York. A city
 * edition uses the same day's module rotation plus local weather.
 *
 * Ages 7–10 are the app's medium band. The generators' medium age band is
 * "7-9", and difficulty 8 sits in the 7–10 dial (see bandFromDifficulty).
 */
export interface FreeEdition {
  id: string;
  label: string;
  ageKey: "4-6" | "7-10";
  ageLabel: string;
  level: "easier" | "medium";
  levelLabel: string;
  ageBand: AgeBand;
  /** Appropriateness dial written onto every card. Easier = 3, medium = 8. */
  difficulty: number;
  timezone: string;
  /** Fixed local hour. Every launch edition is 6:00. */
  sendHour: number;
  weatherCity?: string;
  weatherZip?: string;
  /** Offered on /free and delivered. False entries are config only. */
  live: boolean;
}

const EASIER = { level: "easier" as const, levelLabel: "Easier", ageBand: "4-6" as const, difficulty: 3 };
const MEDIUM = { level: "medium" as const, levelLabel: "Medium", ageBand: "7-9" as const, difficulty: 8 };

export const FREE_EDITIONS: readonly FreeEdition[] = [
  {
    id: "generic-4-6",
    label: "Ages 4–6",
    ageKey: "4-6",
    ageLabel: "Ages 4–6",
    ...EASIER,
    timezone: "America/New_York",
    sendHour: 6,
    live: true,
  },
  {
    id: "generic-7-10",
    label: "Ages 7–10",
    ageKey: "7-10",
    ageLabel: "Ages 7–10",
    ...MEDIUM,
    timezone: "America/New_York",
    sendHour: 6,
    live: true,
  },
  {
    id: "nyc-4-6",
    label: "New York · Ages 4–6",
    ageKey: "4-6",
    ageLabel: "Ages 4–6",
    ...EASIER,
    timezone: "America/New_York",
    sendHour: 6,
    weatherCity: "New York",
    weatherZip: "10001",
    live: true,
  },
  {
    id: "nyc-7-10",
    label: "New York · Ages 7–10",
    ageKey: "7-10",
    ageLabel: "Ages 7–10",
    ...MEDIUM,
    timezone: "America/New_York",
    sendHour: 6,
    weatherCity: "New York",
    weatherZip: "10001",
    live: false,
  },
  {
    id: "la-4-6",
    label: "Los Angeles · Ages 4–6",
    ageKey: "4-6",
    ageLabel: "Ages 4–6",
    ...EASIER,
    timezone: "America/Los_Angeles",
    sendHour: 6,
    weatherCity: "Los Angeles",
    weatherZip: "90012",
    live: false,
  },
  {
    id: "la-7-10",
    label: "Los Angeles · Ages 7–10",
    ageKey: "7-10",
    ageLabel: "Ages 7–10",
    ...MEDIUM,
    timezone: "America/Los_Angeles",
    sendHour: 6,
    weatherCity: "Los Angeles",
    weatherZip: "90012",
    live: false,
  },
];

export function liveEditions(): FreeEdition[] {
  return FREE_EDITIONS.filter((e) => e.live);
}

export function editionById(id: string): FreeEdition | undefined {
  return FREE_EDITIONS.find((e) => e.id === id);
}

export function freeSettings(edition: FreeEdition): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    timezone: edition.timezone,
    printTime: "06:00",
    weatherCity: edition.weatherCity ?? "",
    weatherZip: edition.weatherZip ?? "",
    combineEmails: false,
  };
}

/**
 * Modules a shared page can rotate through. Left out on purpose:
 * stocks, sports, sportsnews, and calendar need a parent's own list;
 * news_city is parked (local feeds rarely stay kid-safe).
 * Weather is not in the rotation. City editions add it on top.
 */
type Pool = "news" | "puzzleDouble" | "puzzleFull" | "feature" | "text" | "shrink" | "joke";

const POOLS: Record<Pool, readonly ModuleId[]> = {
  news: ["news_world", "news_national", "news_tech", "news_gamer"],
  puzzleDouble: ["maze", "wordfind", "crossword", "dots", "colorbynumber"],
  puzzleFull: ["sudoku", "battleship", "logicgrid", "numbercross"],
  feature: ["animal", "planes", "dinosaurs", "usstate", "country_eu", "country_af", "country_asia_oce", "country_americas", "country_all"],
  text: ["word", "fact", "quote", "riddle", "sequence", "scramble", "spanish", "tonguetwister", "cryptogram", "history", "records"],
  shrink: ["poem", "word", "fact", "quote", "history", "spanish", "scramble", "cryptogram", "riddle", "sequence"],
  joke: ["joke"],
};

interface Spec {
  pool: Pool;
  size: SlotSize;
  /** City editions shrink this full card to half and place weather beside it. */
  shrinkForWeather?: boolean;
}

/** Each column totals 8 half-units. Every layout has one shrinkable card. */
const LAYOUTS: Spec[][][] = [
  [
    [
      { pool: "news", size: "double" },
      { pool: "puzzleDouble", size: "double" },
    ],
    [
      { pool: "puzzleFull", size: "full" },
      { pool: "joke", size: "half" },
      { pool: "text", size: "half" },
      { pool: "shrink", size: "full", shrinkForWeather: true },
      { pool: "text", size: "half" },
      { pool: "text", size: "half" },
    ],
  ],
  [
    [
      { pool: "puzzleDouble", size: "double" },
      { pool: "feature", size: "full" },
      { pool: "puzzleFull", size: "full" },
    ],
    [
      { pool: "news", size: "double" },
      { pool: "shrink", size: "full", shrinkForWeather: true },
      { pool: "joke", size: "half" },
      { pool: "text", size: "half" },
    ],
  ],
  [
    [
      { pool: "puzzleDouble", size: "double" },
      { pool: "puzzleDouble", size: "double" },
    ],
    [
      { pool: "news", size: "double" },
      { pool: "joke", size: "half" },
      { pool: "text", size: "half" },
      { pool: "shrink", size: "full", shrinkForWeather: true },
    ],
  ],
  [
    [
      { pool: "feature", size: "full" },
      { pool: "puzzleFull", size: "full" },
      { pool: "joke", size: "half" },
      { pool: "text", size: "half" },
      { pool: "shrink", size: "full", shrinkForWeather: true },
    ],
    [
      { pool: "news", size: "double" },
      { pool: "puzzleDouble", size: "double" },
    ],
  ],
];

let layoutsChecked = false;

function checkLayouts(): void {
  if (layoutsChecked) return;
  layoutsChecked = true;
  LAYOUTS.forEach((layout, i) => {
    const shrinks = layout.flat().filter((s) => s.shrinkForWeather).length;
    if (shrinks !== 1) throw new Error(`free edition layout ${i} needs exactly one weather slot`);
    for (const column of layout) {
      const units = column.reduce((n, s) => n + slotSizeUnits(s.size), 0);
      if (units !== 8) throw new Error(`free edition layout ${i} column is ${units} units`);
    }
    for (const spec of layout.flat()) {
      for (const id of POOLS[spec.pool]) {
        const allowed = moduleSizes(id);
        if (!allowed.includes(spec.size)) throw new Error(`${id} cannot be ${spec.size} on a free edition`);
        if (spec.shrinkForWeather && !allowed.includes("half")) throw new Error(`${id} cannot shrink for weather`);
      }
    }
  });
}

function dayNumber(dateISO: string): number {
  const { year, month, day } = parseISODate(dateISO);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function pickModule(pool: readonly ModuleId[], dateISO: string, salt: number, used: Set<ModuleId>): ModuleId {
  // Hash the date so a pool whose length matches the layout cycle still rotates.
  const start = hashString(`${dateISO}|${salt}|${pool[0]}`) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const id = pool[(start + i) % pool.length];
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
  }
  return pool[start];
}

function makeSlot(index: number, id: ModuleId, size: SlotSize, column: number, difficulty: number): ModuleSlot {
  return {
    id: `free-slot-${index}`,
    moduleIds: [id],
    mode: "single",
    cursor: 0,
    size,
    column,
    moduleDifficulty: { [id]: difficulty },
  };
}

/** Deterministic cards for this edition on this local date. */
export function slotsForEdition(edition: FreeEdition, dateISO: string): ModuleSlot[] {
  checkLayouts();
  const day = dayNumber(dateISO);
  const layout = LAYOUTS[((day % LAYOUTS.length) + LAYOUTS.length) % LAYOUTS.length];
  const used = new Set<ModuleId>();
  const picked = layout.flatMap((column, col) =>
    column.map((spec, i) => ({
      ...spec,
      column: col,
      moduleId: pickModule(POOLS[spec.pool], dateISO, col * 17 + i * 5, used),
    })),
  );
  const slots: ModuleSlot[] = [];
  for (const spec of picked) {
    const shrink = !!edition.weatherCity && !!spec.shrinkForWeather;
    slots.push(makeSlot(slots.length, spec.moduleId, shrink ? "half" : spec.size, spec.column, edition.difficulty));
    if (shrink) slots.push(makeSlot(slots.length, "weather", "half", spec.column, edition.difficulty));
  }
  return slots;
}

/**
 * A synthetic reader, not a child. The name is shared by every edition so the
 * same age and date resolve the same puzzles; city pages only add weather.
 */
export function buildFreeKid(edition: FreeEdition, dateISO: string): KidProfile {
  const slots = slotsForEdition(edition, dateISO);
  const modules: ModuleId[] = [];
  for (const slot of slots) {
    for (const id of slot.moduleIds) if (!modules.includes(id)) modules.push(id);
  }
  return {
    id: `free-${edition.id}`,
    name: "Reader",
    ageBand: edition.ageBand,
    timezone: edition.timezone,
    printTime: "06:00",
    deliveryMethod: "app",
    paperSize: "letter",
    slots,
    modules,
    accessModules: modules,
    watchlist: [],
    sportsTeams: [],
    events: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}
