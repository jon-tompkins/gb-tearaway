import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  adminCookieValid,
  adminCookieValue,
  allowAdminPasswordAttempt,
  hasAdminAccess,
  passwordLoginEnabled,
  passwordOk,
} from "../src/lib/admin";

const PASSWORD = "correct-horse-battery";
const SECRET = "production-auth-secret-value";

/** Cookie the old fallbacks issued when ADMIN_PASSWORD and AUTH_SECRET were unset. */
function legacyCookie(): string {
  return createHmac("sha256", "botb-admin").update("admin:nimda").digest("hex");
}

test("password login is rejected when ADMIN_PASSWORD is unset", () => {
  const env = { AUTH_SECRET: SECRET };
  assert.equal(passwordLoginEnabled(env), false);
  assert.equal(passwordOk("nimda", env), false);
  assert.equal(passwordOk(PASSWORD, env), false);
  assert.equal(passwordOk("", env), false);
  assert.equal(adminCookieValue(env), null);
  assert.equal(hasAdminAccess({ cookie: legacyCookie(), email: null }, env), false);
});

test("nimda never works", () => {
  const cases: Record<string, string | undefined>[] = [
    {},
    { ADMIN_PASSWORD: "nimda" },
    { ADMIN_PASSWORD: "nimda", AUTH_SECRET: "botb-admin" },
    { ADMIN_PASSWORD: "nimda", AUTH_SECRET: SECRET },
    { ADMIN_PASSWORD: PASSWORD, AUTH_SECRET: SECRET },
    { AUTH_SECRET: SECRET },
  ];
  for (const env of cases) {
    assert.equal(passwordOk("nimda", env), false, JSON.stringify(env));
    assert.equal(adminCookieValid(legacyCookie(), env), false, JSON.stringify(env));
    assert.equal(hasAdminAccess({ cookie: legacyCookie(), email: null }, env), false, JSON.stringify(env));
  }
  assert.equal(passwordLoginEnabled({ ADMIN_PASSWORD: "nimda" }), false);
  assert.equal(passwordLoginEnabled({ ADMIN_PASSWORD: "123456789012345" }), false);
  assert.equal(passwordOk("123456789012345", { ADMIN_PASSWORD: "123456789012345" }), false);
});

test("a cookie signed with botb-admin is rejected", () => {
  const env = { AUTH_SECRET: SECRET, ADMIN_PASSWORD: PASSWORD };
  const issued = adminCookieValue(env);
  assert.equal(typeof issued, "string");
  assert.notEqual(issued, legacyCookie());
  assert.equal(adminCookieValid(issued, env), true);
  assert.equal(adminCookieValid(legacyCookie(), env), false);

  const signedWithOldSecret = createHmac("sha256", "botb-admin").update(`admin:${PASSWORD}`).digest("hex");
  assert.equal(adminCookieValid(signedWithOldSecret, env), false);
  assert.equal(hasAdminAccess({ cookie: signedWithOldSecret, email: null }, env), false);

  assert.equal(adminCookieValue({ ADMIN_PASSWORD: PASSWORD }), null);
  assert.equal(adminCookieValid(issued, { ADMIN_PASSWORD: PASSWORD }), false);
  assert.equal(adminCookieValid(legacyCookie(), {}), false);
  assert.equal(adminCookieValid(legacyCookie(), { AUTH_SECRET: "botb-admin", ADMIN_PASSWORD: PASSWORD }), false);
});

test("owner Google login still grants admin", () => {
  const env = { ADMIN_EMAILS: "owner@example.com" };
  assert.equal(hasAdminAccess({ cookie: null, email: "owner@example.com" }, env), true);
  assert.equal(hasAdminAccess({ cookie: null, email: " Owner@Example.com " }, env), true);
  assert.equal(hasAdminAccess({ cookie: legacyCookie(), email: "owner@example.com" }, env), true);
  assert.equal(passwordOk("nimda", env), false);
});

test("non-admin gets denied", () => {
  const env = { ADMIN_EMAILS: "owner@example.com", AUTH_SECRET: SECRET, ADMIN_PASSWORD: PASSWORD };
  assert.equal(hasAdminAccess({ cookie: null, email: "visitor@example.com" }, env), false);
  assert.equal(hasAdminAccess({ cookie: legacyCookie(), email: "visitor@example.com" }, env), false);
  assert.equal(hasAdminAccess({ cookie: null, email: null }, env), false);
  assert.equal(hasAdminAccess({ cookie: null, email: "" }, {}), false);
  assert.equal(hasAdminAccess({ cookie: "not-a-cookie", email: "visitor@example.com" }, env), false);
});

test("a configured password still signs a cookie with AUTH_SECRET", () => {
  const env = { AUTH_SECRET: SECRET, ADMIN_PASSWORD: PASSWORD };
  assert.equal(passwordLoginEnabled(env), true);
  assert.equal(passwordOk(PASSWORD, env), true);
  assert.equal(passwordOk("correct-horse-batteries", env), false);
  assert.equal(passwordOk("x", env), false);
  const issued = adminCookieValue(env);
  assert.equal(issued, createHmac("sha256", SECRET).update(`admin:${PASSWORD}`).digest("hex"));
  assert.equal(hasAdminAccess({ cookie: issued, email: null }, env), true);
});

test("admin password attempts are rate limited", () => {
  const ip = "203.0.113.50";
  const start = 1_700_000_000_000;
  for (let i = 0; i < 8; i++) assert.equal(allowAdminPasswordAttempt(ip, start), true);
  assert.equal(allowAdminPasswordAttempt(ip, start + 1_000), false);
  assert.equal(allowAdminPasswordAttempt("203.0.113.51", start), true);
  assert.equal(allowAdminPasswordAttempt(ip, start + 15 * 60_000), true);
});
