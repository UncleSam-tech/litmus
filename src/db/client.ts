import pkg from "pg";
const { Pool } = pkg;
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle pg client", err);
  process.exit(-1);
});

export async function checkDbHealth(): Promise<boolean> {
  try {
    const res = await pool.query("SELECT 1");
    return res.rowCount === 1;
  } catch (err) {
    logger.error("Database health check failed", err);
    return false;
  }
}
