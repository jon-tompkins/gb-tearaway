"use client";

import { useCallback, useEffect, useState } from "react";
import type { Access } from "./billing";

export interface BillingStatus {
  signedIn: boolean;
  access: Access;
}

/** The signed-in user's plan, from /api/billing. null while loading or on error. */
const fetchBilling = (): Promise<BillingStatus | null> =>
  fetch("/api/billing", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<BillingStatus>) : null))
    .catch(() => null); // the gate fails open

export function useBilling() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const reload = useCallback(() => fetchBilling().then((s) => s && setStatus(s)), []);
  useEffect(() => {
    fetchBilling().then((s) => s && setStatus(s));
  }, []);
  return { status, setStatus, reload };
}

export const daysLeft = (iso: string | null) =>
  iso ? Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000)) : null;

export const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

/** POST to a billing route that answers { url } and follow it (Checkout / portal). */
export async function goToStripe(path: "/api/billing/checkout" | "/api/billing/portal", interval?: "year", plan?: string): Promise<string | null> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ interval, plan }),
  });
  const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
  if (j.url) {
    window.location.href = j.url;
    return null;
  }
  return j.error ?? "Something went wrong.";
}
