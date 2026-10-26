/** Client-safe plan table (billing.ts pulls in server-only modules). */
export interface AnnualPlan {
  id: "kids1" | "kids2" | "kids5";
  /** Most kids the plan covers. */
  kids: number;
  cents: number;
  label: string;
}

export const ANNUAL_PLANS: AnnualPlan[] = [
  { id: "kids1", kids: 1, cents: 1500, label: "1 kid" },
  { id: "kids2", kids: 2, cents: 2000, label: "Up to 2 kids" },
  { id: "kids5", kids: 5, cents: 3000, label: "Up to 5 kids" },
];

export const planById = (id: unknown): AnnualPlan | undefined => ANNUAL_PLANS.find((p) => p.id === id);
