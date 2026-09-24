import type { KidProfile, ModuleId, ModuleSlot, PaperSize, SlotMode } from "./types";
import {
  COLUMN_CAPACITY_UNITS,
  columnCountForPaper,
  PAPER_SLOT_COUNTS,
  slotSizeUnits,
} from "./types";
import { isModuleId, moduleSize } from "./modules";
import { clampDifficulty, isDifficultyModule } from "./difficulty";
import { hashString, mulberry32, pick } from "./rng";

/** Build empty slots for a paper size. */
export function emptySlots(paperSize: PaperSize): ModuleSlot[] {
  const n = PAPER_SLOT_COUNTS[paperSize];
  return Array.from({ length: n }, (_, i) => ({
    id: `slot-${i}`,
    moduleIds: [] as ModuleId[],
    mode: "single" as SlotMode,
    cursor: 0,
  }));
}

/** Migrate legacy flat `modules` into fixed slots (one module per slot, first N). */
export function migrateModulesToSlots(
  modules: ModuleId[],
  paperSize: PaperSize,
): ModuleSlot[] {
  const slots = emptySlots(paperSize);
  const n = slots.length;
  for (let i = 0; i < Math.min(modules.length, n); i++) {
    slots[i] = {
      ...slots[i],
      moduleIds: [modules[i]],
      mode: "single",
      cursor: 0,
    };
  }
  return slots;
}

export function sanitizeModuleIds(raw: unknown): ModuleId[] {
  if (!Array.isArray(raw)) return [];
  const unique: ModuleId[] = [];
  for (const id of raw) {
    if (typeof id === "string" && isModuleId(id) && !unique.includes(id)) {
      unique.push(id);
    }
  }
  return unique;
}

/**
 * Build a validated per-module difficulty map for a card. Only tunable modules
 * (maze/sudoku/wordfind/dots) are kept. A legacy per-card `difficulty` back-fills
 * any tunable module that has no explicit value.
 */
export function sanitizeModuleDifficulty(
  raw: unknown,
  moduleIds: ModuleId[],
  legacy?: number,
): Partial<Record<ModuleId, number>> | undefined {
  const out: Partial<Record<ModuleId, number>> = {};
  const tunable = moduleIds.filter(isDifficultyModule);
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    for (const id of tunable) {
      const v = rec[id];
      if (typeof v === "number" && Number.isFinite(v)) out[id] = clampDifficulty(v);
    }
  }
  if (legacy != null) {
    for (const id of tunable) {
      if (out[id] == null) out[id] = clampDifficulty(legacy);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeMode(raw: unknown, moduleCount: number): SlotMode {
  if (moduleCount <= 1) return "single";
  if (raw === "in_order" || raw === "random" || raw === "single") return raw;
  return "in_order";
}

export function sanitizeSlots(
  raw: unknown,
  paperSize: PaperSize,
  legacyModules?: ModuleId[],
): ModuleSlot[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    if (legacyModules && legacyModules.length > 0) {
      return migrateModulesToSlots(legacyModules, paperSize);
    }
    return []; // blank layout is allowed (manual/custom start)
  }

  const parsed: ModuleSlot[] = raw.slice(0, MAX_SLOTS).map((s, i) => {
    const obj = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
    const moduleIds = sanitizeModuleIds(obj.moduleIds);
    const mode = sanitizeMode(obj.mode, moduleIds.length);
    const cursor =
      typeof obj.cursor === "number" && Number.isFinite(obj.cursor)
        ? Math.max(0, Math.floor(obj.cursor))
        : 0;
    const size =
      obj.size === "half" || obj.size === "double" || obj.size === "full" ? obj.size : "full";
    const column = obj.column === 1 ? 1 : 0;
    const legacyDifficulty =
      typeof obj.difficulty === "number" && Number.isFinite(obj.difficulty)
        ? Math.min(20, Math.max(1, Math.round(obj.difficulty)))
        : undefined;
    // Per-module difficulty map. Migrate a legacy per-card `difficulty` onto
    // every tunable module in the card when no explicit map is present.
    const moduleDifficulty = sanitizeModuleDifficulty(
      obj.moduleDifficulty,
      moduleIds,
      legacyDifficulty,
    );
    return {
      id: typeof obj.id === "string" && obj.id ? obj.id : `slot-${i}`,
      moduleIds,
      mode: moduleIds.length <= 1 ? "single" : mode === "single" ? "in_order" : mode,
      cursor,
      size,
      column,
      ...(moduleDifficulty ? { moduleDifficulty } : {}),
    };
  });

  return parsed;
}

/** Resize slots when paper size changes; preserve existing slot contents. */
/** Cards are variable now; just keep valid ids and a sane maximum. */
export const MAX_SLOTS = 16;
export function resizeSlotsForPaper(slots: ModuleSlot[], _paperSize: PaperSize): ModuleSlot[] {
  return slots.slice(0, MAX_SLOTS).map((s, i) => ({ ...s, id: s.id || `slot-${i}` }));
}

export function isPaperSize(v: unknown): v is PaperSize {
  return v === "strip58" || v === "letter";
}

/** Flatten unique module ids across slots (pool / weather check / display). */
export function flattenSlotModules(slots: ModuleSlot[]): ModuleId[] {
  const out: ModuleId[] = [];
  for (const slot of slots) {
    for (const id of slot.moduleIds) {
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}

/**
 * Resolve one ModuleId per non-empty slot for a generate/print run.
 * - 0 modules → skip
 * - 1 module → that module
 * - many + in_order → cursor % length
 * - many + random → seeded RNG from date+kid+nonce+slotId
 */
export function resolveActiveModules(
  slots: ModuleSlot[],
  opts: { dateISO: string; kidFirstName: string; nonce: number },
): { moduleIds: ModuleId[]; resolved: Array<{ slotId: string; moduleId: ModuleId }> } {
  const resolved: Array<{ slotId: string; moduleId: ModuleId }> = [];
  for (const slot of slots) {
    const pickId = resolveSlotModule(slot, opts);
    if (pickId) resolved.push({ slotId: slot.id, moduleId: pickId });
  }
  return { moduleIds: resolved.map((r) => r.moduleId), resolved };
}

export function resolveSlotModule(
  slot: ModuleSlot,
  opts: { dateISO: string; kidFirstName: string; nonce: number },
): ModuleId | null {
  const ids = slot.moduleIds;
  if (ids.length === 0) return null;
  if (ids.length === 1 || slot.mode === "single") return ids[0];
  if (slot.mode === "random") {
    const name = opts.kidFirstName.trim().toLowerCase() || "kid";
    const seed = hashString(
      `${opts.dateISO}|${name}|${opts.nonce}|${slot.id}|slot-random`,
    );
    const rng = mulberry32(seed);
    return pick(rng, ids);
  }
  // in_order
  const cursor = slot.cursor ?? 0;
  return ids[cursor % ids.length];
}

/**
 * Advance in_order cursors after a successful generate/print.
 * Returns new slots array (immutable).
 */
export function advanceInOrderCursors(slots: ModuleSlot[]): ModuleSlot[] {
  return slots.map((slot) => {
    if (slot.moduleIds.length < 2 || slot.mode !== "in_order") return slot;
    const next = ((slot.cursor ?? 0) + 1) % slot.moduleIds.length;
    return { ...slot, cursor: next };
  });
}

/** Ensure kid has coherent paperSize + slots; sync legacy modules field. */
export function ensureKidSlots(kid: KidProfile): KidProfile {
  const paperSize: PaperSize = isPaperSize(kid.paperSize) ? kid.paperSize : "strip58";
  const legacy = sanitizeModuleIds(kid.modules);
  const slots = sanitizeSlots(kid.slots, paperSize, legacy);
  const modules = flattenSlotModules(slots);
  // Palette must always include everything currently placed in a card.
  const access = Array.from(new Set([...sanitizeModuleIds(kid.accessModules), ...modules]));
  return {
    ...kid,
    paperSize,
    slots,
    modules: modules.length ? modules : legacy,
    accessModules: access.length ? access : legacy,
  };
}

/** Default demo slots: mix of single, in_order, and random for the sample kid. */
export function demoSlotsStrip58(): ModuleSlot[] {
  return [
    { id: "slot-0", moduleIds: ["word"], mode: "single", cursor: 0 },
    { id: "slot-1", moduleIds: ["joke", "riddle"], mode: "in_order", cursor: 0 },
    { id: "slot-2", moduleIds: ["doodle", "wyr", "poem"], mode: "random", cursor: 0 },
    { id: "slot-3", moduleIds: ["maze", "spanish"], mode: "in_order", cursor: 0 },
  ];
}

/**
 * Pack one module per card, each card sized to the module's natural footprint,
 * filling columns greedily without exceeding a column's 8-unit capacity.
 * Anything that doesn't fit the page is dropped.
 */
export function packModulesIntoSlots(
  moduleIds: ModuleId[],
  paperSize: PaperSize,
): ModuleSlot[] {
  const columns = columnCountForPaper(paperSize);
  const used = new Array<number>(columns).fill(0);
  const slots: ModuleSlot[] = [];
  let i = 0;
  for (const id of moduleIds) {
    const size = moduleSize(id);
    const units = slotSizeUnits(size);
    // Least-filled column that still has room.
    let best = -1;
    for (let c = 0; c < columns; c++) {
      if (used[c] + units <= COLUMN_CAPACITY_UNITS && (best < 0 || used[c] < used[best])) {
        best = c;
      }
    }
    if (best < 0) continue; // page is full
    used[best] += units;
    slots.push({
      id: `slot-${i++}`,
      moduleIds: [id],
      mode: "single",
      cursor: 0,
      size,
      column: best,
    });
  }
  return slots;
}

export function defaultSlotsForNewKid(paperSize: PaperSize = "strip58"): ModuleSlot[] {
  // Fills a single column exactly (maze 2× + four ½ cards = 8 units); Letter
  // gets a balanced second column.
  const defaults: ModuleId[] =
    paperSize === "letter"
      ? ["maze", "weather", "word", "joke", "fact", "history", "doodle", "spanish"]
      : ["maze", "word", "joke", "doodle", "fact"];
  return packModulesIntoSlots(defaults, paperSize);
}
