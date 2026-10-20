import { dispatchToken, loadDispatchRef, saveDispatchRef, type DispatchRef } from "./deliver";
import { listPayloadFields, loadPayload, savePayload } from "./persist";

/**
 * A "run" is the exact dispatch sheet delivered on a given day, saved as its
 * print HTML. Past days reopen exactly as they went out (re-rendering an old
 * date would show today's weather, and news/history move on).
 */
export interface RunSnapshot {
  date: string;
  kidId: string;
  kidName: string;
  /** Print-ready HTML — what the PDF was made from. */
  html: string;
  createdAt: string;
  delivery: "email" | "app";
  /** Set once emailed (by the morning delivery or a re-send). */
  emailedTo?: string;
  emailedAt?: string;
  withPdf?: boolean;
}

export interface RunSummary {
  date: string;
  token: string;
  delivery: string;
  createdAt: string | null;
  emailedTo: string | null;
  emailedAt: string | null;
}

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";

export const runKey = (userKey: string, kidId: string, date: string) => `run:${userKey}:${kidId}:${date}`;

export async function loadRun(ref: DispatchRef): Promise<RunSnapshot | null> {
  return loadPayload<RunSnapshot>(runKey(ref.userKey, ref.kidId, ref.date));
}

export async function loadRunByToken(token: string): Promise<{ ref: DispatchRef; run: RunSnapshot | null } | null> {
  const ref = await loadDispatchRef(token);
  if (!ref) return null;
  return { ref, run: await loadRun(ref) };
}

/** Render today's sheet once and save it as the run. Returns its public token. */
export async function createRun(
  ref: DispatchRef & { kidName: string; delivery: "email" | "app" },
): Promise<{ token: string; run: RunSnapshot }> {
  const token = await saveDispatchRef({ userKey: ref.userKey, kidId: ref.kidId, date: ref.date });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 55_000);
  let html: string;
  try {
    const res = await fetch(`${SITE}/api/render?token=${token}&format=print`, { signal: ctl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`render HTTP ${res.status}`);
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }
  const run: RunSnapshot = {
    date: ref.date,
    kidId: ref.kidId,
    kidName: ref.kidName,
    html,
    createdAt: new Date().toISOString(),
    delivery: ref.delivery,
  };
  await savePayload(runKey(ref.userKey, ref.kidId, ref.date), run);
  return { token, run };
}

export async function markRunEmailed(ref: DispatchRef, to: string, withPdf: boolean): Promise<void> {
  const run = await loadRun(ref);
  if (!run) return;
  await savePayload(runKey(ref.userKey, ref.kidId, ref.date), {
    ...run,
    emailedTo: to,
    emailedAt: new Date().toISOString(),
    withPdf,
  });
}

/** A kid's saved runs, newest first (summaries only — no HTML). */
export async function listRuns(userKey: string, kidId: string, limit = 60): Promise<RunSummary[]> {
  const rows = await listPayloadFields(`run:${userKey}:${kidId}:`, ["date", "delivery", "createdAt", "emailedTo", "emailedAt"], limit);
  return rows
    .filter((r) => r.date)
    .map((r) => ({
      date: r.date!,
      token: dispatchToken(userKey, kidId, r.date!),
      delivery: r.delivery ?? "email",
      createdAt: r.createdAt,
      emailedTo: r.emailedTo,
      emailedAt: r.emailedAt,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Public URLs for a run (token-based, so they work from email on any device). */
export const runUrls = (token: string) => ({
  view: `${SITE}/api/runs/view?token=${token}`,
  print: `${SITE}/api/runs/view?token=${token}&auto=1`,
  pdf: `${SITE}/api/runs/pdf?token=${token}`,
});
