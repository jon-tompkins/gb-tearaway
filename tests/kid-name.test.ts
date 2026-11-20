import assert from "node:assert/strict";
import { test } from "node:test";
import { assertKidFirstName, kidNameError } from "../src/lib/kidName";
import { patchStore } from "../src/lib/store";

test("accepts a first name, including hyphen and apostrophe", () => {
  assert.equal(kidNameError("Sam"), null);
  assert.equal(assertKidFirstName("  Sam  "), "Sam");
  assert.equal(kidNameError("Anne-Marie"), null);
  assert.equal(kidNameError("O'Brien"), null);
  assert.equal(kidNameError("José"), null);
});

test("rejects full names, emails, digits, and oversized strings", () => {
  assert.match(kidNameError("Sam Smith") ?? "", /first name/);
  assert.match(kidNameError("kid@school.edu") ?? "", /email/);
  assert.match(kidNameError("Sam2") ?? "", /number/);
  assert.match(kidNameError("5551212") ?? "", /number/);
  assert.match(kidNameError("") ?? "", /first name/);
  assert.match(kidNameError("A".repeat(25)) ?? "", /24/);
  assert.throws(() => assertKidFirstName("My page"), /first name/);
});

test("setup save path rejects a kid name that is not a first name", async () => {
  const key = `user:kid-name-${Date.now()}@example.com`;
  await assert.rejects(
    () => patchStore(key, { createKid: { name: "Sam Smith", ageBand: "7-9" } }),
    /first name/,
  );
  await assert.rejects(
    () => patchStore(key, { createKid: { name: "sam@school.edu", ageBand: "4-6" } }),
    /email/,
  );
  const saved = await patchStore(key, { createKid: { name: "  Sam  ", ageBand: "4-6" } });
  assert.equal(saved.kids.at(-1)?.name, "Sam");
  await assert.rejects(
    () => patchStore(key, { kid: { id: saved.kids.at(-1)?.id, name: "Sam2" } }),
    /number/,
  );
});
