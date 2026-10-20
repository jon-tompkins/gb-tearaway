import { NextResponse } from "next/server";
import { listUserStates } from "@/lib/persist";
import { cronAuthorized } from "@/lib/cronAuth";
import { dueInfo, sendOneDispatch, type SendJob, type SendResult } from "@/lib/sendDispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";
/** Emails rendering at once (each in its own /api/cron/send-one invocation). */
const CONCURRENCY = 20;
/** Stop starting new sends after this; anything left goes out on the next run. */
const LAUNCH_BUDGET_MS = 200_000;

/**
 * Delivery dispatcher — runs every 5 minutes. Finds every email dispatch whose
 * local delivery hour has passed and that hasn't been sent today, and hands
 * each one to its own /api/cron/send-one invocation (PDF render + send), up to
 * CONCURRENCY at a time. One run used to send them all in a row inside a 60s
 * budget, which capped a delivery hour at a handful of emails.
 *
 * `?force=1` (with the secret) re-sends every email dispatch now — test sends.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const force = new URL(req.url).searchParams.get("force") === "1";
  const started = Date.now();

  const jobs: SendJob[] = [];
  let skipped = 0;
  for (const { userKey, state } of await listUserStates()) {
    for (const kid of state.kids) {
      const { emailable, due } = dueInfo(kid, state);
      if (emailable && (due || force)) jobs.push({ userKey, kidId: kid.id });
      else skipped++;
    }
  }

  const secret = process.env.CRON_SECRET;
  async function sendViaWorker(job: SendJob): Promise<SendResult> {
    try {
      const res = await fetch(`${SITE}/api/cron/send-one`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({ ...job, force }),
      });
      if (res.ok) return (await res.json()) as SendResult;
      // Worker unreachable (e.g. local dev without SITE) → send in-process.
      if (res.status === 404) return sendOneDispatch(job, { force });
      return { status: "failed", reason: `worker HTTP ${res.status}` };
    } catch (e) {
      return { status: "failed", reason: e instanceof Error ? e.message : "worker error" };
    }
  }

  const results: { job: SendJob; result: SendResult }[] = [];
  let next = 0;
  let deferred = 0;
  async function lane() {
    while (next < jobs.length) {
      if (Date.now() - started > LAUNCH_BUDGET_MS) {
        deferred = jobs.length - next;
        next = jobs.length;
        return;
      }
      const job = jobs[next++];
      results.push({ job, result: await sendViaWorker(job) });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, lane));

  const sent = results.filter((r) => r.result.status === "sent");
  return NextResponse.json({
    due: jobs.length,
    sent: sent.length,
    withPdf: sent.filter((r) => r.result.status === "sent" && r.result.withPdf).length,
    skipped: skipped + results.filter((r) => r.result.status === "skipped").length,
    deferred,
    errors: results
      .filter((r) => r.result.status === "failed")
      .map((r) => `${r.job.userKey}/${r.job.kidId}: ${r.result.status === "failed" ? r.result.reason : ""}`),
    ms: Date.now() - started,
  });
}
