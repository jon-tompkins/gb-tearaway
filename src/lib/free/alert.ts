import { sendEmail } from "../email";
import { claimPayload } from "../persist";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Log a free-edition failure and, once per code per day, email SUPPORT_NOTIFY_EMAIL
 * when that address is set. Never throws.
 */
export async function alertFreeFailure(code: string, message: string): Promise<void> {
  console.error(`[free-editions] ${message}`);
  const day = new Date().toISOString().slice(0, 10);
  const key = `free:alert:${day}:${code.replace(/[^a-z0-9:_-]/gi, "").slice(0, 80)}`;
  try {
    const won = await claimPayload(key, { at: new Date().toISOString(), message: message.slice(0, 500) });
    if (!won) return;
  } catch {
    return;
  }
  const to = process.env.SUPPORT_NOTIFY_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    subject: `[Back of the Box] free edition: ${code}`,
    html: `<p>${esc(message)}</p>`,
  });
}
