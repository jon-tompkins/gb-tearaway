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
      await page.goto(url, { waitUntil: "networkidle0", timeout: 25000 });
      await page.emulateMediaType("print");
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}
