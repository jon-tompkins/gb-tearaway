import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { findContentViolations, parseDenylist } from "../src/lib/content/safetyScan";
import { slotSizeUnits, type ModuleId } from "../src/lib/types";
import { FREE_UPGRADE_TEXT } from "../src/lib/free/copy";
import {
  FREE_EDITIONS,
  buildFreeKid,
  editionById,
  liveEditions,
  slotsForEdition,
  type FreeEdition,
} from "../src/lib/free/editions";
import { freeEditionAccess, freeEditionsEnabled, freeMailingAddress } from "../src/lib/free/flag";
import {
  applyKeep,
  applyUnsubscribe,
  applyUpgradeStop,
  freePdfCacheKey,
  freeSendClaimKey,
  noteTrialStart,
  planFreeSends,
  rejectSignup,
  type FreeSubscriber,
} from "../src/lib/free/subscriber";
import { CONFIRM_TTL_MS, LINK_TTL_MS, mintFreeToken, verifyFreeToken } from "../src/lib/free/tokens";

const SECRET = "test-secret";
const DUE = new Date("2026-11-20T11:00:00.000Z");
const NOT_DUE = new Date("2026-11-20T10:59:00.000Z");
const ADDRESS = "100 Main Street, Brooklyn, NY 11201";

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function sub(partial: Partial<FreeSubscriber> = {}): FreeSubscriber {
  return {
    id: "fs_test",
    email: "parent@example.com",
    editionId: "generic-4-6",
    status: "confirmed",
    createdAt: "2026-11-01T00:00:00.000Z",
    ...partial,
  };
}

function ids(edition: FreeEdition, date: string): ModuleId[] {
  return slotsForEdition(edition, date).flatMap((s) => s.moduleIds);
}

test("free editions stay off unless the flag is explicitly on", () => {
  assert.equal(freeEditionsEnabled({}), false);
  assert.equal(freeEditionsEnabled({ FREE_EDITIONS_ENABLED: "" }), false);
  assert.equal(freeEditionsEnabled({ FREE_EDITIONS_ENABLED: "0" }), false);
  assert.equal(freeEditionsEnabled({ FREE_EDITIONS_ENABLED: "false" }), false);
  assert.equal(freeEditionsEnabled({ FREE_EDITIONS_ENABLED: "1" }), true);
  assert.equal(freeEditionsEnabled({ FREE_EDITIONS_ENABLED: "true" }), true);
  assert.deepEqual(freeEditionAccess({}), { ok: false, status: 404 });
  assert.deepEqual(freeEditionAccess({ FREE_EDITIONS_ENABLED: "on" }), { ok: true });
});

test("flag off plans no free sends, even when subscribers are due", () => {
  const plan = planFreeSends({
    enabled: false,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [sub()],
  });
  assert.equal(plan.outcome, "disabled");
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.dueCount, 0);
  assert.equal(rejectSignup({ enabled: false, email: "a@b.co", editionLive: true }), "off");
});

test("an empty mailing address refuses the send", () => {
  assert.equal(freeMailingAddress({}), "");
  assert.equal(freeMailingAddress({ FREE_EDITION_MAILING_ADDRESS: "  " }), "");
  const plan = planFreeSends({
    enabled: true,
    mailingAddress: "   ",
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [sub(), sub({ id: "fs_2", editionId: "nyc-4-6" })],
  });
  assert.equal(plan.outcome, "no-address");
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.dueCount, 2);
});

test("delivery is 6:00 in the edition timezone and once per subscriber per day", () => {
  const early = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: NOT_DUE,
    editions: FREE_EDITIONS,
    subscribers: [sub()],
  });
  assert.equal(early.jobs.length, 0);

  const due = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [sub(), sub({ id: "fs_nyc", editionId: "nyc-4-6" })],
  });
  assert.equal(due.outcome, "ok");
  assert.equal(due.jobs.length, 2);
  assert.equal(due.jobs[0].date, "2026-11-20");
  assert.equal(due.jobs[0].cacheKey, due.jobs[1].cacheKey.replace("nyc-4-6", "generic-4-6"));
  assert.equal(due.jobs[0].cacheKey, freePdfCacheKey("generic-4-6", "2026-11-20"));
  assert.equal(due.jobs[1].cacheKey, freePdfCacheKey("nyc-4-6", "2026-11-20"));

  const again = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [sub({ lastSentDate: "2026-11-20" })],
  });
  assert.equal(again.jobs.length, 0);
  assert.equal(again.dueCount, 1);

  const claimed = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [sub()],
    claimed: new Set([freeSendClaimKey("fs_test", "2026-11-20")]),
  });
  assert.equal(claimed.jobs.length, 0);
});

test("a not-yet-live city edition is not delivered", () => {
  const afternoon = new Date("2026-11-20T14:00:00.000Z");
  const hidden = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: afternoon,
    editions: FREE_EDITIONS,
    subscribers: [sub({ id: "fs_la", editionId: "la-4-6" })],
  });
  assert.equal(hidden.jobs.length, 0);

  const launched = FREE_EDITIONS.map((e) => (e.id === "la-4-6" ? { ...e, live: true } : e));
  const shown = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: afternoon,
    editions: launched,
    subscribers: [sub({ id: "fs_la", editionId: "la-4-6" })],
  });
  assert.equal(shown.jobs.length, 1);
  assert.equal(shown.jobs[0].editionId, "la-4-6");
});

test("upgrade pauses the free edition unless the parent keeps it", () => {
  const at = "2026-11-20T15:00:00.000Z";
  const paused = applyUpgradeStop(sub({ confirmedAt: "2026-11-01T00:00:00.000Z" }), "custom_page", at);
  assert.equal(paused.changed, true);
  assert.equal(paused.subscriber.status, "paused");
  assert.equal(paused.subscriber.pauseReason, "custom_page");
  assert.equal(applyUpgradeStop(paused.subscriber, "billing", at).changed, false);

  const stopped = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [paused.subscriber],
  });
  assert.equal(stopped.jobs.length, 0);

  const kept = applyKeep(paused.subscriber, at);
  assert.equal(kept.keepFree, true);
  assert.equal(kept.status, "confirmed");
  assert.equal(applyUpgradeStop(kept, "trial", at).changed, false);
  const still = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [kept],
  });
  assert.equal(still.jobs.length, 1);

  const noted = noteTrialStart(kept, at);
  assert.equal(noted.log, true);
  assert.equal(noteTrialStart(noted.subscriber, at).log, false);
});

test("unsubscribe stops delivery and a second click does not log again", () => {
  const at = "2026-11-20T15:00:00.000Z";
  const first = applyUnsubscribe(sub(), at);
  assert.equal(first.log, true);
  assert.equal(first.subscriber.status, "unsubscribed");
  assert.equal(applyUnsubscribe(first.subscriber, at).log, false);
  const plan = planFreeSends({
    enabled: true,
    mailingAddress: ADDRESS,
    now: DUE,
    editions: FREE_EDITIONS,
    subscribers: [first.subscriber, sub({ id: "fs_pending", status: "pending" })],
  });
  assert.equal(plan.jobs.length, 0);
});

test("signup gate rejects a honeypot and a bad edition", () => {
  assert.equal(rejectSignup({ enabled: true, company: "acme", email: "a@b.co", editionLive: true }), "honeypot");
  assert.equal(rejectSignup({ enabled: true, email: "not-an-email", editionLive: true }), "email");
  assert.equal(rejectSignup({ enabled: true, email: "a@b.co", editionLive: false }), "edition");
  assert.equal(rejectSignup({ enabled: true, email: "a@b.co", editionLive: true }), "ok");
});

test("confirmation tokens expire and other links stay signed", () => {
  const now = 1_700_000_000_000;
  const confirm = mintFreeToken("confirm", { s: "fs_1", e: "generic-4-6" }, SECRET, now);
  assert.equal(verifyFreeToken(confirm, SECRET, now + 1, "confirm")?.s, "fs_1");
  assert.equal(verifyFreeToken(confirm, SECRET, now + 1, "unsubscribe"), null);
  assert.equal(verifyFreeToken(confirm, SECRET, now + CONFIRM_TTL_MS, "confirm"), null);
  assert.ok(verifyFreeToken(confirm, SECRET, now + CONFIRM_TTL_MS - 1, "confirm"));

  const unsub = mintFreeToken("unsubscribe", { s: "fs_1" }, SECRET, now);
  assert.ok(verifyFreeToken(unsub, SECRET, now + CONFIRM_TTL_MS + 1000, "unsubscribe"));
  assert.equal(verifyFreeToken(unsub, SECRET, now + LINK_TTL_MS, "unsubscribe"), null);

  const flipped = confirm.slice(0, -1) + (confirm.endsWith("a") ? "b" : "a");
  assert.equal(verifyFreeToken(flipped, SECRET, now + 1, "confirm"), null);
  assert.equal(verifyFreeToken(confirm, "other-secret", now + 1, "confirm"), null);
  assert.equal(verifyFreeToken("not-a-token", SECRET, now, "confirm"), null);
});

test("edition rotation is deterministic, shared, and fills the page", () => {
  assert.deepEqual(
    liveEditions().map((e) => e.id),
    ["generic-4-6", "generic-7-10", "nyc-4-6"],
  );
  for (const id of ["nyc-7-10", "la-4-6", "la-7-10"]) {
    assert.equal(editionById(id)?.live, false);
  }

  const generic = editionById("generic-4-6")!;
  const medium = editionById("generic-7-10")!;
  const nyc = editionById("nyc-4-6")!;
  const date = "2026-11-20";

  assert.deepEqual(slotsForEdition(generic, date), slotsForEdition(generic, date));
  assert.deepEqual(
    ids(nyc, date).filter((id) => id !== "weather"),
    ids(generic, date),
  );
  assert.deepEqual(ids(medium, date), ids(generic, date));
  assert.ok(ids(nyc, date).includes("weather"));
  assert.equal(ids(generic, date).includes("weather"), false);

  const easy = slotsForEdition(generic, date)[0];
  const med = slotsForEdition(medium, date)[0];
  const moduleId = easy.moduleIds[0];
  assert.equal(easy.moduleDifficulty?.[moduleId], 3);
  assert.equal(med.moduleDifficulty?.[moduleId], 8);
  assert.equal(buildFreeKid(generic, date).ageBand, "4-6");
  assert.equal(buildFreeKid(medium, date).ageBand, "7-9");
  assert.equal(buildFreeKid(generic, date).name, "Reader");
  assert.deepEqual(buildFreeKid(generic, date).events, []);

  const signatures = new Set<string>();
  for (let i = 0; i < 8; i++) signatures.add(ids(generic, addDays(date, i)).join(","));
  assert.ok(signatures.size >= 4, `expected variety, got ${signatures.size}`);

  for (const edition of FREE_EDITIONS) {
    for (let i = 0; i < 12; i++) {
      const day = addDays("2026-01-01", i);
      const slots = slotsForEdition(edition, day);
      for (const col of [0, 1]) {
        const units = slots.filter((s) => (s.column ?? 0) === col).reduce((n, s) => n + slotSizeUnits(s.size), 0);
        assert.equal(units, 8, `${edition.id} ${day} column ${col} is ${units}`);
      }
      const modules = slots.flatMap((s) => s.moduleIds);
      if (edition.weatherCity) assert.ok(modules.includes("weather"), edition.id);
      else assert.equal(modules.includes("weather"), false);
      for (const banned of ["stocks", "sports", "sportsnews", "calendar", "news_city"] as const) {
        assert.equal(modules.includes(banned), false, banned);
      }
    }
  }

  const seen = new Set<ModuleId>();
  for (let i = 0; i < 120; i++) {
    for (const id of ids(generic, addDays("2026-01-01", i))) seen.add(id);
  }
  for (const id of ["maze", "sudoku", "wordfind", "crossword", "joke", "poem", "news_world", "news_national", "dots", "fact"] as const) {
    assert.ok(seen.has(id), `rotation never picked ${id}`);
  }
});

test("free edition copy stays inside the content denylist", () => {
  const terms = parseDenylist(readFileSync(path.join(process.cwd(), "src/lib/content/safety-denylist.txt"), "utf8"));
  const pieces = [
    { source: "free-upgrade", text: FREE_UPGRADE_TEXT },
    ...FREE_EDITIONS.map((e) => ({ source: e.id, text: `${e.label} ${e.levelLabel} ${e.ageLabel}` })),
  ];
  const hits = findContentViolations(pieces, terms);
  assert.deepEqual(hits, [], hits.map((h) => `${h.source}: ${h.term}`).join("\n"));
});
