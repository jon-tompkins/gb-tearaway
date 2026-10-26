import { loadPayload, savePayload } from "./persist";

const KEY = "config:marketing-goals";

/** Metrics a goal can track; values are computed on the admin Marketing page. */
export const GOAL_METRICS = {
  visitors7: "Unique visitors · 7 days",
  accounts: "Accounts",
  dispatches: "Dispatches created",
  emailKids: "Dispatches on email delivery",
  active7: "Accounts emailed · 7 days",
  trials: "On free trial / code",
  paying: "Paying subscribers",
  codeUses: "Access codes redeemed",
} as const;
export type GoalMetric = keyof typeof GOAL_METRICS;

export interface Goal {
  id: string;
  metric: GoalMetric;
  target: number;
  /** YYYY-MM-DD, optional. */
  by?: string;
}

export const isGoalMetric = (m: unknown): m is GoalMetric => typeof m === "string" && m in GOAL_METRICS;

export async function getGoals(): Promise<Goal[]> {
  const raw = await loadPayload<{ goals?: Goal[] }>(KEY);
  return (raw?.goals ?? []).filter((g) => isGoalMetric(g.metric) && Number.isFinite(g.target));
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await savePayload(KEY, { goals });
}
