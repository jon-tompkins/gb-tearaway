import { loadPayload, savePayload } from "./persist";
import { isModuleId } from "./modules";
import type { ModuleId } from "./types";

/**
 * Modules the admin has hidden from public view (still being polished).
 * Hidden modules drop out of the module browser and the card picker for
 * everyone but the admin. Cards that already use one keep printing it.
 */
const KEY = "config:hidden-modules";

export async function getHiddenModules(): Promise<ModuleId[]> {
  const raw = await loadPayload<{ ids?: string[] }>(KEY);
  return (raw?.ids ?? []).filter(isModuleId);
}

export async function setModuleHidden(id: ModuleId, hidden: boolean): Promise<ModuleId[]> {
  const cur = new Set(await getHiddenModules());
  if (hidden) cur.add(id);
  else cur.delete(id);
  const ids = [...cur];
  await savePayload(KEY, { ids });
  return ids;
}
