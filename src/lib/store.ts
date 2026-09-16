import { promises as fs } from "fs";
import path from "path";
import type { AppSettings, AppState, KidProfile, PrintJob } from "./types";
import {
  DEFAULT_MODULES,
  DEFAULT_SETTINGS,
  DEFAULT_WATCHLIST,
} from "./types";
import { defaultDemoEvents } from "./content/stubs";
import { uid } from "./rng";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const SAMPLE_PATH = path.join(DATA_DIR, "store.sample.json");

export function seedKid(overrides: Partial<KidProfile> = {}): KidProfile {
  const timezone = overrides.timezone || DEFAULT_SETTINGS.timezone;
  const name = overrides.name || "Sam";
  return {
    id: overrides.id || "demo-sam",
    name,
    ageBand: overrides.ageBand || "7-9",
    timezone,
    printTime: overrides.printTime || DEFAULT_SETTINGS.printTime,
    modules: overrides.modules ? [...overrides.modules] : [...DEFAULT_MODULES],
    watchlist: overrides.watchlist ? [...overrides.watchlist] : [...DEFAULT_WATCHLIST],
    events: overrides.events ?? defaultDemoEvents(timezone, name),
    createdAt: overrides.createdAt || new Date().toISOString(),
  };
}

export function emptyState(): AppState {
  const kid = seedKid();
  return {
    kids: [kid],
    activeKidId: kid.id,
    settings: { ...DEFAULT_SETTINGS },
    lastPrintByKid: {},
    nonceByKid: {},
  };
}

function normalize(raw: Partial<AppState> | null | undefined): AppState {
  const base = emptyState();
  if (!raw || !Array.isArray(raw.kids) || raw.kids.length === 0) return base;
  return {
    kids: raw.kids.map((k) => ({
      ...seedKid(k),
      ...k,
      modules: Array.isArray(k.modules) && k.modules.length ? k.modules : [...DEFAULT_MODULES],
      watchlist: Array.isArray(k.watchlist) ? k.watchlist : [...DEFAULT_WATCHLIST],
      events: Array.isArray(k.events) ? k.events : [],
    })),
    activeKidId:
      raw.activeKidId && raw.kids.some((k) => k.id === raw.activeKidId)
        ? raw.activeKidId
        : raw.kids[0]?.id ?? null,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
    lastPrintByKid: raw.lastPrintByKid ?? {},
    nonceByKid: raw.nonceByKid ?? {},
  };
}

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    try {
      const sample = await fs.readFile(SAMPLE_PATH, "utf8");
      await fs.writeFile(STORE_PATH, sample, "utf8");
    } catch {
      await fs.writeFile(STORE_PATH, JSON.stringify(emptyState(), null, 2), "utf8");
    }
  }
}

export async function readStore(): Promise<AppState> {
  await ensureStore();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return normalize(JSON.parse(raw) as AppState);
  } catch {
    return emptyState();
  }
}

export async function writeStore(state: AppState): Promise<AppState> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const next = normalize(state);
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
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
    const kid = seedKid({
      ...patch.createKid,
      id: patch.createKid.id || uid("kid"),
      createdAt: new Date().toISOString(),
    });
    store.kids.push(kid);
    store.activeKidId = kid.id;
  }

  if (patch.kid) {
    const id = patch.kid.id || store.activeKidId;
    const idx = store.kids.findIndex((k) => k.id === id);
    if (idx >= 0) {
      store.kids[idx] = { ...store.kids[idx], ...patch.kid, id: store.kids[idx].id };
      store.activeKidId = store.kids[idx].id;
    }
  }

  if (patch.settings) {
    store.settings = { ...store.settings, ...patch.settings };
    // Mirror timezone/printTime onto active kid for strip generation
    const active = store.kids.find((k) => k.id === store.activeKidId);
    if (active) {
      if (patch.settings.timezone) active.timezone = patch.settings.timezone;
      if (patch.settings.printTime) active.printTime = patch.settings.printTime;
    }
  }

  if (patch.activeKidId !== undefined) store.activeKidId = patch.activeKidId;
  if (patch.kids) store.kids = patch.kids;
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
  return { ...DEFAULT_SETTINGS, ...store.settings };
}
