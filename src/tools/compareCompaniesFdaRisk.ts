import { buildMeta } from "../utils/toolMeta.js";

export async function compareCompaniesFdaRisk(args: Record<string, unknown>, startTime: number) {
  return {
    comparisons: [],
    limitations: [],
    capabilityFlags: { entitiesResolved: false },
    _meta: buildMeta("compareCompaniesFdaRisk", startTime)
  };
}
