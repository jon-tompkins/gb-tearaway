import { loadPayload, savePayload } from "../persist";
import { FREE_UPGRADE_TEXT } from "./copy";
import type { FreeEdition } from "./editions";
import { freeEditionsEnabled } from "./flag";
import { effectiveMailingAddress, freeEditionsActive, normalizeFreeAdmin, type FreeAdminSettings } from "./settings";

const KEY = "free:admin";

export async function loadFreeAdmin(): Promise<FreeAdminSettings> {
  return normalizeFreeAdmin(await loadPayload<unknown>(KEY));
}

export async function saveFreeAdmin(settings: FreeAdminSettings): Promise<void> {
  await savePayload(KEY, normalizeFreeAdmin(settings));
}

export interface FreeRuntime {
  settings: FreeAdminSettings;
  envOn: boolean;
  active: boolean;
  address: string;
  upgradeText: string;
  editions: FreeEdition[];
}

export async function freeRuntime(): Promise<FreeRuntime> {
  const settings = await loadFreeAdmin();
  return {
    settings,
    envOn: freeEditionsEnabled(),
    active: freeEditionsActive(settings.enabled),
    address: effectiveMailingAddress(settings),
    upgradeText: settings.upgradeText || FREE_UPGRADE_TEXT,
    editions: settings.editions,
  };
}

export async function freeEditionGate(): Promise<{ ok: true; runtime: FreeRuntime } | { ok: false; status: 404 }> {
  const runtime = await freeRuntime();
  return runtime.active ? { ok: true, runtime } : { ok: false, status: 404 };
}

export function publicEditions(editions: readonly FreeEdition[]): FreeEdition[] {
  return editions.filter((e) => e.live && !e.archived);
}
