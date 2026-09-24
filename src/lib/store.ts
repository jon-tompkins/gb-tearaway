import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { AppSettings, AppState, KidProfile, PrintJob } from "./types";
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
// Serverless runtimes (Vercel) ship a read-only app filesystem; only the temp dir
// is writable. Persist there when deployed, and to ./data locally.
const RUNTIME_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "tearaway-data") : DATA_DIR;
const STORE_PATH = path.join(RUNTIME_DIR, "store.json");
const SAMPLE_PATH = path.join(DATA_DIR, "store.sample.json");

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

function normalize(raw: Partial<AppState> | null | undefined): AppState {
  const base = emptyState();
  if (!raw || !Array.isArray(raw.kids) || raw.kids.length === 0) return base;
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

// In-memory copy is the source of truth within a running instance, so the app
// works even when the disk is read-only (serverless). Disk is best-effort for
// warm-instance / local durability. NOTE: serverless instances are ephemeral and
// not shared, so cross-instance durability needs a real KV store (e.g. Vercel KV).
let mem: AppState | null = null;

async function seedState(): Promise<AppState> {
  try {
    const sample = await fs.readFile(SAMPLE_PATH, "utf8");
    return normalize(JSON.parse(sample) as AppState);
  } catch {
    return emptyState();
  }
}

async function persist(state: AppState): Promise<void> {
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // read-only fs (serverless) — the in-memory copy carries the state
  }
}

export async function readStore(): Promise<AppState> {
  if (mem) return mem;
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    mem = normalize(JSON.parse(raw) as AppState);
  } catch {
    mem = await seedState();
    void persist(mem);
  }
  return mem;
}

export async function writeStore(state: AppState): Promise<AppState> {
  const next = normalize(state);
  mem = next;
  await persist(next);
  return next;
}

export async function getActiveKid(store?: AppState): Promise<KidProfile | null> {
  const s = store ?? (await readStore());
  if (!s.kids.length) return null;
  return s.kids.find((k) => k.id === s.activeKidId) ?? s.kids[0] ?? null;
}

export async function patchStore(
  patch: Partial<AppState> & {
    kid?: Partial<KidProfile> & { id?: string };
    createKid?: Partial<KidProfile>;
  },
): Promise<AppState> {
  const store = await readStore();

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

  return writeStore(store);
}

export async function savePrintJob(job: PrintJob): Promise<AppState> {
  const store = await readStore();
  store.lastPrintByKid = { ...store.lastPrintByKid, [job.kidId]: job };
  store.nonceByKid = { ...store.nonceByKid, [job.kidId]: job.nonce };
  return writeStore(store);
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
