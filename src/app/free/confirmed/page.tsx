import { notFound } from "next/navigation";
import { freeEditionAccess } from "@/lib/free/flag";
import { FreeShell } from "../shell";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!freeEditionAccess().ok) notFound();
  const { status } = await searchParams;
  const expired = status === "expired";
  return (
    <FreeShell>
      <h1 className="font-display text-3xl text-ink">{expired ? "That link has expired" : "You’re confirmed"}</h1>
      <p className="mt-4 text-ink-soft">
        {expired
          ? "Request a new confirmation from the free page. Links last 72 hours."
          : "The daily page will arrive around 6:00 a.m. local time for the edition you picked. You can unsubscribe from any email."}
      </p>
    </FreeShell>
  );
}
