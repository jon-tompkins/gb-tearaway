import { createHash, randomBytes } from "node:crypto";
import { claimPayload, deletePayload, listPayloadsByPrefix, loadPayload, savePayload } from "../persist";
import { claimIsStale, freePdfCacheKey, normalizeEmail, type FreeSubscriber } from "./subscriber";

const SUB = "free:sub:";
const EMAIL = "free:email:";

export function newSubscriberId(): string {
  return `fs_${randomBytes(9).toString("hex")}`;
}

export function emailIndex(email: string): string {
  return EMAIL + createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

export async function loadSubscriber(id: string): Promise<FreeSubscriber | null> {
  const row = await loadPayload<FreeSubscriber>(SUB + id);
  if (!row || typeof row.id !== "string" || typeof row.email !== "string") return null;
  return row;
}

export async function findSubscriberByEmail(email: string): Promise<FreeSubscriber | null> {
  const idx = await loadPayload<{ id?: string }>(emailIndex(email));
  if (!idx?.id) return null;
  return loadSubscriber(idx.id);
}

export async function saveSubscriber(sub: FreeSubscriber): Promise<void> {
  await savePayload(SUB + sub.id, sub);
  await savePayload(emailIndex(sub.email), { id: sub.id });
}

export async function listSubscribers(): Promise<FreeSubscriber[]> {
  const rows = await listPayloadsByPrefix<FreeSubscriber>(SUB);
  return rows
    .map((r) => r.value)
    .filter((s): s is FreeSubscriber => !!s && typeof s.id === "string" && typeof s.email === "string" && typeof s.status === "string");
}

export async function loadEditionPdf(editionId: string, date: string): Promise<Buffer | null> {
  const row = await loadPayload<{ pdf?: string }>(freePdfCacheKey(editionId, date));
  if (!row?.pdf) return null;
  const buf = Buffer.from(row.pdf, "base64");
  if (buf.subarray(0, 5).toString() !== "%PDF-") return null;
  return buf;
}

export async function saveEditionPdf(editionId: string, date: string, pdf: Buffer): Promise<boolean> {
  await savePayload(freePdfCacheKey(editionId, date), {
    pdf: pdf.toString("base64"),
    createdAt: new Date().toISOString(),
  });
  const again = await loadEditionPdf(editionId, date);
  return !!again;
}

/** Claim a key. A claim older than `staleMs` is dropped and taken again. */
export async function claimFresh(key: string, staleMs: number, nowMs = Date.now()): Promise<boolean> {
  const value = { at: new Date(nowMs).toISOString() };
  if (await claimPayload(key, value)) return true;
  const existing = await loadPayload<{ at?: string }>(key);
  if (!claimIsStale(existing?.at, nowMs, staleMs)) return false;
  await deletePayload(key);
  return claimPayload(key, value);
}

export async function releaseClaim(key: string): Promise<void> {
  await deletePayload(key);
}
