// ──────────────────────────────────────────────
// REX - BullMQ Queue Client
// ──────────────────────────────────────────────

import { Queue } from "bullmq";
import type { ExecutionJobPayload } from "@rex/types";
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

export async function closeQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
