/**
 * Render a URL to a US-Letter PDF buffer with headless Chromium.
 *
 * Uses @sparticuz/chromium (a Vercel/Lambda-compatible Chromium build) with
 * puppeteer-core. Locally (no serverless), falls back to a system Chrome if
 * PUPPETEER_EXECUTABLE_PATH is set. Returns null on any failure so callers can
 * still send the link-only email.
 */
import type { Browser } from "puppeteer-core";

async function launchBrowser(): Promise<Browser> {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;

  // Serverless-friendly: skip GPU/WebGL to cut memory + launch time.
  chromium.setGraphicsMode = false;

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || (await chromium.executablePath());

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 816, height: 1056 },
    executablePath,
    headless: true,
  });
}

function logPdfFailure(where: string, e: unknown) {
  // Don't crash the caller (email still sends link-only), but leave a trail in
  // the Vercel logs so a missing PDF attachment is diagnosable.
  console.error(`[pdf] ${where} failed:`, e instanceof Error ? e.stack || e.message : e);
}

export async function renderPdfFromUrl(url: string): Promise<Buffer | null> {
  try {
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      // "load" is far more reliable than networkidle0 for a static print page —
      // networkidle0 can hang for the full timeout if any connection lingers.
      // Timeout is generous: the target render may do uncached live work
      // (news/history/Haiku) on the first request of the day.
      await page.goto(url, { waitUntil: "load", timeout: 50000 });
      await page.emulateMediaType("print");
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    logPdfFailure("renderPdfFromUrl", e);
    return null;
  }
}

/**
 * Same Chromium launch as renderPdfFromUrl, but the HTML is already in hand
 * (the sample render test, which has no running server). Returns null when
 * headless Chromium cannot start.
 */
export async function renderPdfFromHtml(html: string): Promise<Buffer | null> {
  try {
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 30000 });
      await page.emulateMediaType("print");
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    logPdfFailure("renderPdfFromHtml", e);
    return null;
  }
}
