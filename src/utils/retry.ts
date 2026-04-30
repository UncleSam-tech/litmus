import { logger } from "./logger.js";

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  context: string = "operation"
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        logger.error(`Max retries reached for ${context}`, { attempt, maxRetries, err: err.message });
        throw err;
      }
      logger.warn(`Attempt ${attempt} failed for ${context}. Retrying in ${delay}ms...`, { err: err.message });
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelayMs);
    }
  }
}
