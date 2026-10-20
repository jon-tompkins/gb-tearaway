import Link from "next/link";
import { AppShell } from "@/components/AppNav";
import { requireAdmin } from "@/lib/admin";
import { MODULE_CATALOG, MODULE_CATEGORIES } from "@/lib/modules";
import { ADMIN_MODULES, AGE_BANDS, SOURCE_LABEL, bankCounts } from "@/lib/adminModules";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Back of the Box" };

export default async function AdminHome() {
  await requireAdmin();
  return (
    <AppShell title="Admin" subtitle="Every module, where its content comes from, and how big its bank is.">
      <div className="space-y-8">
        {MODULE_CATEGORIES.map((cat) => {
          const mods = MODULE_CATALOG.filter((m) => m.category === cat.id);
          if (!mods.length) return null;
          return (
            <section key={cat.id}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">{cat.name}</h2>
              <div className="overflow-x-auto rounded-xl border border-rule bg-paper">
                <table className="w-full text-sm">
                  <thead className="text-left text-[0.65rem] uppercase tracking-wide text-ink-soft">
                    <tr className="border-b border-rule">
                      <th className="px-3 py-2">Module</th>
                      <th className="px-3 py-2">Source</th>
                      {AGE_BANDS.map((b) => (
                        <th key={b} className="px-3 py-2 text-right">{b}</th>
                      ))}
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mods.map((m) => {
                      const info = ADMIN_MODULES[m.id];
                      const counts = bankCounts(info);
                      return (
                        <tr key={m.id} className="border-b border-rule/50 last:border-0">
                          <td className="px-3 py-2">
                            <Link href={`/admin/modules/${m.id}`} className="font-semibold text-ink hover:underline">
                              {m.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-ink-soft">{SOURCE_LABEL[info.kind]}</td>
                          {AGE_BANDS.map((b) => (
                            <td key={b} className="px-3 py-2 text-right tabular-nums text-ink-soft">
                              {counts?.perBand[b] ?? "—"}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right tabular-nums">{counts?.total ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
