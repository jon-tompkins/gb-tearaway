import { buildExamples } from "@/lib/setupExamples";
import { ModulesBrowser } from "./ModulesBrowser";

export default function BrowseModulesPage() {
  return <ModulesBrowser examples={buildExamples()} />;
}
