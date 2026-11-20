import { alertFreeFailure } from "./alert";
import { editionById, FREE_EDITIONS } from "./editions";
import { freeEditionsEnabled, freeMailingAddress } from "./flag";
import { sendFreeDailyEmail } from "./mail";
import { ensureFreeEditionPdf } from "./render";
import { claimFresh, listSubscribers, loadSubscriber, releaseClaim, saveSubscriber } from "./repo";
import { planFreeSends, type FreeSendJob } from "./subscriber";
import { freeTokenSecret } from "./tokens";

const SEND_STALE_MS = 10 * 60_000;

export interface FreeDispatchReport {
  enabled: boolean;
  outcome: "disabled" | "no-address" | "ok" | "error";
  sent: number;
  failed: number;
  skipped: number;
  deferred: number;
  errors: string[];
}

export type FreeOneResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * Deliver one confirmed subscriber's shared PDF. Safe to retry: a per-subscriber
 * claim and lastSentDate stop a second email the same local day.
 */
export async function sendOneFreeSubscriber(subscriberId: string, now = new Date()): Promise<FreeOneResult> {
  if (!freeEditionsEnabled()) return { status: "skipped", reason: "free editions disabled" };
  const address = freeMailingAddress();
  if (!address) {
    console.error("[free-editions] FREE_EDITION_MAILING_ADDRESS is empty; refusing to send");
    await alertFreeFailure(
      "no-mailing-address",
      "FREE_EDITION_MAILING_ADDRESS is empty. Refused to send a free edition.",
    );
    return { status: "skipped", reason: "no mailing address" };
  }
  const secret = freeTokenSecret();
  if (!secret) {
    console.error("[free-editions] no token secret; refusing to send");
    await alertFreeFailure("no-token-secret", "No token secret. Refused to send a free edition.");
    return { status: "failed", reason: "no token secret" };
  }
  const sub = await loadSubscriber(subscriberId);
  if (!sub || sub.status !== "confirmed") return { status: "skipped", reason: "not confirmed" };
  const edition = editionById(sub.editionId);
  if (!edition?.live) return { status: "skipped", reason: "edition not live" };

  const plan = planFreeSends({
    enabled: true,
    mailingAddress: address,
    now,
    editions: [edition],
    subscribers: [sub],
  });
  const job = plan.jobs[0];
  if (!job) return { status: "skipped", reason: plan.dueCount ? "already sent" : "not due" };

  const claimed = await claimFresh(job.claimKey, SEND_STALE_MS, now.getTime());
  if (!claimed) return { status: "skipped", reason: "already sent" };

  try {
    const pdf = await ensureFreeEditionPdf(edition, job.date);
    if (!pdf) {
      await releaseClaim(job.claimKey);
      await alertFreeFailure(`pdf-${edition.id}`, `Could not render the ${edition.id} free edition for ${job.date}.`);
      return { status: "failed", reason: "pdf unavailable" };
    }
    const ok = await sendFreeDailyEmail({ subscriber: sub, edition, date: job.date, pdf, secret, address });
    if (!ok) {
      await releaseClaim(job.claimKey);
      console.error(`[free-editions] email provider rejected ${edition.id} for subscriber ${sub.id}`);
      return { status: "failed", reason: "email provider rejected the send" };
    }
    const fresh = await loadSubscriber(sub.id);
    if (fresh && fresh.status === "confirmed") {
      await saveSubscriber({ ...fresh, lastSentDate: job.date });
    }
    return { status: "sent" };
  } catch (e) {
    await releaseClaim(job.claimKey);
    const message = e instanceof Error ? e.message : "error";
    console.error("[free-editions] send failed", edition.id, sub.id, message);
    return { status: "failed", reason: message };
  }
}

/**
 * Fan confirmed subscribers out through `sendOne`. Failures stay in this
 * report. Callers must not let them abort paid delivery.
 */
export async function dispatchFreeEditions(opts: {
  now?: Date;
  deadlineMs: number;
  sendOne: (subscriberId: string) => Promise<FreeOneResult>;
}): Promise<FreeDispatchReport> {
  const now = opts.now ?? new Date();
  if (!freeEditionsEnabled()) {
    return { enabled: false, outcome: "disabled", sent: 0, failed: 0, skipped: 0, deferred: 0, errors: [] };
  }
  const address = freeMailingAddress();
  let subscribers: FreeSubscriberList;
  try {
    subscribers = await listSubscribers();
  } catch (e) {
    const message = e instanceof Error ? e.message : "could not list free subscribers";
    console.error("[free-editions] list failed", message);
    await alertFreeFailure("list-subscribers", `Could not list free subscribers: ${message}`);
    return { enabled: true, outcome: "error", sent: 0, failed: 0, skipped: 0, deferred: 0, errors: [message] };
  }
  const plan = planFreeSends({
    enabled: true,
    mailingAddress: address,
    now,
    editions: FREE_EDITIONS,
    subscribers,
  });
  if (plan.outcome === "no-address") {
    if (plan.dueCount > 0) {
      await alertFreeFailure(
        "no-mailing-address",
        `FREE_EDITION_MAILING_ADDRESS is empty. Refused to send ${plan.dueCount} free edition email(s).`,
      );
    }
    return { enabled: true, outcome: "no-address", sent: 0, failed: 0, skipped: plan.dueCount, deferred: 0, errors: ["no mailing address"] };
  }

  const report: FreeDispatchReport = {
    enabled: true,
    outcome: "ok",
    sent: 0,
    failed: 0,
    skipped: 0,
    deferred: 0,
    errors: [],
  };
  const groups = new Map<string, FreeSendJob[]>();
  for (const job of plan.jobs) {
    const key = `${job.editionId}:${job.date}`;
    const list = groups.get(key) ?? [];
    list.push(job);
    groups.set(key, list);
  }

  for (const [key, jobs] of groups) {
    if (Date.now() > opts.deadlineMs) {
      report.deferred += jobs.length;
      continue;
    }
    const edition = editionById(jobs[0].editionId);
    if (!edition) continue;
    const pdf = await ensureFreeEditionPdf(edition, jobs[0].date);
    if (!pdf) {
      const message = `Could not render the ${key} free edition. Subscribers were not emailed.`;
      report.errors.push(message);
      report.failed += jobs.length;
      await alertFreeFailure(`pdf-${edition.id}`, message);
      continue;
    }
    const unfinished = await runPool(jobs, opts.deadlineMs, async (job) => {
      try {
        const result = await opts.sendOne(job.subscriberId);
        if (result.status === "sent") report.sent++;
        else if (result.status === "failed") {
          report.failed++;
          report.errors.push(`${job.subscriberId}: ${result.reason}`);
        } else report.skipped++;
      } catch (e) {
        report.failed++;
        const message = e instanceof Error ? e.message : "send failed";
        report.errors.push(`${job.subscriberId}: ${message}`);
        console.error("[free-editions] worker threw", job.editionId, message);
      }
    });
    report.deferred += unfinished;
  }
  return report;
}

type FreeSubscriberList = Awaited<ReturnType<typeof listSubscribers>>;

async function runPool(jobs: FreeSendJob[], deadlineMs: number, run: (job: FreeSendJob) => Promise<void>): Promise<number> {
  let next = 0;
  const lanes = Math.min(8, jobs.length);
  async function lane() {
    while (next < jobs.length) {
      if (Date.now() > deadlineMs) return;
      const job = jobs[next++];
      await run(job);
    }
  }
  await Promise.all(Array.from({ length: lanes }, lane));
  return Math.max(0, jobs.length - next);
}
