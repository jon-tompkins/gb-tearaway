import { buildExamples } from "@/lib/setupExamples";
import { WIZARD_PREVIEW_IDS } from "./BuildWizard";
import BuildWizard from "./BuildWizard";

export const dynamic = "force-dynamic";

export default function BuildPage() {
  return <BuildWizard examples={buildExamples(WIZARD_PREVIEW_IDS)} />;
}
