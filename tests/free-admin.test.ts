import assert from "node:assert/strict";
import { test } from "node:test";
import { FREE_UPGRADE_TEXT } from "../src/lib/free/copy";
import { FREE_EDITIONS, editionById } from "../src/lib/free/editions";
import { ADMIN_TEST_DAILY_CAP, ADMIN_TEST_GAP_MS, ADMIN_TEST_SEND_KEY, adminDenied, decideAdminTestSend, reserveAdminTestSend, type AdminTestBudget } from "../src/lib/free/adminOps";
import { deletePayload, loadPayload } from "../src/lib/persist";
import {
  archiveEdition,
  defaultFreeAdminSettings,
  effectiveMailingAddress,
  freeEditionsActive,
  normalizeFreeAdmin,
  singleTestRecipient,
} from "../src/lib/free/settings";
import { planFreeSends, type FreeSubscriber } from "../src/lib/free/subscriber";

const DUE = new Date("2026-11-20T11:00:00.000Z");

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

test("a non-admin is turned away from free-edition admin routes", () => {
  assert.equal(adminDenied(false), 404);
  assert.equal(adminDenied(true), null);
});

test("the env kill switch overrides the admin toggle", () => {
  assert.equal(freeEditionsActive(true, {}), false);
  assert.equal(freeEditionsActive(true, { FREE_EDITIONS_ENABLED: "0" }), false);
  assert.equal(freeEditionsActive(false, { FREE_EDITIONS_ENABLED: "1" }), false);
  assert.equal(freeEditionsActive(true, { FREE_EDITIONS_ENABLED: "1" }), true);
});

test("the mailing address falls back to the env var and refuses when both are empty", () => {
  const defaults = defaultFreeAdminSettings();
  assert.equal(effectiveMailingAddress(defaults, {}), "");
  assert.equal(effectiveMailingAddress(defaults, { FREE_EDITION_MAILING_ADDRESS: "1 Env Street" }), "1 Env Street");
  assert.equal(effectiveMailingAddress({ mailingAddress: "  2 Saved Ave  " }, {}), "2 Saved Ave");
  const blocked = planFreeSends({
    enabled: true,
    mailingAddress: effectiveMailingAddress(defaults, {}),
    now: DUE,
    editions: defaults.editions,
    subscribers: [sub()],
  });
  assert.equal(blocked.outcome, "no-address");
  assert.equal(blocked.jobs.length, 0);
});

test("saved settings start from the code edition list", () => {
  const defaults = defaultFreeAdminSettings();
  assert.equal(defaults.enabled, true);
  assert.equal(defaults.upgradeText, FREE_UPGRADE_TEXT);
  assert.deepEqual(defaults.editions.map((e) => e.id), FREE_EDITIONS.map((e) => e.id));
  assert.equal(defaults.editions.find((e) => e.id === "nyc-7-10")?.live, false);
  assert.equal(defaults.editions.find((e) => e.id === "la-4-6")?.live, false);
  const merged = normalizeFreeAdmin({ enabled: false, editions: [{ id: "generic-4-6", label: "Little kids", sendHour: 8 }] });
  assert.equal(merged.enabled, false);
  assert.equal(merged.editions.find((e) => e.id === "generic-4-6")?.label, "Little kids");
  assert.equal(merged.editions.find((e) => e.id === "generic-4-6")?.sendHour, 8);
  assert.equal(merged.editions.find((e) => e.id === "generic-4-6")?.timezone, "America/New_York");
  assert.equal(merged.editions.find((e) => e.id === "nyc-4-6")?.live, true);
});

test("admin test sends wait 30 seconds and stop at 20 a day", () => {
  const start = Date.parse("2026-11-20T15:00:00.000Z");
  const first = decideAdminTestSend(null, start);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.next.count, 1);
  assert.equal(first.next.day, "2026-11-20");

  const tooSoon = decideAdminTestSend(first.next, start + ADMIN_TEST_GAP_MS - 1);
  assert.equal(tooSoon.ok, false);
  if (tooSoon.ok) return;
  assert.match(tooSoon.error, /30 seconds/);

  let budget: AdminTestBudget = first.next;
  const later = decideAdminTestSend(budget, start + ADMIN_TEST_GAP_MS);
  assert.equal(later.ok, true);
  if (!later.ok) return;
  budget = later.next;
  while (budget.count < ADMIN_TEST_DAILY_CAP) {
    const step = decideAdminTestSend(budget, budget.lastAt + ADMIN_TEST_GAP_MS);
    assert.equal(step.ok, true);
    if (!step.ok) return;
    budget = step.next;
  }
  assert.equal(budget.count, 20);
  const capped = decideAdminTestSend(budget, budget.lastAt + ADMIN_TEST_GAP_MS);
  assert.equal(capped.ok, false);
  if (capped.ok) return;
  assert.match(capped.error, /20 a day/);

  const nextDay = decideAdminTestSend(budget, Date.parse("2026-11-21T15:00:00.000Z"));
  assert.equal(nextDay.ok, true);
  if (!nextDay.ok) return;
  assert.equal(nextDay.next.count, 1);
  assert.equal(nextDay.next.day, "2026-11-21");
});

test("the test-send cooldown is stored in botb_state", async () => {
  await deletePayload(ADMIN_TEST_SEND_KEY);
  try {
    const now = Date.parse("2026-11-20T15:00:00.000Z");
    assert.equal((await reserveAdminTestSend(now)).ok, true);
    const stored = await loadPayload<{ count: number; day: string; lastAt: number }>(ADMIN_TEST_SEND_KEY);
    assert.equal(stored?.count, 1);
    assert.equal(stored?.day, "2026-11-20");
    assert.equal(stored?.lastAt, now);
    const again = await reserveAdminTestSend(now + 1000);
    assert.equal(again.ok, false);
  } finally {
    await deletePayload(ADMIN_TEST_SEND_KEY);
  }
});

test("a test send accepts one address and rejects a list", () => {
  assert.deepEqual(singleTestRecipient("Admin@Example.com"), { ok: true, email: "admin@example.com" });
  assert.equal(singleTestRecipient("a@b.co, c@d.co").ok, false);
  assert.equal(singleTestRecipient("a@b.co c@d.co").ok, false);
  assert.equal(singleTestRecipient("not-an-email").ok, false);
});

test("editing the send time does not send twice, and an earlier hour is not due yet", () => {
  const edition = { ...editionById("generic-4-6")!, sendHour: 9, sendMinute: 30 };
  const tooEarly = planFreeSends({
    enabled: true,
    mailingAddress: "1 Main",
    now: DUE,
    editions: [edition],
    subscribers: [sub()],
  });
  assert.equal(tooEarly.jobs.length, 0);
  const later = new Date("2026-11-20T15:00:00.000Z");
  const due = planFreeSends({
    enabled: true,
    mailingAddress: "1 Main",
    now: later,
    editions: [edition],
    subscribers: [sub()],
  });
  assert.equal(due.jobs.length, 1);
  const again = planFreeSends({
    enabled: true,
    mailingAddress: "1 Main",
    now: later,
    editions: [edition],
    subscribers: [sub({ lastSentDate: "2026-11-20" })],
  });
  assert.equal(again.jobs.length, 0);
  assert.equal(again.dueCount, 1);
});

test("archiving an edition stops mail and keeps the subscriber record", () => {
  const archived = archiveEdition(defaultFreeAdminSettings(), "generic-4-6");
  const edition = archived.editions.find((e) => e.id === "generic-4-6")!;
  assert.equal(edition.archived, true);
  assert.equal(edition.live, false);
  const subscriber = sub();
  const plan = planFreeSends({
    enabled: true,
    mailingAddress: "1 Main",
    now: DUE,
    editions: archived.editions,
    subscribers: [subscriber],
  });
  assert.equal(plan.jobs.length, 0);
  assert.equal(subscriber.email, "parent@example.com");
});
