import { readStore, writeStore } from "./store";
import { claimPayload, deletePayload, loadPayload } from "./persist";
import { dateISOInZone, formatStripDate, partsInZone } from "./dates";
import { saveDispatchRef } from "./deliver";
import { sendEmail, dispatchEmailHtml } from "./email";
import { renderPdfFromUrl } from "./pdf";
import { logEvent } from "./events";
import type { AppState, KidProfile } from "./types";

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";

/** A claim older than this is assumed to belong to a send that crashed. */
const STALE_CLAIM_MS = 10 * 60_000;

export interface SendJob {
  userKey: string;
  kidId: string;
}

/** Local date + whether this kid's email is due now (delivery hour passed, not sent today). */
export function dueInfo(kid: KidProfile, state: AppState, now = new Date()) {
  const tz = kid.timezone || state.settings.timezone;
  const localDate = dateISOInZone(tz, now);
  const { hour } = partsInZone(tz, now);
  const deliverHour = Number((kid.printTime || "07:00").split(":")[0]);
  const emailable = (kid.deliveryMethod ?? "email") === "email" && !!kid.deliveryEmail;
  return { localDate, emailable, due: emailable && hour >= deliverHour && kid.lastEmailedDate !== localDate };
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

export type SendResult =
  | { status: "sent"; withPdf: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * Send one kid's dispatch email — render the PDF, email it, mark it sent.
 * Safe to call more than once: a per-kid-per-day claim stops double sends, and
 * a kid already marked sent today is skipped (unless `force`, for test sends).
 */
export async function sendOneDispatch(job: SendJob, opts: { force?: boolean } = {}): Promise<SendResult> {
  const state = await readStore(job.userKey);
  const kid = state.kids.find((k) => k.id === job.kidId);
  if (!kid) return { status: "skipped", reason: "kid not found" };
  const { localDate, emailable, due } = dueInfo(kid, state);
  if (!emailable) return { status: "skipped", reason: "not on email delivery" };
  if (!opts.force && !due) return { status: "skipped", reason: "not due / already sent" };

  const claimKey = `sendlock:${job.userKey}:${kid.id}:${localDate}${opts.force ? `:force:${Date.now()}` : ""}`;
  if (!(await claim(claimKey))) return { status: "skipped", reason: "another send in progress" };

  try {
    const token = await saveDispatchRef({ userKey: job.userKey, kidId: kid.id, date: localDate });
    const openUrl = `${SITE}/api/render?token=${token}&format=print&auto=1`;
    const { weekday, dateLabel } = formatStripDate(localDate);
    const pdf = await renderPdfFromUrl(`${SITE}/api/render?token=${token}&format=print`);
    const attachments = pdf
      ? [{ filename: `back-of-the-box-${kid.name.toLowerCase()}-${localDate}.pdf`, content: pdf.toString("base64") }]
      : undefined;

    const ok = await sendEmail({
      to: kid.deliveryEmail!,
      subject: `${kid.name}'s Back of the Box — ${weekday}`,
      html: dispatchEmailHtml({ kidName: kid.name, dateLabel: `${weekday} · ${dateLabel}`, openUrl }),
      attachments,
    });
    if (!ok) {
      await deletePayload(claimKey); // let the next run retry
      return { status: "failed", reason: "email provider rejected the send" };
    }

    // Mark sent on a FRESH copy so settings saved during the send aren't undone.
    const fresh = await readStore(job.userKey);
    const fk = fresh.kids.find((k) => k.id === kid.id);
    if (fk) {
      fk.lastEmailedDate = localDate;
      await writeStore(job.userKey, fresh);
    }
    await logEvent({
      type: "email_sent",
      user_key: job.userKey,
      meta: { kidId: kid.id, kidName: kid.name, withPdf: !!attachments, date: localDate, forced: !!opts.force },
    });
    return { status: "sent", withPdf: !!attachments };
  } catch (e) {
    await deletePayload(claimKey);
    return { status: "failed", reason: e instanceof Error ? e.message : "error" };
  }
}
