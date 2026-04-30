import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createContextMiddleware } from "@ctxprotocol/sdk";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";

import { createMcpServer } from "./mcp.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { checkDbHealth } from "../db/client.js";
import { checkRedisHealth } from "../services/cache/redis.js";

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/mcp' || req.path === '/messages') return next();
  express.json({ limit: '1mb' })(req, res, next);
});

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded', message: 'Too many requests' },
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latencyMs: Date.now() - start,
    });
  });
  next();
});

// Health endpoints
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "litmus-mcp", version: "1.0.0" });
});

app.get("/health/ready", async (_req: Request, res: Response) => {
  const [pg, redis] = await Promise.all([checkDbHealth(), checkRedisHealth()]);
  const ready = pg && redis;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "degraded",
    checks: { postgres: pg ? "ok" : "fail", redis: redis ? "ok" : "fail" },
  });
});

const verifyContextAuth = createContextMiddleware();

// ─── SSE transport (primary) ───────
const sseTransports = new Map<string, SSEServerTransport>();

app.use('/sse', verifyContextAuth);

app.get('/sse', mcpLimiter, async (_req: Request, res: Response) => {
  try {
    const transport = new SSEServerTransport('/messages', res);
    const server = createMcpServer();
    sseTransports.set(transport.sessionId, transport);
    res.on('close', () => {
      sseTransports.delete(transport.sessionId);
    });
    await server.connect(transport);
  } catch (err) {
    logger.error('SSE handler error', { err });
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error' });
    }
  }
});

app.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query['sessionId'] as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: 'missing_session_id' });
    return;
  }
  const transport = sseTransports.get(sessionId);
  if (!transport) {
    res.status(400).json({ error: 'no_active_session', sessionId });
    return;
  }
  try {
    await transport.handlePostMessage(req, res);
  } catch (err) {
    logger.error('SSE message handler error', { err, sessionId });
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error' });
    }
  }
});

// ─── Streamable HTTP transport (fallback) ───────
const httpTransports: Record<string, StreamableHTTPServerTransport> = {};

app.use('/mcp', verifyContextAuth);

app.post('/mcp', mcpLimiter, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && httpTransports[sessionId]) {
      transport = httpTransports[sessionId];
    } else {
      const server = createMcpServer();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          httpTransports[id] = transport;
        },
      });
      await server.connect(transport);
    }
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error('MCP handler error', { err });
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error' });
    }
  }
});

app.get('/mcp', mcpLimiter, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = httpTransports[sessionId];
  if (transport) {
    await transport.handleRequest(req, res);
  } else {
    res.status(400).json({ error: "Invalid session" });
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { err });
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
});

setInterval(() => {
  fetch(`http://localhost:${env.PORT}/health`).catch(() => {});
}, 600_000);

app.listen(env.PORT, () => {
  logger.info(`Litmus MCP running on :${env.PORT}`);
});
