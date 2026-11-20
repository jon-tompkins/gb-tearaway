import { notFound } from "next/navigation";
import { editionSendLabel } from "@/lib/free/copy";
import { editionById } from "@/lib/free/editions";
import { freeEditionGate } from "@/lib/free/runtime";
import { FreeShell } from "../shell";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; edition?: string }>;
}) {
  const gate = await freeEditionGate();
  if (!gate.ok) notFound();
  const { status, edition: editionId } = await searchParams;
  const expired = status === "expired";
  const edition = editionId ? gate.runtime.editions.find((e) => e.id === editionId) ?? editionById(editionId) : undefined;
  const when = editionSendLabel(edition ?? { sendHour: 6, timezone: "America/New_York" });
  return (
    <FreeShell>
      <h1 className="font-display text-3xl text-ink">{expired ? "That link has expired" : "You’re confirmed"}</h1>
      <p className="mt-4 text-ink-soft">
        {expired
          ? "Request a new confirmation from the free page. Links last 72 hours."
          : `The daily page will arrive around ${when}. You can unsubscribe from any email.`}
      </p>
    </FreeShell>
  );
}
