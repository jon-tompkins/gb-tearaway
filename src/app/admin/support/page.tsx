import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { AdminSupportDone } from "@/components/AdminSupportDone";
import { requireAdmin } from "@/lib/admin";
import { listPayloadFields } from "@/lib/persist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support · Admin · Back of the Box" };

export default async function AdminSupportPage() {
  await requireAdmin();
  const rows = await listPayloadFields("support:", ["kind", "text", "email", "createdAt", "status"], 200);
  return (
    <AppShell title="Admin">
      <AdminTabs active="support" />
      <p className="-mt-2 mb-4 text-sm text-ink-soft">
        Requests and messages from the Help chat, newest first. {rows.length === 0 ? "Nothing yet (or no Supabase configured)." : ""}
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="card space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
              <span>
                <span className="rounded-full bg-cream px-2 py-0.5 font-bold uppercase tracking-wider text-ink">
                  {(r.kind ?? "other").replace(/_/g, " ")}
                </span>{" "}
                {r.email || "anonymous"} · {r.createdAt ? new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/New_York" }) : ""}
              </span>
              <AdminSupportDone itemKey={r.key} initialDone={r.status === "done"} />
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink">{r.text}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
