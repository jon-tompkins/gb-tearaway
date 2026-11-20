/**
 * First-name-only check for a kid profile name on the setup save path.
 * Storage stays a plain string — this only rejects values that are not a first name.
 */

export const KID_NAME_MAX = 24;

/**
 * Letters, with an internal apostrophe or hyphen when the name needs one
 * (O'Brien, Anne-Marie). No spaces, emails, or digits.
 */
const FIRST_NAME = /^[\p{L}](?:[\p{L}]|['’][\p{L}]|-[\p{L}])*$/u;

export function kidNameError(raw: unknown): string | null {
  if (typeof raw !== "string") return "Use a first name only.";
  const name = raw.trim();
  if (!name) return "Give a first name.";
  if (name.length > KID_NAME_MAX) {
    return `Use a first name of ${KID_NAME_MAX} characters or fewer.`;
  }
  if (/\s/.test(name) || name.includes("@")) {
    return "Use a first name only — no spaces or email addresses.";
  }
  if (/\d/.test(name)) return "Use a first name only — leave out numbers.";
  if (!FIRST_NAME.test(name)) {
    return "Use a first name only — letters, with a hyphen or apostrophe if the name needs one.";
  }
  return null;
}

/** Trimmed first name, or throws the same message the setup form shows. */
export function assertKidFirstName(raw: string): string {
  const err = kidNameError(raw);
  if (err) throw new Error(err);
  return raw.trim();
}
