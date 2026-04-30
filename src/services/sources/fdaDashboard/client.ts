import { fetch } from "undici";
import { env } from "../../../config/env.js";
import { withRetry } from "../../../utils/retry.js";
import { deepCamelCase } from "../../../utils/camelCase.js";

interface DashboardParams {
  start?: number;
  rows?: number;
  sort?: string;
  sortorder?: "ASC" | "DESC";
  returntotalcount?: boolean;
  filters?: Record<string, any[]>;
  columns?: string[];
}

export async function fetchDashboard(endpoint: string, params: DashboardParams = {}): Promise<any> {
  const url = `${env.FDA_DASHBOARD_BASE_URL}/${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (env.FDA_DASHBOARD_AUTH_USER && env.FDA_DASHBOARD_AUTH_KEY) {
    headers["Authorization-User"] = env.FDA_DASHBOARD_AUTH_USER;
    headers["Authorization-Key"] = env.FDA_DASHBOARD_AUTH_KEY;
  } else {
    throw new Error("FDA Dashboard API credentials not configured.");
  }

  return withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`FDA Dashboard API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return deepCamelCase(data);
  }, { maxRetries: 3, initialDelayMs: 2000 }, "FDA Dashboard fetch");
}
