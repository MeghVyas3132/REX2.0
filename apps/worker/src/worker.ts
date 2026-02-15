// ──────────────────────────────────────────────
// REX - Worker Process
// BullMQ consumer — no HTTP logic
// ──────────────────────────────────────────────

import { Worker } from "bullmq";
import type { ExecutionJobPayload, KnowledgeIngestionJobPayload } from "@rex/types";
import { getDatabase } from "@rex/database";
import { loadConfig, createLogger } from "@rex/utils";
import { handleExecutionJob } from "./handler.js";
import { handleKnowledgeIngestionJob } from "./knowledge-handler.js";

const logger = createLogger("worker");

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const db = getDatabase(config.postgres.url);

  logger.info({
    concurrency: config.worker.concurrency,
    queue: config.worker.queueName,
  }, "Starting REX Worker");

  const worker = new Worker<ExecutionJobPayload | KnowledgeIngestionJobPayload>(
    config.worker.queueName,
    async (job) => {
      if (job.name === "execute-workflow") {
        await handleExecutionJob(job as typeof job & { data: ExecutionJobPayload }, db);
        return;
      }

      if (job.name === "ingest-knowledge-document") {
        await handleKnowledgeIngestionJob(job as typeof job & { data: KnowledgeIngestionJobPayload }, db);
        return;
      }

      throw new Error(`Unknown job name: ${job.name}`);
    },
    {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
      },
      concurrency: config.worker.concurrency,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    }
  );

  worker.on("completed", (job) => {
    logger.info({
      jobId: job.id,
      jobName: job.name,
      executionId: "executionId" in job.data ? job.data.executionId : undefined,
      documentId: "documentId" in job.data ? job.data.documentId : undefined,
    }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({
      jobId: job?.id,
      jobName: job?.name,
      executionId: job && "executionId" in job.data ? job.data.executionId : undefined,
      documentId: job && "documentId" in job.data ? job.data.documentId : undefined,
      error: err.message,
      attempt: job?.attemptsMade,
    }, "Job failed");
  });

  worker.on("error", (err) => {
    logger.error({ error: err.message }, "Worker error");
  });

  logger.info({
    concurrency: config.worker.concurrency,
  }, "REX Worker started successfully");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    await worker.close();
    logger.info("Worker shut down gracefully");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error({ error: err }, "Worker bootstrap failed");
  process.exit(1);
});
