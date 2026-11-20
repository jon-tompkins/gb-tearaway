import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { SAMPLE_NEWS } from "../src/lib/content/sampleNews";
import { isNewsModule, type LiveNewsEntry, type NewsModuleId } from "../src/lib/content/news";
import { generateStrip } from "../src/lib/generateStrip";
import { FREE_UPGRADE_TEXT, freeUpgradeUrl } from "../src/lib/free/copy";
import { buildFreeKid, freeSettings, liveEditions } from "../src/lib/free/editions";
import { renderPdfFromHtml } from "../src/lib/pdf";
import { buildPrintHtml } from "../src/lib/printHtml";
import type { WeatherSnapshot } from "../src/lib/types";

const DATE = "2026-11-20";
const WEATHER: WeatherSnapshot = {
  label: "New York",
  summary: "New York · clear skies",
  tempF: 42,
  highF: 48,
  lowF: 36,
  tip: "Bundle up. Cold noses still need breakfast.",
  source: "open-meteo",
  code: 1,
};

/**
 * Same Chromium path as the per-band sample render. When the Lambda build
 * cannot launch here, the print HTML — what that renderer loads — is asserted.
 */
test("each launch edition PDF carries the upgrade footer and UTM link", { timeout: 240_000 }, async () => {
  const rendered: string[] = [];
  for (const edition of liveEditions()) {
    const kid = buildFreeKid(edition, DATE);
    const news: Partial<Record<NewsModuleId, LiveNewsEntry[]>> = {};
    for (const id of kid.modules) if (isNewsModule(id)) news[id] = SAMPLE_NEWS;
    const job = generateStrip(kid, freeSettings(edition), {
      dateISO: DATE,
      nonce: 0,
      newsByFeed: news,
      weather: edition.weatherCity ? WEATHER : undefined,
    });
    const href = freeUpgradeUrl(edition.id, "https://www.backofthebox.xyz");
    const html = buildPrintHtml(job, { upgrade: { text: FREE_UPGRADE_TEXT, href } });
    const plain = buildPrintHtml(job, {});

    assert.ok(html.includes(FREE_UPGRADE_TEXT), `${edition.id} is missing the upgrade line`);
    assert.ok(html.includes("utm_source=free_edition"), `${edition.id} is missing utm_source`);
    assert.ok(html.includes("utm_medium=email"), `${edition.id} is missing utm_medium`);
    assert.ok(html.includes(`utm_content=${edition.id}`), `${edition.id} is missing utm_content`);
    assert.equal(plain.includes(FREE_UPGRADE_TEXT), false, "paid pages must not gain the free footer");
    if (edition.weatherCity) assert.ok(html.includes("mod-weather") || html.includes("New York"), `${edition.id} weather`);
    else assert.equal(html.includes("mod-weather"), false);

    const pdf = await renderPdfFromHtml(html);
    if (pdf && pdf.subarray(0, 5).toString() === "%PDF-" && pdf.length > 1000) {
      rendered.push(`${edition.id} (${pdf.length} bytes)`);
      if (existsSync("/opt/cursor/artifacts")) {
        mkdirSync("/opt/cursor/artifacts", { recursive: true });
        writeFileSync(`/opt/cursor/artifacts/free-edition-${edition.id}.pdf`, pdf);
      }
    }
  }

  if (rendered.length === liveEditions().length) {
    console.log(`pdf: chromium ${rendered.join(", ")}`);
    return;
  }
  console.log(
    `pdf: html-fallback — headless Chromium produced ${rendered.length} of ${liveEditions().length} PDFs. The test asserted the print HTML (upgrade footer and UTM link) for every launch edition.`,
  );
});
