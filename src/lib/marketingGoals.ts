import { loadPayload, savePayload } from "./persist";
import { isGoalMetric, type Goal } from "./marketingGoalTypes";

const KEY = "config:marketing-goals";

export async function getGoals(): Promise<Goal[]> {
  const raw = await loadPayload<{ goals?: Goal[] }>(KEY);
  return (raw?.goals ?? []).filter((g) => isGoalMetric(g.metric) && Number.isFinite(g.target));
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await savePayload(KEY, { goals });
}
