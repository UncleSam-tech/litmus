import { getCachedCompanyBrief } from "../services/cache/briefCache.js";

export async function getCompanyFdaBrief(args: Record<string, unknown>, startTime: number) {
  const companyOrTicker = args.companyOrTicker as string;
  if (!companyOrTicker) throw new Error("companyOrTicker is required");
  return getCachedCompanyBrief(companyOrTicker, startTime);
}
