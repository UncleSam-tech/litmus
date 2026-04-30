import { fetch } from "undici";
import { env } from "../../../config/env.js";
import { withRetry } from "../../../utils/retry.js";
import { deepCamelCase } from "../../../utils/camelCase.js";

export async function fetchCompanyTickers(): Promise<any> {
  const url = "https://www.sec.gov/files/company_tickers.json";
  
  return withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": env.SEC_EDGAR_USER_AGENT
      }
    });

    if (!res.ok) {
      throw new Error(`SEC EDGAR API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return deepCamelCase(data);
  }, { maxRetries: 3, initialDelayMs: 2000 }, "SEC EDGAR company_tickers");
}
