import { readStore, writeStore } from "./store";
import { claimPayload, deletePayload, loadPayload } from "./persist";
import { dateISOInZone, formatStripDate, partsInZone } from "./dates";
import { sendEmail, dispatchEmailHtml } from "./email";
import { renderPdfFromUrl } from "./pdf";
import { logEvent } from "./events";
import { createRun, markRunEmailed, runUrls } from "./runs";
import type { AppState, KidProfile } from "./types";

/** A claim older than this is assumed to belong to a send that crashed. */
const STALE_CLAIM_MS = 10 * 60_000;

export interface SendJob {
  userKey: string;
  kidId: string;
}

/** How a kid's dispatch is delivered: emailed, or left in the app to print. */
export function deliveryOf(kid: KidProfile): "email" | "app" | null {
  const m = kid.deliveryMethod ?? "email";
  if (m === "app") return "app";
  if (m === "email" && kid.deliveryEmail) return "email";
  return null;
}

/** Local date + whether this kid's dispatch is due now (delivery hour passed, not delivered today). */
export function dueInfo(kid: KidProfile, state: AppState, now = new Date()) {
  const tz = kid.timezone || state.settings.timezone;
  const localDate = dateISOInZone(tz, now);
  const { hour } = partsInZone(tz, now);
  const deliverHour = Number((kid.printTime || "07:00").split(":")[0]);
  const delivery = deliveryOf(kid);
  return { localDate, delivery, due: !!delivery && hour >= deliverHour && kid.lastEmailedDate !== localDate };
}

async function claim(key: string): Promise<boolean> {
  if (await claimPayload(key, { at: new Date().toISOString() })) return true;
  const existing = await loadPayload<{ at?: string }>(key);
  if (existing?.at && Date.now() - Date.parse(existing.at) > STALE_CLAIM_MS) {
    await deletePayload(key);
    return claimPayload(key, { at: new Date().toISOString() });
  }
  return false;
}

/** Email one saved run (PDF attached when it renders). Used by delivery and by re-sends. */
export async function emailRun(opts: {
  token: string;
  kidName: string;
  date: string;
  to: string;
}): Promise<{ ok: boolean; withPdf: boolean }> {
  const urls = runUrls(opts.token);
  const { weekday, dateLabel } = formatStripDate(opts.date);
  // The PDF is made from the saved run, so it matches exactly what's on file.
  const pdf = await renderPdfFromUrl(urls.view);
  const attachments = pdf
    ? [{ filename: `back-of-the-box-${opts.kidName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${opts.date}.pdf`, content: pdf.toString("base64") }]
    : undefined;
  const ok = await sendEmail({
    to: opts.to,
    subject: `${opts.kidName}'s Back of the Box — ${weekday}`,
    html: dispatchEmailHtml({ kidName: opts.kidName, dateLabel: `${weekday} · ${dateLabel}`, openUrl: urls.print }),
    attachments,
  });
  return { ok, withPdf: !!attachments };
}

export type SendResult =
  | { status: "sent"; withPdf: boolean; token: string }
  | { status: "saved"; token: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * Deliver one kid's dispatch for today: save the run (the exact sheet), then
 * email it if the dispatch is on email delivery. Safe to call more than once —
 * a per-kid-per-day claim stops double sends, and a kid already delivered
 * today is skipped unless `force` (test sends). `noEmail` saves the run only.
 */
export async function sendOneDispatch(
  job: SendJob,
  opts: { force?: boolean; noEmail?: boolean } = {},
): Promise<SendResult> {
  const state = await readStore(job.userKey);
  const kid = state.kids.find((k) => k.id === job.kidId);
  if (!kid) return { status: "skipped", reason: "kid not found" };
  const { localDate, delivery, due } = dueInfo(kid, state);
  if (!delivery) return { status: "skipped", reason: "no delivery method set" };
  if (!opts.force && !due) return { status: "skipped", reason: "not due / already delivered" };

  const claimKey = `sendlock:${job.userKey}:${kid.id}:${localDate}${opts.force ? `:force:${Date.now()}` : ""}`;
  if (!(await claim(claimKey))) return { status: "skipped", reason: "another send in progress" };

  try {
    const ref = { userKey: job.userKey, kidId: kid.id, date: localDate };
    const { token } = await createRun({ ...ref, kidName: kid.name, delivery });

    let result: SendResult = { status: "saved", token };
    if (delivery === "email" && !opts.noEmail) {
      const sent = await emailRun({ token, kidName: kid.name, date: localDate, to: kid.deliveryEmail! });
      if (!sent.ok) {
        await deletePayload(claimKey); // let the next run retry
        return { status: "failed", reason: "email provider rejected the send" };
      }
      await markRunEmailed(ref, kid.deliveryEmail!, sent.withPdf);
      await logEvent({
        type: "email_sent",
        user_key: job.userKey,
        meta: { kidId: kid.id, kidName: kid.name, withPdf: sent.withPdf, date: localDate, forced: !!opts.force },
      });
      result = { status: "sent", withPdf: sent.withPdf, token };
    }

    // Mark delivered on a FRESH copy so settings saved meanwhile aren't undone.
    const fresh = await readStore(job.userKey);
    const fk = fresh.kids.find((k) => k.id === kid.id);
    if (fk) {
      fk.lastEmailedDate = localDate;
      await writeStore(job.userKey, fresh);
    }
    return result;
  } catch (e) {
    await deletePayload(claimKey);
    return { status: "failed", reason: e instanceof Error ? e.message : "error" };
  }
}
