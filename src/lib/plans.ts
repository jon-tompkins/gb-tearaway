import { countNoun } from "./copy";
/** Client-safe plan table (billing.ts pulls in server-only modules). */
export type PlanInterval = "month" | "year";

export interface Plan {
  id: "kids5";
  /** Most kids the plan covers. */
  kids: number;
  /** Price per year, and per month, in cents. */
  yearCents: number;
  monthCents: number;
  label: string;
}

/** One simple plan: $5/month or $39/year, up to five kids. (id kept as "kids5" for Stripe metadata + env price ids.) */
export const PLANS: Plan[] = [
  { id: "kids5", kids: 5, yearCents: 3900, monthCents: 500, label: `Up to ${countNoun(5)}` },
];

export const planById = (id: unknown): Plan | undefined => PLANS.find((p) => p.id === id);
export const centsFor = (p: Plan, interval: PlanInterval) => (interval === "year" ? p.yearCents : p.monthCents);
