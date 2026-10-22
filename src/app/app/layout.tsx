import { BillingGate } from "@/components/BillingGate";

export default function ParentAppLayout({ children }: { children: React.ReactNode }) {
  return <BillingGate>{children}</BillingGate>;
}
