"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppState, KidProfile, PrintJob } from "./types";

async function fetchStore(): Promise<AppState> {
  const res = await fetch("/api/store");
  if (!res.ok) throw new Error("store fetch failed");
  return res.json() as Promise<AppState>;
}

async function putStore(body: Record<string, unknown>): Promise<AppState> {
  const res = await fetch("/api/store", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("store save failed");
  return res.json() as Promise<AppState>;
}

export function useTearawayStore() {
  const [store, setStore] = useState<AppState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await fetchStore();
      setStore(next);
      setError(null);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      return null;
    }
  }, []);

  useEffect(() => {
    void reload().finally(() => setHydrated(true));
  }, [reload]);

  const activeKid: KidProfile | null =
    store?.kids.find((k) => k.id === store.activeKidId) ?? store?.kids[0] ?? null;

  const save = useCallback(async (body: Record<string, unknown>) => {
    const next = await putStore(body);
    setStore(next);
    return next;
  }, []);

  const setActiveKid = useCallback(
    async (id: string) => {
      await save({ activeKidId: id });
    },
    [save],
  );

  return { store, hydrated, error, activeKid, reload, save, setActiveKid };
}

export async function fetchPreview(): Promise<PrintJob> {
  const res = await fetch("/api/print-jobs/preview");
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Preview failed");
  }
  return res.json() as Promise<PrintJob>;
}

/** Bump nonce server-side and return a reshuffled strip for the same kid/day. */
export async function reshufflePreview(): Promise<PrintJob> {
  const res = await fetch("/api/print-jobs/reshuffle", { method: "POST" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Reshuffle failed");
  }
  return res.json() as Promise<PrintJob>;
}

export async function printNow(): Promise<PrintJob> {
  const res = await fetch("/api/print-jobs/print-now", { method: "POST" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Print failed");
  }
  return res.json() as Promise<PrintJob>;
}

/** Canonical parent-app client hook. Pages/components must use this (never import `@/lib/store` / `fs`). */
export const useAppStore = useTearawayStore;
