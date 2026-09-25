import { hashString } from "./rng";
import { loadPayload, savePayload } from "./persist";

/** What a delivery token resolves to — enough to re-render the dispatch publicly. */
export interface DispatchRef {
  userKey: string;
  kidId: string;
  date: string; // YYYY-MM-DD
}

/** Stable token for a user's dispatch on a given day (reused across re-sends). */
export function dispatchToken(userKey: string, kidId: string, date: string): string {
  return (hashString(`${userKey}|${kidId}|${date}|dispatch`) >>> 0).toString(36);
}

export async function saveDispatchRef(ref: DispatchRef): Promise<string> {
  const token = dispatchToken(ref.userKey, ref.kidId, ref.date);
  await savePayload(`dispatch:${token}`, ref);
  return token;
}

export async function loadDispatchRef(token: string): Promise<DispatchRef | null> {
  return loadPayload<DispatchRef>(`dispatch:${token}`);
}
