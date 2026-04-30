import { buildMeta } from "../utils/toolMeta.js";

export async function getAdverseEventSignal(args: Record<string, unknown>, startTime: number) {
  return {
    drugName: args.drugName as string || "",
    summary: {},
    signals: [],
    limitations: [],
    capabilityFlags: { drugResolved: false },
    _meta: buildMeta("getAdverseEventSignal", startTime)
  };
}
