import { Queue } from "bullmq";
import { env } from "../../config/env.js";

const connection = {
  url: env.REDIS_URL,
};

export const ingestQueue = new Queue("litmus-ingest", { connection });

export async function addIngestJob(name: string, data: any, opts?: any) {
  return ingestQueue.add(name, data, opts);
}
