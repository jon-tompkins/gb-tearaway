import { formatStripDate } from "../dates";
import { sendEmail } from "../email";
import { FREE_UPGRADE_TEXT, freeUpgradeUrl } from "./copy";
import type { FreeEdition } from "./editions";
import { freeMailingAddress, siteOrigin } from "./flag";
import { mintFreeToken } from "./tokens";
import type { FreeSubscriber } from "./subscriber";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function footer(opts: { address: string; unsubUrl: string; switchUrl: string }): string {
  return `<tr><td style="padding-top:22px;font-size:12px;line-height:1.5;color:#5c564c">
      <a href="${esc(opts.switchUrl)}" style="color:#1c1915">Switch edition</a>
      &nbsp;·&nbsp;
      <a href="${esc(opts.unsubUrl)}" style="color:#1c1915">Unsubscribe</a>
    </td></tr>
    <tr><td style="padding-top:14px;font-size:11px;line-height:1.45;color:#8a7d63">
      You are receiving this because you asked for a free daily page from Back of the Box.<br/>
      ${esc(opts.address).replace(/\n/g, "<br/>")}
    </td></tr>`;
}

function shell(dateLabel: string, inner: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4eee3;font-family:Georgia,'Times New Roman',serif;color:#1c1915">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eee3;padding:28px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#faf6ec;border:1px solid #e3d9c4;border-radius:14px;padding:32px">
        <tr><td align="center" style="padding-bottom:8px">
          <div style="font-size:26px;font-weight:700;letter-spacing:-.01em">Back of the Box</div>
          <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a7d63;margin-top:4px">${esc(dateLabel)}</div>
        </td></tr>
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function links(secret: string, sub: FreeSubscriber, now: number) {
  const site = siteOrigin();
  const unsub = mintFreeToken("unsubscribe", { s: sub.id }, secret, now);
  const sw = mintFreeToken("switch", { s: sub.id }, secret, now);
  return {
    unsubUrl: `${site}/free/unsubscribe?token=${encodeURIComponent(unsub)}`,
    switchUrl: `${site}/free/switch?token=${encodeURIComponent(sw)}`,
    listUnsub: `${site}/api/free/unsubscribe?token=${encodeURIComponent(unsub)}`,
  };
}

function listHeaders(listUnsub: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${listUnsub}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Confirmation mail. Refuses when the mailing address or the flag's caller already bailed. */
export async function sendFreeConfirmEmail(opts: {
  subscriber: FreeSubscriber;
  edition: FreeEdition;
  secret: string;
  now?: number;
}): Promise<boolean> {
  const address = freeMailingAddress();
  if (!address) {
    console.error("[free-editions] FREE_EDITION_MAILING_ADDRESS is empty; refusing confirmation email");
    return false;
  }
  const now = opts.now ?? Date.now();
  const site = siteOrigin();
  const token = mintFreeToken("confirm", { s: opts.subscriber.id, e: opts.edition.id }, opts.secret, now);
  const confirmUrl = `${site}/api/free/confirm?token=${encodeURIComponent(token)}`;
  const { unsubUrl, switchUrl, listUnsub } = links(opts.secret, opts.subscriber, now);
  const upgrade = freeUpgradeUrl(opts.edition.id, site);
  const html = shell("Confirm your email", `
        <tr><td style="padding:18px 0 6px;font-size:16px;line-height:1.5">
          Confirm and you'll get the <strong>${esc(opts.edition.label)}</strong> page each morning. It's the same page for every family on this edition. No child names are stored.
        </td></tr>
        <tr><td align="center" style="padding:22px 0 8px">
          <a href="${esc(confirmUrl)}" style="display:inline-block;background:#1c1915;color:#faf6ec;text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:700;padding:14px 26px;border-radius:999px">Confirm my email</a>
        </td></tr>
        <tr><td style="padding-top:8px;font-size:13px;line-height:1.5;color:#5c564c">This link expires in 72 hours.</td></tr>
        <tr><td style="padding-top:16px;font-size:14px;line-height:1.5"><a href="${esc(upgrade)}" style="color:#1c1915">${esc(FREE_UPGRADE_TEXT)}</a></td></tr>
        ${footer({ address, unsubUrl, switchUrl })}
      `);
  return sendEmail({
    to: opts.subscriber.email,
    subject: "Confirm your free Back of the Box",
    html,
    headers: listHeaders(listUnsub),
  });
}

/** The daily edition. Caller has already checked the flag, the address, and the PDF. */
export async function sendFreeDailyEmail(opts: {
  subscriber: FreeSubscriber;
  edition: FreeEdition;
  date: string;
  pdf: Buffer;
  secret: string;
  address: string;
  now?: number;
}): Promise<boolean> {
  const now = opts.now ?? Date.now();
  const site = siteOrigin();
  const { weekday, dateLabel } = formatStripDate(opts.date);
  const openToken = mintFreeToken("open", { s: opts.subscriber.id, e: opts.edition.id, d: opts.date }, opts.secret, now);
  const openUrl = `${site}/api/free/open?token=${encodeURIComponent(openToken)}`;
  const { unsubUrl, switchUrl, listUnsub } = links(opts.secret, opts.subscriber, now);
  const upgrade = freeUpgradeUrl(opts.edition.id, site);
  const html = shell(`${weekday} · ${dateLabel}`, `
        <tr><td align="center" style="padding:18px 0 6px;font-size:16px;line-height:1.5">
          Today's <strong>${esc(opts.edition.label)}</strong> page is ready to print. Everyone on this edition gets the same one.
        </td></tr>
        <tr><td align="center" style="padding:22px 0 8px">
          <a href="${esc(openUrl)}" style="display:inline-block;background:#1c1915;color:#faf6ec;text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:700;padding:14px 26px;border-radius:999px">Open today's page</a>
        </td></tr>
        <tr><td align="center" style="font-size:12px;color:#8a7d63">The PDF is attached.</td></tr>
        <tr><td style="padding-top:18px;font-size:14px;line-height:1.5"><a href="${esc(upgrade)}" style="color:#1c1915">${esc(FREE_UPGRADE_TEXT)}</a></td></tr>
        ${footer({ address: opts.address, unsubUrl, switchUrl })}
      `);
  const file = `back-of-the-box-${opts.edition.id}-${opts.date}.pdf`;
  return sendEmail({
    to: opts.subscriber.email,
    subject: `Today's Back of the Box — ${weekday}`,
    html,
    attachments: [{ filename: file, content: opts.pdf.toString("base64") }],
    headers: listHeaders(listUnsub),
  });
}
