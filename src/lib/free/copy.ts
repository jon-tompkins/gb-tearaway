import { siteOrigin } from "./flag";

const ZONE_NAME: Record<string, string> = {
  "America/New_York": "Eastern",
  "America/Chicago": "Central",
  "America/Denver": "Mountain",
  "America/Los_Angeles": "Pacific",
};

/** "6:00 a.m. Eastern", from the edition's send hour and timezone. */
export function editionSendLabel(edition: { sendHour: number; timezone: string }): string {
  const hour = edition.sendHour % 12 || 12;
  const suffix = edition.sendHour < 12 || edition.sendHour === 24 ? "a.m." : "p.m.";
  return `${hour}:00 ${suffix} ${ZONE_NAME[edition.timezone] ?? edition.timezone}`;
}

/** Exact upgrade line printed on every free PDF and in the daily email. */
export const FREE_UPGRADE_TEXT =
  "Want your kid's own page, with the puzzles they love at just the right difficulty? Make your own, free for 30 days, no card needed.";

export type FreeUtmMedium = "email" | "print";

/** Setup link. Emails use utm_medium=email. The printed page uses utm_medium=print. */
export function freeUpgradeUrl(editionId: string, site = siteOrigin(), medium: FreeUtmMedium = "email"): string {
  const u = new URL("/app/setup", site.endsWith("/") ? site : `${site}/`);
  u.searchParams.set("utm_source", "free_edition");
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_content", editionId);
  return u.toString();
}

/** Short path printed on the PDF. It redirects to the setup link with utm_medium=print. */
export function freeStartPath(editionId: string): string {
  return `/start/${editionId}`;
}

/** What a parent can type from the paper. No scheme, so it fits the footer. */
export function freeStartLabel(editionId: string): string {
  return `backofthebox.xyz/start/${editionId}`;
}

export function freeStartUrl(editionId: string, site = siteOrigin()): string {
  return new URL(freeStartPath(editionId), site.endsWith("/") ? site : `${site}/`).toString();
}
