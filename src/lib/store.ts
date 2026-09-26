import { promises as fs } from "fs";
import path from "path";
import type { AppSettings, AppState, KidProfile, PrintJob } from "./types";
import { loadState, saveState } from "./persist";
import {
  DEFAULT_MODULES,
  DEFAULT_SETTINGS,
  DEFAULT_WATCHLIST,
  type ModuleId,
  type PaperSize,
} from "./types";
import { defaultDemoEvents } from "./content/stubs";
import { uid } from "./rng";
import {
  defaultSlotsForNewKid,
  ensureKidSlots,
  flattenSlotModules,
  isPaperSize,
  migrateModulesToSlots,
  resizeSlotsForPaper,
  sanitizeModuleIds,
  sanitizeSlots,
} from "./slots";

const DATA_DIR = path.join(process.cwd(), "data");
const SAMPLE_PATH = path.join(DATA_DIR, "store.sample.json");
/** Shared store key for signed-out visitors (the public demo). */
export const DEMO_KEY = "demo";

function migratePaperSize(settings: Partial<AppSettings> | undefined, kid?: Partial<KidProfile>): PaperSize {
  if (kid && isPaperSize(kid.paperSize)) return kid.paperSize;
  if (settings && isPaperSize(settings.paperSize)) return settings.paperSize;
  // Legacy paperWidth
  const pw = settings?.paperWidth;
  if (pw === "80mm" || pw === "58mm") return "strip58";
  return DEFAULT_SETTINGS.paperSize;
}

export function seedKid(overrides: Partial<KidProfile> = {}): KidProfile {
  const timezone = overrides.timezone || DEFAULT_SETTINGS.timezone;
  const name = overrides.name || "Sam";
  const paperSize = isPaperSize(overrides.paperSize)
    ? overrides.paperSize
    : DEFAULT_SETTINGS.paperSize;
  const legacyModules = overrides.modules
    ? sanitizeModuleIds(overrides.modules)
    : [...DEFAULT_MODULES];
  const slots =
    overrides.slots && Array.isArray(overrides.slots) && overrides.slots.length > 0
      ? sanitizeSlots(overrides.slots, paperSize, legacyModules)
      : migrateModulesToSlots(
          legacyModules.length ? legacyModules : [...DEFAULT_MODULES],
          paperSize,
        );
  const modules = flattenSlotModules(slots);
  return {
    id: overrides.id || "demo-sam",
    name,
    ageBand: overrides.ageBand || "7-9",
    timezone,
    printTime: overrides.printTime || DEFAULT_SETTINGS.printTime,
    deliveryMethod: overrides.deliveryMethod || "email",
    ...(overrides.deliveryEmail ? { deliveryEmail: overrides.deliveryEmail } : {}),
    paperSize,
    slots,
    modules: modules.length ? modules : [...DEFAULT_MODULES],
    accessModules: (() => {
      const a = sanitizeModuleIds(overrides.accessModules);
      const base = modules.length ? modules : [...DEFAULT_MODULES];
      return Array.from(new Set([...a, ...base]));
    })(),
    watchlist: overrides.watchlist ? [...overrides.watchlist] : [...DEFAULT_WATCHLIST],
    sportsTeams: overrides.sportsTeams ? [...overrides.sportsTeams] : [],
    events: overrides.events ?? defaultDemoEvents(timezone, name),
    createdAt: overrides.createdAt || new Date().toISOString(),
  };
}

export function emptyState(): AppState {
  const kid = seedKid({
    slots: defaultSlotsForNewKid("strip58"),
    modules: ["word", "joke", "doodle", "maze"],
    paperSize: "strip58",
  });
  return {
    kids: [kid],
    activeKidId: kid.id,
    settings: { ...DEFAULT_SETTINGS },
    lastPrintByKid: {},
    nonceByKid: {},
  };
}

function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const paperSize = migratePaperSize(raw ?? undefined);
  return {
    ...DEFAULT_SETTINGS,
    ...(raw ?? {}),
    paperSize,
    modulePoolLimit:
      raw?.modulePoolLimit === undefined
        ? null
        : raw.modulePoolLimit === null
          ? null
          : typeof raw.modulePoolLimit === "number"
            ? raw.modulePoolLimit
            : null,
  };
}

/** An empty account: no dispatches yet (a signed-in user starts here). */
function blankState(rawSettings?: Partial<AppSettings> | null): AppState {
  return {
    kids: [],
    activeKidId: null,
    settings: normalizeSettings(rawSettings),
    lastPrintByKid: {},
    nonceByKid: {},
  };
}

function normalize(raw: Partial<AppState> | null | undefined, allowEmpty = false): AppState {
  if (!raw || !Array.isArray(raw.kids) || raw.kids.length === 0) {
    return allowEmpty ? blankState(raw?.settings) : emptyState();
  }
  const settings = normalizeSettings(raw.settings);
  return {
    kids: raw.kids.map((k) => {
      const paperSize = migratePaperSize(raw.settings, k);
      const seeded = seedKid({ ...k, paperSize });
      return ensureKidSlots({
        ...seeded,
        ...k,
        paperSize,
        slots: seeded.slots,
        modules: seeded.modules,
        watchlist: Array.isArray(k.watchlist) ? k.watchlist : [...DEFAULT_WATCHLIST],
        sportsTeams: Array.isArray(k.sportsTeams) ? k.sportsTeams : [],
        events: Array.isArray(k.events) ? k.events : [],
      });
    }),
    activeKidId:
      raw.activeKidId && raw.kids.some((k) => k.id === raw.activeKidId)
        ? raw.activeKidId
        : raw.kids[0]?.id ?? null,
    settings,
    lastPrintByKid: raw.lastPrintByKid ?? {},
    nonceByKid: raw.nonceByKid ?? {},
  };
}

// Per-user in-memory cache (source of truth within a warm instance). Durable
// persistence is delegated to ./persist (Supabase when configured, else a
// best-effort file). Signed-out visitors share the DEMO_KEY store.
const mem = new Map<string, AppState>();

/** Demo store seed — the sample dispatch, so signed-out visitors see the app. */
async function seedState(): Promise<AppState> {
  try {
    const sample = await fs.readFile(SAMPLE_PATH, "utf8");
    return normalize(JSON.parse(sample) as AppState);
  } catch {
    return emptyState();
  }
}

export async function readStore(userKey: string = DEMO_KEY): Promise<AppState> {
  const cached = mem.get(userKey);
  if (cached) return cached;
  const allowEmpty = userKey !== DEMO_KEY;
  const raw = await loadState(userKey);
  let state: AppState;
  if (raw) {
    state = normalize(raw, allowEmpty);
  } else {
    // First visit: demo gets the sample; a real user starts with no dispatches.
    state = userKey === DEMO_KEY ? await seedState() : blankState();
    void saveState(userKey, state);
  }
  mem.set(userKey, state);
  return state;
}

export async function writeStore(userKey: string, state: AppState): Promise<AppState> {
  const next = normalize(state, userKey !== DEMO_KEY);
  mem.set(userKey, next);
  await saveState(userKey, next);
  return next;
}

export async function getActiveKid(store: AppState): Promise<KidProfile | null> {
  if (!store.kids.length) return null;
  return store.kids.find((k) => k.id === store.activeKidId) ?? store.kids[0] ?? null;
}

export async function patchStore(
  userKey: string,
  patch: Partial<AppState> & {
    kid?: Partial<KidProfile> & { id?: string };
    createKid?: Partial<KidProfile>;
  },
): Promise<AppState> {
  const store = await readStore(userKey);

  if (patch.createKid) {
    const paperSize = isPaperSize(patch.createKid.paperSize)
      ? patch.createKid.paperSize
      : store.settings.paperSize || DEFAULT_SETTINGS.paperSize;
    const kid = seedKid({
      ...patch.createKid,
      paperSize,
      slots:
        patch.createKid.slots ??
        defaultSlotsForNewKid(paperSize),
      id: patch.createKid.id || uid("kid"),
      createdAt: new Date().toISOString(),
    });
    store.kids.push(ensureKidSlots(kid));
    store.activeKidId = kid.id;
  }

  if (patch.kid) {
    const id = patch.kid.id || store.activeKidId;
    const idx = store.kids.findIndex((k) => k.id === id);
    if (idx >= 0) {
      const merged = { ...store.kids[idx], ...patch.kid, id: store.kids[idx].id };
      // If paperSize changed, resize slots
      if (patch.kid.paperSize && patch.kid.paperSize !== store.kids[idx].paperSize) {
        merged.slots = resizeSlotsForPaper(
          patch.kid.slots ?? store.kids[idx].slots,
          patch.kid.paperSize,
        );
      }
      store.kids[idx] = ensureKidSlots(merged);
      store.activeKidId = store.kids[idx].id;
    }
  }

  if (patch.settings) {
    store.settings = normalizeSettings({ ...store.settings, ...patch.settings });
    const active = store.kids.find((k) => k.id === store.activeKidId);
    if (active) {
      if (patch.settings.timezone) active.timezone = patch.settings.timezone;
      if (patch.settings.printTime) active.printTime = patch.settings.printTime;
    }
  }

  if (patch.activeKidId !== undefined) store.activeKidId = patch.activeKidId;
  if (patch.kids) store.kids = patch.kids.map((k) => ensureKidSlots(k));
  if (patch.lastPrintByKid) store.lastPrintByKid = patch.lastPrintByKid;
  if (patch.nonceByKid) store.nonceByKid = patch.nonceByKid;

  return writeStore(userKey, store);
}

export async function savePrintJob(userKey: string, job: PrintJob): Promise<AppState> {
  const store = await readStore(userKey);
  store.lastPrintByKid = { ...store.lastPrintByKid, [job.kidId]: job };
  store.nonceByKid = { ...store.nonceByKid, [job.kidId]: job.nonce };
  return writeStore(userKey, store);
}

export function getSettings(store: AppState): AppSettings {
  return normalizeSettings(store.settings);
}

/** Apply pool limit (future tiers). MVP: null = all unlocked. */
export function applyModulePoolLimit(
  moduleIds: ModuleId[],
  limit: number | null | undefined,
): ModuleId[] {
  if (limit == null || limit <= 0) return moduleIds;
  return moduleIds.slice(0, limit);
}
