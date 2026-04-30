import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.string().default("8080"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  OPENFDA_API_KEY: z.string().optional(),
  OPENFDA_BASE_URL: z.string().default("https://api.fda.gov"),
  FDA_DASHBOARD_BASE_URL: z.string().default("https://api-datadashboard.fda.gov/v1"),
  FDA_DASHBOARD_AUTH_USER: z.string().optional(),
  FDA_DASHBOARD_AUTH_KEY: z.string().optional(),
  SEC_EDGAR_USER_AGENT: z.string(),
});

export const env = envSchema.parse(process.env);
