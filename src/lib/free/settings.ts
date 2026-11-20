import { FREE_UPGRADE_TEXT } from "./copy";
import { FREE_EDITIONS, heavyForEasier, rotationCatalog, type FreeEdition } from "./editions";
import { freeEditionsEnabled, freeMailingAddress } from "./flag";
import { isModuleId } from "../modules";
import type { ModuleId } from "../types";

export interface FreeAdminSettings {
  /** Used only when FREE_EDITIONS_ENABLED is on. Default true, matching the code. */
  enabled: boolean;
  /** Empty falls back to FREE_EDITION_MAILING_ADDRESS. */
  mailingAddress: string;
  upgradeText: string;
  editions: FreeEdition[];
}

const TIMEZONES = new Set([
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
]);

export function defaultFreeAdminSettings(): FreeAdminSettings {
  return {
    enabled: true,
    mailingAddress: "",
    upgradeText: FREE_UPGRADE_TEXT,
    editions: FREE_EDITIONS.map((e) => ({ ...e, sendMinute: 0, paused: false, archived: false })),
  };
}

function asEdition(raw: unknown, fallback?: FreeEdition): FreeEdition | null {
  if (!raw || typeof raw !== "object") return fallback ? { ...fallback } : null;
  const row = raw as Partial<FreeEdition>;
  const base = fallback ?? null;
  const id = typeof row.id === "string" && /^[a-z0-9-]{2,40}$/.test(row.id) ? row.id : base?.id;
  if (!id) return null;
  const ageKey = row.ageKey === "7-10" || row.ageKey === "4-6" ? row.ageKey : base?.ageKey ?? "4-6";
  const level = ageKey === "4-6" ? "easier" : "medium";
  const rotation = Array.isArray(row.rotationModules)
    ? row.rotationModules.filter((id): id is ModuleId => typeof id === "string" && isModuleId(id) && (level !== "easier" || !heavyForEasier(id)))
    : base?.rotationModules;
  return {
    ...(base ?? {
      id,
      label: id,
      ageKey,
      ageLabel: ageKey === "4-6" ? "Ages 4–6" : "Ages 7–10",
      level,
      levelLabel: level === "easier" ? "Easier" : "Medium",
      ageBand: level === "easier" ? "4-6" : "7-9",
      difficulty: level === "easier" ? 3 : 8,
      timezone: "America/New_York",
      sendHour: 6,
      live: false,
    }),
    ...row,
    id,
    ageKey,
    level,
    levelLabel: level === "easier" ? "Easier" : "Medium",
    ageBand: level === "easier" ? "4-6" : "7-9",
    ageLabel: ageKey === "4-6" ? "Ages 4–6" : "Ages 7–10",
    label: typeof row.label === "string" && row.label.trim() ? row.label.trim().slice(0, 80) : base?.label ?? id,
    difficulty: clampNum(row.difficulty, base?.difficulty ?? (level === "easier" ? 3 : 8), 1, 20),
    timezone: typeof row.timezone === "string" && TIMEZONES.has(row.timezone) ? row.timezone : base?.timezone ?? "America/New_York",
    sendHour: clampNum(row.sendHour, base?.sendHour ?? 6, 0, 23),
    sendMinute: clampNum(row.sendMinute, base?.sendMinute ?? 0, 0, 59),
    live: typeof row.live === "boolean" ? row.live : base?.live ?? false,
    paused: row.paused === true,
    archived: row.archived === true,
    weatherOn: row.weatherOn === false ? false : row.weatherOn === true ? true : base?.weatherOn,
    weatherCity: typeof row.weatherCity === "string" ? row.weatherCity.trim().slice(0, 80) : base?.weatherCity,
    weatherZip: typeof row.weatherZip === "string" ? row.weatherZip.trim().slice(0, 10) : base?.weatherZip,
    weatherLat: clampCoord(row.weatherLat, -90, 90),
    weatherLon: clampCoord(row.weatherLon, -180, 180),
    ...(rotation ? { rotationModules: rotation } : {}),
  };
}

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

function clampCoord(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

/** Code defaults, with a saved overlay. Unknown editions are kept. Archived ones stay. */
export function normalizeFreeAdmin(raw: unknown): FreeAdminSettings {
  const defaults = defaultFreeAdminSettings();
  if (!raw || typeof raw !== "object") return defaults;
  const body = raw as Partial<FreeAdminSettings>;
  const saved = Array.isArray(body.editions) ? body.editions : [];
  const byId = new Map<string, unknown>();
  for (const row of saved) {
    if (row && typeof row === "object" && typeof (row as { id?: string }).id === "string") byId.set((row as { id: string }).id, row);
  }
  const editions: FreeEdition[] = defaults.editions.map((def) => asEdition(byId.get(def.id), def) ?? def);
  for (const [id, row] of byId) {
    if (editions.some((e) => e.id === id)) continue;
    const custom = asEdition(row);
    if (custom) editions.push(custom);
  }
  return {
    enabled: typeof body.enabled === "boolean" ? body.enabled : defaults.enabled,
    mailingAddress: typeof body.mailingAddress === "string" ? body.mailingAddress.trim().slice(0, 300) : "",
    upgradeText: typeof body.upgradeText === "string" && body.upgradeText.trim() ? body.upgradeText.trim().slice(0, 400) : defaults.upgradeText,
    editions,
  };
}

export function effectiveMailingAddress(settings: Pick<FreeAdminSettings, "mailingAddress">, env: Record<string, string | undefined> = process.env): string {
  return settings.mailingAddress.trim() || freeMailingAddress(env);
}

/** Env off wins. When the env is on, the stored toggle decides. */
export function freeEditionsActive(toggle: boolean, env: Record<string, string | undefined> = process.env): boolean {
  return freeEditionsEnabled(env) && toggle;
}

export function validateNewEdition(input: {
  id: string;
  label: string;
  ageKey: string;
  timezone: string;
  weatherCity?: string;
  weatherLat?: number;
  weatherLon?: number;
  existingIds: string[];
}): { ok: true; edition: FreeEdition } | { ok: false; error: string } {
  const id = input.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!/^[a-z0-9-]{2,40}$/.test(id)) return { ok: false, error: "Use a short id: letters, numbers, and dashes." };
  if (input.existingIds.includes(id)) return { ok: false, error: "That edition id already exists." };
  if (!input.label.trim()) return { ok: false, error: "Name the edition." };
  if (!TIMEZONES.has(input.timezone)) return { ok: false, error: "Pick a timezone." };
  const edition = asEdition({
    id,
    label: input.label,
    ageKey: input.ageKey === "7-10" ? "7-10" : "4-6",
    timezone: input.timezone,
    weatherCity: input.weatherCity,
    weatherLat: input.weatherLat,
    weatherLon: input.weatherLon,
    weatherOn: !!(input.weatherCity?.trim() || (input.weatherLat != null && input.weatherLon != null)),
    live: false,
    paused: false,
    archived: false,
    sendHour: 6,
    sendMinute: 0,
  });
  if (!edition) return { ok: false, error: "Could not build that edition." };
  return { ok: true, edition };
}

export function archiveEdition(settings: FreeAdminSettings, id: string): FreeAdminSettings {
  return {
    ...settings,
    editions: settings.editions.map((e) => (e.id === id ? { ...e, archived: true, live: false, paused: true } : e)),
  };
}

export const ADMIN_TIMEZONES = [...TIMEZONES];
export const ADMIN_ROTATION = rotationCatalog();

export function singleTestRecipient(raw: string): { ok: true; email: string } | { ok: false; error: string } {
  const parts = raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length !== 1) return { ok: false, error: "A test send goes to one address." };
  const email = parts[0].toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, error: "Enter one email address." };
  return { ok: true, email };
}
