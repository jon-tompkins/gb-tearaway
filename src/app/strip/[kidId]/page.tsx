import { notFound } from "next/navigation";
import { buildJobForKid } from "@/lib/serverStrip";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StripPage({
  params,
  searchParams,
}: {
  params: Promise<{ kidId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { kidId } = await params;
  const { date } = await searchParams;
  const store = await readStore();
  const kid = store.kids.find((k) => k.id === kidId);
  if (!kid) notFound();

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <main style={{ fontFamily: "monospace", padding: 24, background: "#f4eee3" }}>
        date must be YYYY-MM-DD
      </main>
    );
  }

  const job = await buildJobForKid(kid, { dateISO: date });

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "#1a100c",
        display: "flex",
        justifyContent: "center",
        padding: "32px 12px",
      }}
    >
      <iframe
        title={`Back of the Box for ${kid.name}`}
        srcDoc={job.previewHtml}
        style={{
          width: 420,
          maxWidth: "100%",
          minHeight: 720,
          height: "90vh",
          border: "none",
          borderRadius: 4,
          background: "#f4eee3",
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        }}
      />
    </main>
  );
}
