/** Client-safe plan table (billing.ts pulls in server-only modules). */
export type PlanInterval = "year" | "quarter";

export interface Plan {
  id: "kids2" | "kids5";
  /** Most kids the plan covers. */
  kids: number;
  /** Price per year, and per quarter (3 months), in cents. */
  yearCents: number;
  quarterCents: number;
  label: string;
}

export const PLANS: Plan[] = [
  { id: "kids2", kids: 2, yearCents: 2000, quarterCents: 600, label: "Up to 2 kids" },
  { id: "kids5", kids: 5, yearCents: 4000, quarterCents: 1200, label: "Up to 5 kids" },
];

export const planById = (id: unknown): Plan | undefined => PLANS.find((p) => p.id === id);
export const centsFor = (p: Plan, interval: PlanInterval) => (interval === "year" ? p.yearCents : p.quarterCents);
