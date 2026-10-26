import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getGoals, isGoalMetric, saveGoals, type Goal } from "@/lib/marketingGoals";

export const dynamic = "force-dynamic";

/** Admin: replace the goal list. Body: { goals: [{ id?, metric, target, by? }] }. */
export async function POST(req: Request) {
  const session = await auth().catch(() => null);
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { goals?: Partial<Goal>[] };
  const goals: Goal[] = (body.goals ?? [])
    .filter((g) => isGoalMetric(g.metric) && Number.isFinite(Number(g.target)) && Number(g.target) > 0)
    .slice(0, 30)
    .map((g, i) => ({
      id: g.id || `g${Date.now().toString(36)}${i}`,
      metric: g.metric!,
      target: Number(g.target),
      ...(g.by && /^\d{4}-\d{2}-\d{2}$/.test(g.by) ? { by: g.by } : {}),
    }));
  await saveGoals(goals);
  return NextResponse.json({ goals: await getGoals() });
}
