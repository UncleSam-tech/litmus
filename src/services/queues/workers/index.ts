import { Worker } from "bullmq";
import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";

const connection = {
  url: env.REDIS_URL,
};

export const ingestWorker = new Worker("litmus-ingest", async (job) => {
  logger.info(`Processing job ${job.id} of type ${job.name}`);
  // In a real app we would route to specific job handlers here based on job.name
}, { connection });

ingestWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} has completed!`);
});

ingestWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
