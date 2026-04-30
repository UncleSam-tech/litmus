import { buildMeta } from "../utils/toolMeta.js";

export async function searchEnforcementActions(args: Record<string, unknown>, startTime: number) {
  return {
    results: [],
    limitations: [],
    capabilityFlags: { entityResolved: false },
    _meta: buildMeta("searchEnforcementActions", startTime)
  };
}
