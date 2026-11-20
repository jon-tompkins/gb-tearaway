import { notFound } from "next/navigation";
import { editionSendLabel } from "@/lib/free/copy";
import { liveEditions } from "@/lib/free/editions";
import { freeEditionAccess } from "@/lib/free/flag";
import { readSwitchToken } from "@/lib/free/flow";
import { loadSubscriber } from "@/lib/free/repo";
import { FreeShell } from "../shell";

export const dynamic = "force-dynamic";

export default async function SwitchPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  if (!freeEditionAccess().ok) notFound();
  const { token, status } = await searchParams;
  if (status === "updated") {
    return (
      <FreeShell>
        <h1 className="font-display text-3xl text-ink">Edition updated</h1>
        <p className="mt-4 text-ink-soft">Tomorrow&apos;s page will match the edition you picked.</p>
      </FreeShell>
    );
  }

  const payload = readSwitchToken(token);
  const sub = payload ? await loadSubscriber(payload.s) : null;
  const editions = liveEditions();
  const invalid = !payload || !sub || sub.status === "unsubscribed";

  return (
    <FreeShell>
      <h1 className="font-display text-3xl text-ink">Switch edition</h1>
      {status === "invalid" || invalid ? (
        <p className="mt-4 text-ink-soft">That link doesn&apos;t work anymore. Use the link in a recent email.</p>
      ) : (
        <form action="/api/free/switch" method="post" className="card mt-6 space-y-3">
          <input type="hidden" name="token" value={token ?? ""} />
          {editions.map((e) => (
            <label key={e.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-rule bg-paper px-4 py-3">
              <input type="radio" name="editionId" value={e.id} defaultChecked={e.id === sub.editionId} className="mt-1" required />
              <span>
                <span className="block font-semibold text-ink">{e.label}</span>
                <span className="block text-sm text-ink-soft">
                  {e.levelLabel}
                  {e.weatherCity ? ` · ${e.weatherCity} weather` : " · no city weather"}
                  {" · "}
                  {editionSendLabel(e)}
                </span>
              </span>
            </label>
          ))}
          <button type="submit" className="btn-primary">
            Save edition
          </button>
        </form>
      )}
    </FreeShell>
  );
}
