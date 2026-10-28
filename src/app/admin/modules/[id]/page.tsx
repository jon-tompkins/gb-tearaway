import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { requireAdmin } from "@/lib/admin";
import { isModuleId, moduleById, moduleSize, moduleSizes } from "@/lib/modules";
import { AdminSample } from "@/components/AdminSample";
import { minDifficultyFor } from "@/lib/difficulty";
import type { AgeBand } from "@/lib/types";
import { ADMIN_MODULES, AGE_BANDS, SOURCE_LABEL, joinBands, type Table } from "@/lib/adminModules";

export const dynamic = "force-dynamic";

function DataTable({ table, band, q }: { table: Table; band?: AgeBand; q?: string }) {
  const needle = q?.trim().toLowerCase();
  const rows = table.rows.filter(
    (r) =>
      (!band || !r.bands || r.bands.includes(band)) &&
      (!needle || r.cells.some((c) => c.toLowerCase().includes(needle))),
  );
  const showBands = table.rows.some((r) => r.bands?.length);
  return (
    <div>
      <p className="mb-2 text-xs text-ink-soft">
        Showing {rows.length} of {table.rows.length}
      </p>
      <div className="overflow-x-auto rounded-xl border border-rule bg-paper">
        <table className="w-full text-sm">
          <thead className="text-left text-[0.65rem] uppercase tracking-wide text-ink-soft">
            <tr className="border-b border-rule">
              <th className="px-3 py-2 text-right">#</th>
              {table.columns.map((c) => (
                <th key={c} className="px-3 py-2">{c}</th>
              ))}
              {showBands ? <th className="px-3 py-2">Ages</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-rule/50 align-top last:border-0">
                <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{i + 1}</td>
                {r.cells.map((c, j) => (
                  <td key={j} className="px-3 py-2 text-ink">
                    {/^https?:\/\//.test(c) ? (
                      <a href={c} target="_blank" rel="noreferrer" className="font-semibold underline">
                        open
                      </a>
                    ) : (
                      c
                    )}
                  </td>
                ))}
                {showBands ? (
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-ink-soft">{r.bands ? joinBands(r.bands) : ""}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminModule({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ band?: string; q?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!isModuleId(id)) notFound();
  const sp = await searchParams;
  const band = AGE_BANDS.includes(sp.band as AgeBand) ? (sp.band as AgeBand) : undefined;
  const meta = moduleById(id);
  const info = ADMIN_MODULES[id];
  const bank = info.bank?.();
  const recent = info.recent ? await info.recent() : [];

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-semibold ${
      active ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft hover:border-ink/30"
    }`;
  const href = (b?: AgeBand) => {
    const p = new URLSearchParams();
    if (b) p.set("band", b);
    if (sp.q) p.set("q", sp.q);
    const s = p.toString();
    return `/admin/modules/${id}${s ? `?${s}` : ""}`;
  };

  return (
    <AppShell title={meta.name} subtitle={SOURCE_LABEL[info.kind]}>
      <Link href="/admin/modules" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← All modules
      </Link>
      <p className="mt-3 max-w-3xl text-ink">{info.how}</p>

      <AdminSample moduleId={id} naturalSize={moduleSize(id)} sizes={moduleSizes(id)} minLevel={minDifficultyFor(id)} />

      {recent.length ? (
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Recent daily output</h2>
          <div className="space-y-2">
            {recent.map((day, i) => (
              <details key={day.label} open={i === 0} className="rounded-xl border border-rule bg-paper px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-ink">
                  {day.label}{" "}
                  <span className="font-normal text-ink-soft">
                    {day.table ? `· ${day.table.rows.length} items` : "· nothing cached"}
                  </span>
                </summary>
                {day.table?.rows.length ? (
                  <div className="mt-2">
                    <DataTable table={day.table} />
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {bank ? (
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
            {info.kind === "live+bank" ? "Backup bank" : info.kind === "dataset" ? "Dataset" : "Bank"}
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {bank.rows.some((r) => r.bands?.length) ? (
              <>
                <Link href={href()} className={chip(!band)}>All ages</Link>
                {AGE_BANDS.map((b) => (
                  <Link key={b} href={href(b)} className={chip(band === b)}>{b}</Link>
                ))}
              </>
            ) : null}
            <form action={`/admin/modules/${id}`} className="ml-auto flex gap-2">
              {band ? <input type="hidden" name="band" value={band} /> : null}
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Search…"
                className="rounded-full border border-rule bg-paper px-3 py-1 text-sm"
              />
            </form>
          </div>
          <DataTable table={bank} band={band} q={sp.q} />
        </section>
      ) : null}
    </AppShell>
  );
}
