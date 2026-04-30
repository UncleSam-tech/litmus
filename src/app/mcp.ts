import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleToolCall } from "./toolRouter.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

// ─── Tool definitions with CTP _meta ──────────────────────────

export const TOOLS = [
  {
    name: "getCompanyFdaBrief",
    description: "Get a comprehensive FDA enforcement risk brief for a single company or ticker. Returns a structured risk score, recent inspections, warning letters, recalls, and FAERS signal data. Use this tool when users ask about FDA enforcement risk or 483s.",
    _meta: {
      surface: "answer",
      queryEligible: true,
      latencyClass: "fast",
      pricing: { executeUsd: "0.00" },
    },
    inputSchema: {
      type: "object",
      properties: {
        companyOrTicker: {
          type: "string",
          description: "The company name or stock ticker (e.g., 'CTLT', 'Catalent', 'Moderna')",
        },
      },
      required: ["companyOrTicker"],
    },
    outputSchema: {
      type: "object",
      properties: {
        headline: { type: "string" },
        riskScore: { type: ["number", "null"] },
        riskLevel: { type: ["string", "null"] },
        scoreDrivers: { type: "array", items: { type: "object" } },
        recentInspections: { type: "array", items: { type: "object" } },
        openWarningLetters: { type: "array", items: { type: "object" } },
        recentRecalls: { type: "array", items: { type: "object" } },
        faersSummary: { type: "object" },
        importAlerts: { type: "array", items: { type: "object" } },
        companyProfile: { type: "object" },
        recommendation: { type: "string" },
        provenance: {
          type: "object",
          properties: {
            sources: { type: "array", items: { type: "string" } },
            generatedAt: { type: "string" },
            sourceUpdatedAt: { type: "string" },
            snapshotAgeSeconds: { type: "number" },
            coverageNotes: { type: "string" }
          },
          required: ["sources", "generatedAt", "sourceUpdatedAt", "snapshotAgeSeconds"]
        },
        freshness: {
          type: "object",
          properties: {
            cacheHit: { type: "boolean" },
            cacheHitStale: { type: "boolean" },
            dataAge: { type: "object" }
          },
          required: ["cacheHit", "cacheHitStale"]
        },
        limitations: { type: "array", items: { type: "string" } },
        capabilityFlags: { type: "object" },
        _meta: { type: "object" },
        error: { type: "string" },
      },
      required: [
        "headline",
        "scoreDrivers",
        "recentInspections",
        "openWarningLetters",
        "recentRecalls",
        "faersSummary",
        "importAlerts",
        "companyProfile",
        "recommendation",
        "provenance",
        "freshness",
        "limitations",
        "capabilityFlags",
        "_meta"
      ],
    },
  },
  {
    name: "searchEnforcementActions",
    description: "Search FDA enforcement actions matching criteria.",
    _meta: {
      surface: "answer",
      queryEligible: true,
      latencyClass: "fast",
      pricing: { executeUsd: "0.00" },
    },
    inputSchema: {
      type: "object",
      properties: {
        companyOrTicker: { type: "string" },
        actionType: { type: "string" },
      },
      required: ["companyOrTicker"],
    },
    outputSchema: {
      type: "object",
      properties: {
        results: { type: "array", items: { type: "object" } },
        limitations: { type: "array", items: { type: "string" } },
        capabilityFlags: { type: "object" },
        _meta: { type: "object" },
        error: { type: "string" },
      },
      required: ["results", "limitations", "capabilityFlags", "_meta"],
    },
  },
  {
    name: "getFacilityInspectionHistory",
    description: "Get single-facility timeline by FEI number.",
    _meta: {
      surface: "answer",
      queryEligible: true,
      latencyClass: "fast",
      pricing: { executeUsd: "0.00" },
    },
    inputSchema: {
      type: "object",
      properties: {
        feiNumber: { type: "string" },
      },
      required: ["feiNumber"],
    },
    outputSchema: {
      type: "object",
      properties: {
        facility: { type: "object" },
        inspections: { type: "array", items: { type: "object" } },
        limitations: { type: "array", items: { type: "string" } },
        capabilityFlags: { type: "object" },
        _meta: { type: "object" },
        error: { type: "string" },
      },
      required: ["facility", "inspections", "limitations", "capabilityFlags", "_meta"],
    },
  },
  {
    name: "compareCompaniesFdaRisk",
    description: "Side-by-side risk comparison for 2-5 tickers.",
    _meta: {
      surface: "answer",
      queryEligible: true,
      latencyClass: "fast",
      pricing: { executeUsd: "0.00" },
    },
    inputSchema: {
      type: "object",
      properties: {
        companiesOrTickers: { type: "array", items: { type: "string" } },
      },
      required: ["companiesOrTickers"],
    },
    outputSchema: {
      type: "object",
      properties: {
        comparisons: { type: "array", items: { type: "object" } },
        limitations: { type: "array", items: { type: "string" } },
        capabilityFlags: { type: "object" },
        _meta: { type: "object" },
        error: { type: "string" },
      },
      required: ["comparisons", "limitations", "capabilityFlags", "_meta"],
    },
  },
  {
    name: "getAdverseEventSignal",
    description: "FAERS signal detection for one drug.",
    _meta: {
      surface: "answer",
      queryEligible: true,
      latencyClass: "fast",
      pricing: { executeUsd: "0.00" },
    },
    inputSchema: {
      type: "object",
      properties: {
        drugName: { type: "string" },
      },
      required: ["drugName"],
    },
    outputSchema: {
      type: "object",
      properties: {
        drugName: { type: "string" },
        summary: { type: "object" },
        signals: { type: "array", items: { type: "object" } },
        limitations: { type: "array", items: { type: "string" } },
        capabilityFlags: { type: "object" },
        _meta: { type: "object" },
        error: { type: "string" },
      },
      required: ["drugName", "summary", "signals", "limitations", "capabilityFlags", "_meta"],
    },
  },
];

// ─── Error structuredContent helpers ──────────────────────────

function errorResult(toolName: string, message: string): Record<string, unknown> {
  const now = new Date().toISOString();
  const base = {
    error: message,
    limitations: [`Tool error: ${message}`],
    _meta: { toolName, toolVersion: "1.0.0", requestId: "error", latencyMs: 0, cacheHit: false },
    capabilityFlags: {},
  };

  const provenance = {
    sources: [],
    generatedAt: now,
    sourceUpdatedAt: now,
    snapshotAgeSeconds: 0,
    coverageNotes: ""
  };

  const freshness = { cacheHit: false, cacheHitStale: false, dataAge: {} };

  switch (toolName) {
    case "getCompanyFdaBrief":
      return { ...base, headline: `Error: ${message}`, riskScore: null, riskLevel: null, scoreDrivers: [], recentInspections: [], openWarningLetters: [], recentRecalls: [], faersSummary: {}, importAlerts: [], companyProfile: {}, recommendation: "", provenance, freshness };
    case "searchEnforcementActions":
      return { ...base, results: [] };
    case "getFacilityInspectionHistory":
      return { ...base, facility: {}, inspections: [] };
    case "compareCompaniesFdaRisk":
      return { ...base, comparisons: [] };
    case "getAdverseEventSignal":
      return { ...base, drugName: "", summary: {}, signals: [] };
    default:
      return base;
  }
}

import { buildMeta } from "../utils/toolMeta.js";

// ─── MCP Server factory ────────────────────────────────────────

export function createMcpServer(): Server {
  const server = new Server(
    { name: "litmus-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS as any }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();

    try {
      const result: any = await handleToolCall(name, (args ?? {}) as Record<string, unknown>, startTime);
      
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("tool_call_failed", { tool: name, err: message });
      const errContent = errorResult(name, message);
      return {
        content: [{ type: "text", text: JSON.stringify(errContent, null, 2) }],
        structuredContent: errContent,
        // isError: true intentionally omitted to prevent SDK stripping structuredContent
      };
    }
  });

  return server;
}
