import { fetch } from "undici";
import { env } from "../../../config/env.js";
import { withRetry } from "../../../utils/retry.js";
import { deepCamelCase } from "../../../utils/camelCase.js";

interface OpenFdaParams {
  search?: string;
  limit?: number;
  skip?: number;
  count?: string;
  sort?: string;
}

export async function fetchOpenFda(endpoint: string, params: OpenFdaParams = {}): Promise<any> {
  const url = new URL(`${env.OPENFDA_BASE_URL}${endpoint}`);
  
  if (params.search) url.searchParams.set("search", params.search);
  if (params.limit !== undefined) url.searchParams.set("limit", params.limit.toString());
  if (params.skip !== undefined) url.searchParams.set("skip", params.skip.toString());
  if (params.count) url.searchParams.set("count", params.count);
  if (params.sort) url.searchParams.set("sort", params.sort);
  
  if (env.OPENFDA_API_KEY) {
    url.searchParams.set("api_key", env.OPENFDA_API_KEY);
  }

  return withRetry(async () => {
    const res = await fetch(url.toString());
    if (!res.ok) {
      if (res.status === 404) {
        // openFDA returns 404 for zero results
        return { meta: { results: { skip: 0, limit: params.limit || 1, total: 0 } }, results: [] };
      }
      throw new Error(`openFDA API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    // Normalize snake_case to camelCase
    return deepCamelCase(data);
  }, { maxRetries: 3, initialDelayMs: 2000 }, "openFDA fetch");
}
