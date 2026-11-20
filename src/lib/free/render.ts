import { collectAnswers, collectStories, answersToken } from "../answers";
import { type LiveNewsEntry, type NewsModuleId } from "../content/news";
import { generateStrip } from "../generateStrip";
import { gatherDailyNews } from "../news/daily";
import { renderPdfFromHtml } from "../pdf";
import { buildPrintHtml } from "../printHtml";
import { qrSvg } from "../qr";
import { savePayload } from "../persist";
import type { ModuleId, PrintJob } from "../types";
import { fetchWeather } from "../weather";
import { FREE_UPGRADE_TEXT, freeStartLabel, freeStartUrl, freeUpgradeUrl } from "./copy";
import { buildFreeKid, freeSettings, replaceUnfilledNews, type FreeEdition } from "./editions";
import { siteOrigin } from "./flag";
import { loadEditionPdf, releaseClaim, saveEditionPdf, claimFresh } from "./repo";

const QR_PX = 96;

const GEN_STALE_MS = 3 * 60_000;

/** The shared print job for one edition on one local date. */
export async function buildFreeEditionJob(edition: FreeEdition, dateISO: string): Promise<PrintJob> {
  const seeded = buildFreeKid(edition, dateISO);
  let live: Partial<Record<NewsModuleId, LiveNewsEntry[]>> | undefined;
  try {
    live = await gatherDailyNews(seeded.modules, { city: edition.weatherCity });
  } catch (e) {
    console.error("[free-editions] news fetch failed", edition.id, e instanceof Error ? e.message : e);
  }
  const counts: Partial<Record<string, number>> = {};
  for (const [id, items] of Object.entries(live ?? {})) counts[id] = items?.length ?? 0;
  const filled = replaceUnfilledNews(seeded.slots, counts, edition, dateISO);
  for (const swap of filled.swaps) {
    console.error(
      `[free-editions] no live news for ${edition.id} on ${dateISO} (${swap.from}); ${swap.to ? `using ${swap.to} instead` : "skipped the card"}`,
    );
  }
  const modules: ModuleId[] = [];
  for (const slot of filled.slots) {
    for (const id of slot.moduleIds) if (!modules.includes(id)) modules.push(id);
  }
  const kid = { ...seeded, slots: filled.slots, modules, accessModules: modules };
  let weather = null;
  if (edition.weatherCity) {
    try {
      weather = await fetchWeather({
        city: edition.weatherCity,
        zip: edition.weatherZip,
        timezone: edition.timezone,
        ageBand: edition.ageBand,
        allowMock: false,
      });
    } catch (e) {
      console.error("[free-editions] weather fetch failed", edition.id, e instanceof Error ? e.message : e);
    }
  }
  return generateStrip(kid, freeSettings(edition), {
    dateISO,
    nonce: 0,
    newsByFeed: live,
    weather,
  });
}

export function freeEditionHtml(job: PrintJob, edition: FreeEdition, answersQr?: string, site = siteOrigin()): string {
  const start = freeStartUrl(edition.id, site);
  return buildPrintHtml(job, {
    qrSvg: answersQr,
    upgrade: {
      text: FREE_UPGRADE_TEXT,
      href: freeUpgradeUrl(edition.id, site, "print"),
      qrSvg: qrSvg(start, { sizePx: QR_PX }),
      printLabel: freeStartLabel(edition.id),
    },
  });
}

async function answerQr(job: PrintJob, edition: FreeEdition): Promise<string | undefined> {
  const items = collectAnswers(job);
  const stories = collectStories(job);
  if (!items.length && !stories.length) return undefined;
  const token = answersToken(job.kidId, job.date, job.nonce);
  await savePayload(`answers:${token}`, {
    kidName: edition.label,
    date: job.date,
    items,
    stories,
    generatedAt: new Date().toISOString(),
  });
  return qrSvg(`${siteOrigin()}/answers/${token}`, { sizePx: 96 });
}

/** Render the shared PDF. Null when Chromium cannot produce one. */
export async function renderFreeEditionPdf(edition: FreeEdition, dateISO: string): Promise<Buffer | null> {
  try {
    const job = await buildFreeEditionJob(edition, dateISO);
    const qr = await answerQr(job, edition);
    const html = freeEditionHtml(job, edition, qr);
    const pdf = await renderPdfFromHtml(html);
    if (!pdf || pdf.subarray(0, 5).toString() !== "%PDF-") {
      console.error(`[free-editions] no PDF for ${edition.id} ${dateISO}`);
      return null;
    }
    return pdf;
  } catch (e) {
    console.error("[free-editions] render failed", edition.id, dateISO, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * One PDF per edition per local date. A later recipient reuses the cached file.
 * Returns null when rendering failed; the caller must not send.
 */
export async function ensureFreeEditionPdf(edition: FreeEdition, dateISO: string): Promise<Buffer | null> {
  const cached = await loadEditionPdf(edition.id, dateISO);
  if (cached) return cached;
  const lock = `free:gen:${edition.id}:${dateISO}`;
  const won = await claimFresh(lock, GEN_STALE_MS);
  if (!won) {
    await new Promise((r) => setTimeout(r, 4000));
    return loadEditionPdf(edition.id, dateISO);
  }
  const pdf = await renderFreeEditionPdf(edition, dateISO);
  if (!pdf) {
    await releaseClaim(lock);
    return null;
  }
  const saved = await saveEditionPdf(edition.id, dateISO, pdf);
  if (!saved) {
    console.error(`[free-editions] could not cache PDF for ${edition.id} ${dateISO}`);
    await releaseClaim(lock);
  }
  return pdf;
}
