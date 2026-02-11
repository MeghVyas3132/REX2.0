// ──────────────────────────────────────────────
// REX - Workflow Execution Job Handler
// Pure job processing — no HTTP logic
// ──────────────────────────────────────────────

import type { Job } from "bullmq";
import type { ExecutionJobPayload, WorkflowNode, WorkflowEdge, LLMProviderType, ExecutionStepResult } from "@rex/types";
import type { Database } from "@rex/database";
import { workflows, executions, executionSteps } from "@rex/database";
import { executeWorkflow, registerAllNodes } from "@rex/engine";
import { createLogger, decrypt, loadConfig } from "@rex/utils";
import { eq, and } from "drizzle-orm";
import { apiKeys } from "@rex/database";

const logger = createLogger("job-handler");

// Register all nodes once at module load
registerAllNodes();

export async function handleExecutionJob(
  job: Job<ExecutionJobPayload>,
  db: Database
): Promise<void> {
  const { executionId, workflowId, triggerPayload, userId } = job.data;
  const config = loadConfig();

  logger.info({
    jobId: job.id,
    executionId,
    workflowId,
    attempt: job.attemptsMade + 1,
  }, "Processing execution job");

  // Update status to running
  await db
    .update(executions)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(executions.id, executionId));

  try {
    // Load workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const nodes = workflow.nodes as WorkflowNode[];
    const edges = workflow.edges as WorkflowEdge[];

    // API key resolver
    const getApiKey = async (provider: LLMProviderType): Promise<string> => {
      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
        .limit(1);

      if (!key) {
        throw new Error(
          `No ${provider} API key found for user. Please add your API key in settings.`
        );
      }

      return decrypt(key.encryptedKey, config.encryption.masterKey);
    };

    // Execute workflow via engine
    const result = await executeWorkflow({
      executionId,
      workflowId,
      userId,
      nodes,
      edges,
      triggerPayload,
      getApiKey,
      onStepStart: async (nodeId: string, nodeType: string) => {
        logger.debug({ executionId, nodeId, nodeType }, "Step starting");
      },
      onStepComplete: async (step: ExecutionStepResult) => {
        // Persist each step result to database
        await db.insert(executionSteps).values({
          executionId,
          nodeId: step.nodeId,
          nodeType: step.nodeType,
          status: step.status,
          input: step.input,
          output: step.output,
          durationMs: step.durationMs,
          error: step.error,
        });
      },
    });

    // Update execution final status
    await db
      .update(executions)
      .set({
        status: result.status,
        finishedAt: new Date(),
        errorMessage: result.errorMessage,
      })
      .where(eq(executions.id, executionId));

    logger.info({
      executionId,
      status: result.status,
      totalDurationMs: result.totalDurationMs,
      stepsCompleted: result.steps.filter((s: ExecutionStepResult) => s.status === "completed").length,
    }, "Execution completed");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    logger.error({
      executionId,
      workflowId,
      error: errorMessage,
      attempt: job.attemptsMade + 1,
    }, "Execution failed");

    // Update status to failed
    await db
      .update(executions)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage,
      })
      .where(eq(executions.id, executionId));

    throw err; // Re-throw for BullMQ retry logic
  }
}
