import { AppShell } from "@/components/AppNav";
import { AdminTabs } from "@/components/AdminTabs";
import { AdminFree } from "@/components/AdminFree";
import { requireAdmin } from "@/lib/admin";
import { editionStats } from "@/lib/free/adminOps";
import { heavyForEasier, rotationCatalog } from "@/lib/free/editions";
import { freeEditionsEnabled } from "@/lib/free/flag";
import { loadFreeAdmin } from "@/lib/free/runtime";
import { ADMIN_TIMEZONES, effectiveMailingAddress } from "@/lib/free/settings";
import { moduleById } from "@/lib/modules";

export const dynamic = "force-dynamic";
export const metadata = { title: "Free editions · Admin · Back of the Box" };

export default async function AdminFreePage() {
  const actor = await requireAdmin();
  const settings = await loadFreeAdmin();
  const stats = await editionStats(settings.editions);
  const modules = rotationCatalog().map((id) => ({ id, name: moduleById(id).name, heavy: heavyForEasier(id) }));
  return (
    <AppShell title="Admin">
      <AdminTabs active="free" />
      <p className="-mt-2 mb-4 text-sm text-ink-soft">
        The env var is a hard stop. The toggle below only matters when that env var is on. Defaults match the edition list in code until you save.
      </p>
      <AdminFree
        initial={settings}
        envOn={freeEditionsEnabled()}
        address={effectiveMailingAddress(settings)}
        stats={stats}
        modules={modules}
        actor={actor}
        timezones={ADMIN_TIMEZONES}
      />
    </AppShell>
  );
}
