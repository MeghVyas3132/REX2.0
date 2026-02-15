// ──────────────────────────────────────────────
// REX - BullMQ Queue Client
// ──────────────────────────────────────────────

import { Queue } from "bullmq";
import type { ExecutionJobPayload, KnowledgeIngestionJobPayload } from "@rex/types";
import { loadConfig, createLogger } from "@rex/utils";

const logger = createLogger("queue");
let queueInstance: Queue | null = null;

export function getQueue(): Queue {
  if (queueInstance) return queueInstance;

  const config = loadConfig();
  queueInstance = new Queue(config.worker.queueName, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  });

  logger.info({ queueName: config.worker.queueName }, "BullMQ queue initialized");
  return queueInstance;
}

export async function enqueueExecution(payload: ExecutionJobPayload): Promise<string> {
  const queue = getQueue();

  const job = await queue.add("execute-workflow", payload, {
    jobId: payload.executionId,
  });

  logger.info({
    jobId: job.id,
    executionId: payload.executionId,
    workflowId: payload.workflowId,
  }, "Execution job enqueued");

  return job.id ?? payload.executionId;
}

export async function enqueueKnowledgeIngestion(
  payload: KnowledgeIngestionJobPayload
): Promise<string> {
  const queue = getQueue();

  // BullMQ custom job ids cannot contain ":" in this runtime version.
  const jobId = `ingest-${payload.documentId}`;
  const job = await queue.add("ingest-knowledge-document", payload, {
    jobId,
  });

  logger.info({
    jobId: job.id,
    corpusId: payload.corpusId,
    documentId: payload.documentId,
  }, "Knowledge ingestion job enqueued");

  return job.id ?? jobId;
}

export async function closeQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
