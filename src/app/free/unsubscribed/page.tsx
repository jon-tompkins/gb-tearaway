import Link from "next/link";
import { notFound } from "next/navigation";
import { freeEditionAccess } from "@/lib/free/flag";
import { FreeShell } from "../shell";

export const dynamic = "force-dynamic";

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!freeEditionAccess().ok) notFound();
  const { status } = await searchParams;
  const invalid = status === "expired";
  return (
    <FreeShell>
      <h1 className="font-display text-3xl text-ink">{invalid ? "That link doesn’t work" : "You’re unsubscribed"}</h1>
      <p className="mt-4 text-ink-soft">
        {invalid
          ? "The unsubscribe link is invalid or expired. Use the link in a recent email."
          : "You won’t get the free daily page anymore."}
      </p>
      <p className="mt-6">
        <Link href="/free" className="font-semibold text-ink underline">
          Sign up again
        </Link>
      </p>
    </FreeShell>
  );
}
