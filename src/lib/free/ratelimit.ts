import { loadPayload, savePayload } from "../persist";

/**
 * Same shape as the support form limiter: a short in-memory window plus a
 * daily counter in botb_state. Signup is the only public write.
 */
const mem = new Map<string, { n: number; reset: number }>();

function bump(id: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (v.reset < now) mem.delete(k);
  const cur = mem.get(id);
  if (!cur || cur.reset < now) {
    mem.set(id, { n: 1, reset: now + windowMs });
    return true;
  }
  cur.n++;
  return cur.n <= limit;
}

async function bumpDaily(id: string, limit: number): Promise<boolean> {
  const key = `freerl:${new Date().toISOString().slice(0, 10)}:${id}`;
  try {
    const cur = (await loadPayload<{ n: number }>(key))?.n ?? 0;
    if (cur >= limit) return false;
    await savePayload(key, { n: cur + 1 });
    return true;
  } catch {
    return bump(`d:${id}`, limit, 86_400_000);
  }
}

export async function allowFreeSignup(ids: { email: string; ip: string }): Promise<boolean> {
  const perMin = bump(`m:e:${ids.email}`, 5, 60_000) && bump(`m:ip:${ids.ip}`, 8, 60_000);
  if (!perMin) return false;
  return (await bumpDaily(`e:${ids.email}`, 8)) && (await bumpDaily(`ip:${ids.ip}`, 30));
}
