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

export async function loadState(userKey: string): Promise<AppState | null> {
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
      const rows = (await res.json()) as Array<{ state: AppState }>;
      return rows[0]?.state ?? null;
    } catch {
      return null;
    }
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
