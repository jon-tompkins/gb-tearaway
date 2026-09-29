/**
 * Render a URL to a US-Letter PDF buffer with headless Chromium.
 *
 * Uses @sparticuz/chromium (a Vercel/Lambda-compatible Chromium build) with
 * puppeteer-core. Locally (no serverless), falls back to a system Chrome if
 * PUPPETEER_EXECUTABLE_PATH is set. Returns null on any failure so callers can
 * still send the link-only email.
 */
export async function renderPdfFromUrl(url: string): Promise<Buffer | null> {
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    // Serverless-friendly: skip GPU/WebGL to cut memory + launch time.
    chromium.setGraphicsMode = false;

    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || (await chromium.executablePath());

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 816, height: 1056 },
      executablePath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      // "load" is far more reliable than networkidle0 for a static print page —
      // networkidle0 can hang for the full timeout if any connection lingers.
      await page.goto(url, { waitUntil: "load", timeout: 25000 });
      await page.emulateMediaType("print");
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    // Don't crash the caller (email still sends link-only), but leave a trail in
    // the Vercel logs so a missing PDF attachment is diagnosable.
    console.error("[pdf] renderPdfFromUrl failed:", e instanceof Error ? e.stack || e.message : e);
    return null;
  }
}
