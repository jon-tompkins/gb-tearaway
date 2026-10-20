import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { AppState } from "./types";

/**
 * Per-user persistence for the app state.
 *
 * Backend is chosen at runtime:
 *  - **Supabase** when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set — a single
 *    `botb_state(user_key text primary key, state jsonb, updated_at timestamptz)`
 *    table, one row per user. This is the durable, multi-instance store.
 *  - **File** fallback otherwise — ./data/users locally, os.tmpdir on Vercel.
 *    (Serverless tmp is ephemeral/unshared, so configure Supabase for real
 *    persistence — this fallback only keeps local dev working.)
 */
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = "botb_state";

export const persistenceMode: "supabase" | "file" = SUPA_URL && SUPA_KEY ? "supabase" : "file";

const FILE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "botb-data")
  : path.join(process.cwd(), "data", "users");

function filePath(userKey: string): string {
  return path.join(FILE_DIR, `${encodeURIComponent(userKey)}.json`);
}

/** Store any JSON payload under a key (reuses the same botb_state table/file). */
export async function savePayload(key: string, value: unknown): Promise<void> {
  await saveRaw(key, value);
}

/** Every signed-in user's stored state (for the delivery cron). */
export async function listUserStates(): Promise<Array<{ userKey: string; state: AppState }>> {
  if (SUPA_URL && SUPA_KEY) {
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/${TABLE}?user_key=like.user:*&select=user_key,state`,
        { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }, cache: "no-store" },
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as Array<{ user_key: string; state: AppState }>;
      return rows.map((r) => ({ userKey: r.user_key, state: r.state }));
    } catch {
      return [];
    }
  }
  try {
    const files = await fs.readdir(FILE_DIR);
    const out: Array<{ userKey: string; state: AppState }> = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const userKey = decodeURIComponent(f.replace(/\.json$/, ""));
      if (!userKey.startsWith("user:")) continue;
      try {
        out.push({ userKey, state: JSON.parse(await fs.readFile(path.join(FILE_DIR, f), "utf8")) });
      } catch {
        // skip unreadable
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Atomically claim a key: stores `value` only if the key doesn't exist yet.
 * Returns true if this call created it (i.e. we own the claim).
 */
export async function claimPayload(key: string, value: unknown): Promise<boolean> {
  if (SUPA_URL && SUPA_KEY) {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}?on_conflict=user_key`, {
      method: "POST",
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({ user_key: key, state: value, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) return false;
    const rows = (await res.json()) as unknown[];
    return rows.length > 0;
  }
  try {
    await fs.mkdir(FILE_DIR, { recursive: true });
    await fs.writeFile(filePath(key), JSON.stringify(value), { flag: "wx" });
    return true;
  } catch {
    return false;
  }
}

/** Remove a stored payload (e.g. release a claim). */
export async function deletePayload(key: string): Promise<void> {
  if (SUPA_URL && SUPA_KEY) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/${TABLE}?user_key=eq.${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      });
    } catch {
      // best effort
    }
    return;
  }
  await fs.rm(filePath(key), { force: true }).catch(() => {});
}

/**
 * Small fields of every payload whose key starts with `prefix` (no big bodies).
 * `fields` are top-level keys of the stored JSON. Supabase only; [] otherwise.
 */
export async function listPayloadFields(
  prefix: string,
  fields: string[],
  limit = 60,
): Promise<Array<{ key: string } & Record<string, string | null>>> {
  if (!(SUPA_URL && SUPA_KEY)) return [];
  const sel = ["user_key", ...fields.map((f) => `${f}:state->>${f}`)].join(",");
  const res = await fetch(
    `${SUPA_URL}/rest/v1/${TABLE}?user_key=like.${encodeURIComponent(`${prefix}*`)}&select=${sel}&order=user_key.desc&limit=${limit}`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }, cache: "no-store" },
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<Record<string, string | null>>;
  return rows.map(({ user_key, ...rest }) => ({ key: user_key ?? "", ...rest }));
}

/** Load a JSON payload previously stored with savePayload. */
export async function loadPayload<T>(key: string): Promise<T | null> {
  return (await loadRaw(key)) as T | null;
}

async function loadRaw(userKey: string): Promise<unknown> {
  if (SUPA_URL && SUPA_KEY) {
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/${TABLE}?user_key=eq.${encodeURIComponent(userKey)}&select=state`,
        {
          headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
          cache: "no-store",
        },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as Array<{ state: unknown }>;
      return rows[0]?.state ?? null;
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(await fs.readFile(filePath(userKey), "utf8"));
  } catch {
    return null;
  }
}

async function saveRaw(userKey: string, value: unknown): Promise<void> {
  if (SUPA_URL && SUPA_KEY) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/${TABLE}?on_conflict=user_key`, {
        method: "POST",
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ user_key: userKey, state: value, updated_at: new Date().toISOString() }),
      });
    } catch {
      // best effort
    }
    return;
  }
  try {
    await fs.mkdir(FILE_DIR, { recursive: true });
    await fs.writeFile(filePath(userKey), JSON.stringify(value, null, 2), "utf8");
  } catch {
    // read-only fs
  }
}

/** Thrown when the store can't be read — distinct from "no row yet" (null). */
export class StoreUnavailableError extends Error {}

/**
 * The user's state, or null when they have none yet. THROWS StoreUnavailableError
 * when the database can't be reached: callers must not mistake an outage for a
 * new user and save a blank state over a real account.
 */
export async function loadState(userKey: string): Promise<AppState | null> {
  if (SUPA_URL && SUPA_KEY) {
    let res: Response;
    try {
      res = await fetch(
        `${SUPA_URL}/rest/v1/${TABLE}?user_key=eq.${encodeURIComponent(userKey)}&select=state`,
        {
          headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
          cache: "no-store",
        },
      );
    } catch (e) {
      throw new StoreUnavailableError(`store read failed: ${e instanceof Error ? e.message : e}`);
    }
    if (!res.ok) throw new StoreUnavailableError(`store read failed: HTTP ${res.status}`);
    const rows = (await res.json()) as Array<{ state: AppState }>;
    return rows[0]?.state ?? null;
  }
  try {
    return JSON.parse(await fs.readFile(filePath(userKey), "utf8")) as AppState;
  } catch {
    return null;
  }
}

export async function saveState(userKey: string, state: AppState): Promise<void> {
  if (SUPA_URL && SUPA_KEY) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/${TABLE}?on_conflict=user_key`, {
        method: "POST",
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ user_key: userKey, state, updated_at: new Date().toISOString() }),
      });
    } catch {
      // best effort — the in-memory copy still serves this instance
    }
    return;
  }
  try {
    await fs.mkdir(FILE_DIR, { recursive: true });
    await fs.writeFile(filePath(userKey), JSON.stringify(state, null, 2), "utf8");
  } catch {
    // read-only fs (serverless) — in-memory copy carries the state
  }
}
