import { notFound } from "next/navigation";
import { freeEditionAccess } from "@/lib/free/flag";
import { FreeShell } from "../shell";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (!freeEditionAccess().ok) notFound();
  const { token } = await searchParams;
  return (
    <FreeShell>
      <h1 className="font-display text-3xl text-ink">Unsubscribe</h1>
      <p className="mt-4 text-ink-soft">This stops the free daily page. It doesn&apos;t affect a custom page if you have one.</p>
      {token ? (
        <form action="/api/free/unsubscribe" method="post" className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn-primary">
            Unsubscribe
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">Open the unsubscribe link from your email.</p>
      )}
    </FreeShell>
  );
}
