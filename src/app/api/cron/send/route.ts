import { NextResponse } from "next/server";
import { writeStore } from "@/lib/store";
import { listUserStates } from "@/lib/persist";
import { partsInZone, dateISOInZone, formatStripDate } from "@/lib/dates";
import { saveDispatchRef } from "@/lib/deliver";
import { sendEmail, dispatchEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → allow (dev)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true; // Vercel Cron sends this
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

/**
 * Delivery cron — run hourly. Emails each email-delivery dispatch whose local
 * delivery hour has arrived and that hasn't been sent yet today. Idempotent via
 * kid.lastEmailedDate. `?force=1` (with the secret) ignores the hour/dedupe for
 * a manual test send.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const force = new URL(req.url).searchParams.get("force") === "1";
  const now = new Date();

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  const users = await listUserStates();
  for (const { userKey, state } of users) {
    let dirty = false;
    for (const kid of state.kids) {
      const method = kid.deliveryMethod ?? "email";
      const to = kid.deliveryEmail;
      if (method !== "email" || !to) {
        skipped++;
        continue;
      }
      const tz = kid.timezone || state.settings.timezone;
      const localDate = dateISOInZone(tz, now);
      const { hour } = partsInZone(tz, now);
      const deliverHour = Number((kid.printTime || "07:00").split(":")[0]);

      const due = force || (hour === deliverHour && kid.lastEmailedDate !== localDate);
      if (!due) {
        skipped++;
        continue;
      }

      try {
        const token = await saveDispatchRef({ userKey, kidId: kid.id, date: localDate });
        const openUrl = `${SITE}/api/render?token=${token}&format=print&auto=1`;
        const { weekday, dateLabel } = formatStripDate(localDate);
        const ok = await sendEmail({
          to,
          subject: `${kid.name}'s Back of the Box — ${weekday}`,
          html: dispatchEmailHtml({ kidName: kid.name, dateLabel: `${weekday} · ${dateLabel}`, openUrl }),
        });
        if (ok) {
          kid.lastEmailedDate = localDate;
          dirty = true;
          sent++;
        } else {
          errors.push(`${userKey}/${kid.id}: send failed`);
        }
      } catch (e) {
        errors.push(`${userKey}/${kid.id}: ${e instanceof Error ? e.message : "error"}`);
      }
    }
    if (dirty) await writeStore(userKey, state);
  }

  return NextResponse.json({ sent, skipped, errors });
}
