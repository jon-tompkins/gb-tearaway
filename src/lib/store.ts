import { promises as fs } from "fs";
import path from "path";
import type { AppSettings, AppState, KidProfile, PrintJob } from "./types";
import { loadState, persistenceMode, saveState } from "./persist";
import { accessFor } from "./billing";
import { countNoun } from "./copy";
import {
  DEFAULT_MODULES,
  DEFAULT_SETTINGS,
  DEFAULT_WATCHLIST,
  type ModuleId,
  type PaperSize,
} from "./types";
import { defaultDemoEvents } from "./content/stubs";
import { uid } from "./rng";
import { assertKidFirstName } from "./kidName";
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
  const name = overrides.name || "Matt";
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
    ...(overrides.status === "inactive" || overrides.status === "active" ? { status: overrides.status } : {}),
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
    slots: defaultSlotsForNewKid("letter"),
    modules: ["word", "joke", "riddle", "maze"],
    paperSize: "letter",
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

// Last-known state per user, per instance. With Supabase it is ONLY a fallback
// for a failed read — every read goes to the database, because serverless
// instances each kept their own copy and an old copy could be written back over
// a newer save (how a saved ZIP code reverted). Without Supabase (local dev /
// file mode) it stays the source of truth. Signed-out visitors share DEMO_KEY.
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
  if (cached && persistenceMode !== "supabase") return cached;
  const allowEmpty = userKey !== DEMO_KEY;
  let raw: AppState | null;
  try {
    raw = await loadState(userKey);
  } catch (e) {
    // Database unreachable: serve the last copy this instance saw, but never
    // fall through to "new user" and save a blank state over the account.
    if (cached) return cached;
    throw e;
  }
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
  const createKid = patch.createKid
    ? {
        ...patch.createKid,
        ...(patch.createKid.name !== undefined ? { name: assertKidFirstName(patch.createKid.name) } : {}),
      }
    : undefined;
  const kidPatch = patch.kid
    ? {
        ...patch.kid,
        ...(patch.kid.name !== undefined ? { name: assertKidFirstName(patch.kid.name) } : {}),
      }
    : undefined;
  const kidsPatch = patch.kids?.map((k) =>
    k.name !== undefined ? { ...k, name: assertKidFirstName(k.name) } : k,
  );

  const store = await readStore(userKey);

  if (createKid) {
    const { maxKids, active: hasAccess } = await accessFor(userKey);
    if (maxKids && store.kids.length >= maxKids) {
      throw new Error(`Your plan covers up to ${countNoun(maxKids)}. Switch to a bigger plan on the billing page to add more.`);
    }
    const paperSize = isPaperSize(createKid.paperSize)
      ? createKid.paperSize
      : store.settings.paperSize || DEFAULT_SETTINGS.paperSize;
    const kid = seedKid({
      ...createKid,
      paperSize,
      slots:
        createKid.slots ??
        defaultSlotsForNewKid(paperSize),
      id: createKid.id || uid("kid"),
      status: createKid.status === "active" && hasAccess ? "active" : "inactive",
      createdAt: new Date().toISOString(),
    });
    store.kids.push(ensureKidSlots(kid));
    store.activeKidId = kid.id;
  }

  if (kidPatch) {
    const id = kidPatch.id || store.activeKidId;
    const idx = store.kids.findIndex((k) => k.id === id);
    if (idx >= 0) {
      if (kidPatch.status === "active" && store.kids[idx].status === "inactive") {
        if (!(await accessFor(userKey)).active) {
          throw new Error("Activating a page needs a plan. Pick one on the Plan page.");
        }
      }
      if (kidPatch.status && kidPatch.status !== "active" && kidPatch.status !== "inactive") {
        delete kidPatch.status;
      }
      const merged = { ...store.kids[idx], ...kidPatch, id: store.kids[idx].id };
      // If paperSize changed, resize slots
      if (kidPatch.paperSize && kidPatch.paperSize !== store.kids[idx].paperSize) {
        merged.slots = resizeSlotsForPaper(
          kidPatch.slots ?? store.kids[idx].slots,
          kidPatch.paperSize,
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
  if (kidsPatch) store.kids = kidsPatch.map((k) => ensureKidSlots(k));
  if (patch.lastPrintByKid) store.lastPrintByKid = patch.lastPrintByKid;
  if (patch.nonceByKid) store.nonceByKid = patch.nonceByKid;

  const next = await writeStore(userKey, store);
  if (createKid && userKey.startsWith("user:")) {
    try {
      const { pauseFreeForUpgrade } = await import("./free/upgrade");
      await pauseFreeForUpgrade(userKey.slice("user:".length), "custom_page");
    } catch (e) {
      console.error("[free-editions] pause on custom page failed", e instanceof Error ? e.message : e);
    }
  }
  return next;
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
