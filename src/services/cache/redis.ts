import Redis from "ioredis";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export const redis = new Redis.default(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
  logger.error("Redis client error", err);
});

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === "PONG";
  } catch (err) {
    logger.error("Redis health check failed", err);
    return false;
  }
}
