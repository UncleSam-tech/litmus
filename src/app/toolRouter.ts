// Tool router handles dispatching MCP calls to the appropriate tool implementations.
import { getCompanyFdaBrief } from "../tools/getCompanyFdaBrief.js";
import { searchEnforcementActions } from "../tools/searchEnforcementActions.js";
import { getFacilityInspectionHistory } from "../tools/getFacilityInspectionHistory.js";
import { compareCompaniesFdaRisk } from "../tools/compareCompaniesFdaRisk.js";
import { getAdverseEventSignal } from "../tools/getAdverseEventSignal.js";

export async function handleToolCall(name: string, args: Record<string, unknown>, startTime: number) {
  switch (name) {
    case "getCompanyFdaBrief":
      return getCompanyFdaBrief(args, startTime);
    case "searchEnforcementActions":
      return searchEnforcementActions(args, startTime);
    case "getFacilityInspectionHistory":
      return getFacilityInspectionHistory(args, startTime);
    case "compareCompaniesFdaRisk":
      return compareCompaniesFdaRisk(args, startTime);
    case "getAdverseEventSignal":
      return getAdverseEventSignal(args, startTime);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
