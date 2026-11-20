import { siteOrigin } from "./flag";

/** Exact upgrade line printed on every free PDF and in the daily email. */
export const FREE_UPGRADE_TEXT =
  "Want your kid's own page, with the puzzles they love at just the right difficulty? Make your own, free for 30 days, no card needed.";

/** Setup link carried on the free PDF and in the email body. */
export function freeUpgradeUrl(editionId: string, site = siteOrigin()): string {
  const u = new URL("/app/setup", site.endsWith("/") ? site : `${site}/`);
  u.searchParams.set("utm_source", "free_edition");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_content", editionId);
  return u.toString();
}
