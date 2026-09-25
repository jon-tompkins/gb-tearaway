const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Back of the Box <digest@backofthebox.xyz>";

/** Send one email via Resend. Returns false (never throws) when unconfigured/failed. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  /** Resend attachments: base64 `content`. */
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<boolean> {
  if (!RESEND_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Branded morning email — one button to open today's printable dispatch. */
export function dispatchEmailHtml(opts: {
  kidName: string;
  dateLabel: string;
  openUrl: string;
}): string {
  const { kidName, dateLabel, openUrl } = opts;
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4eee3;font-family:Georgia,'Times New Roman',serif;color:#1c1915">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eee3;padding:28px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#faf6ec;border:1px solid #e3d9c4;border-radius:14px;padding:32px">
        <tr><td align="center" style="padding-bottom:8px">
          <div style="font-size:26px;font-weight:700;letter-spacing:-.01em">Back of the Box</div>
          <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a7d63;margin-top:4px">${dateLabel}</div>
        </td></tr>
        <tr><td align="center" style="padding:18px 0 6px;font-size:16px;line-height:1.5">
          Good morning! <strong>${kidName}&rsquo;s</strong> Back of the Box for today is ready to print.
        </td></tr>
        <tr><td align="center" style="padding:22px 0 8px">
          <a href="${openUrl}" style="display:inline-block;background:#1c1915;color:#faf6ec;text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:700;letter-spacing:.02em;padding:14px 26px;border-radius:999px">
            Open today&rsquo;s dispatch &rarr;
          </a>
        </td></tr>
        <tr><td align="center" style="padding-top:10px;font-size:12px;color:#8a7d63;line-height:1.5">
          Today&rsquo;s paper is attached as a PDF — or tap above for a print-ready page.<br/>
          Kids get paper only. Scan the QR on the page for answers.
        </td></tr>
      </table>
      <div style="max-width:520px;margin-top:14px;font-size:11px;color:#a99e86;text-align:center">Made for the fridge, not the feed.</div>
    </td></tr>
  </table>
</body></html>`;
}
