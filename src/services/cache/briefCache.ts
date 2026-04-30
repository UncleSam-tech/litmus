import { redis } from "./redis.js";
import { buildCompanyBrief } from "../briefs/companyBriefBuilder.js";
import { addIngestJob } from "../queues/ingestQueue.js";
import { buildMeta } from "../../utils/toolMeta.js";

const CACHE_TTL_TOP_TICKERS = 15 * 60; // 15 min
const CACHE_TTL_LONG_TAIL = 60 * 60; // 60 min

export async function getCachedCompanyBrief(companyOrTicker: string, startTime: number) {
  const normalizedKey = companyOrTicker.toUpperCase();
  const cacheKey = `company:${normalizedKey}:brief`;

  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    await addIngestJob("refreshBrief", { companyOrTicker });
    
    data.freshness.cacheHit = true;
    data.freshness.cacheHitStale = true;
    data._meta = buildMeta("getCompanyFdaBrief", startTime);
    return data;
  }

  const data = await buildCompanyBrief(companyOrTicker, startTime);
  
  const isTopTicker = false; 
  const ttl = isTopTicker ? CACHE_TTL_TOP_TICKERS : CACHE_TTL_LONG_TAIL;
  
  await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
  
  return data;
}
