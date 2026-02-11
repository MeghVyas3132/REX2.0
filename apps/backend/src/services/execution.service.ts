// ──────────────────────────────────────────────
// REX - Execution Service
// ──────────────────────────────────────────────

import { eq, desc, count } from "drizzle-orm";
import type { Database } from "@rex/database";
import { executions, executionSteps } from "@rex/database";
import { createLogger } from "@rex/utils";
import type { ExecutionStepResult } from "@rex/types";
import { enqueueExecution } from "../queue/client.js";

const logger = createLogger("execution-service");

export interface ExecutionService {
  trigger(
    userId: string,
    workflowId: string,
    payload: Record<string, unknown>
  ): Promise<{ executionId: string }>;
  getById(executionId: string): Promise<ExecutionRecord | null>;
  listByWorkflow(
    workflowId: string,
    page: number,
    limit: number
  ): Promise<{ data: ExecutionRecord[]; total: number }>;
  getSteps(executionId: string): Promise<StepRecord[]>;
  updateStatus(
    executionId: string,
    status: string,
    errorMessage?: string | null
  ): Promise<void>;
  storeStepResult(executionId: string, step: ExecutionStepResult): Promise<void>;
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  status: string;
  triggerPayload: unknown;
  startedAt: Date | null;
  finishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface StepRecord {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  status: string;
  input: unknown;
  output: unknown;
  durationMs: number | null;
  error: string | null;
  createdAt: Date;
}

export function createExecutionService(db: Database): ExecutionService {
  return {
    async trigger(userId, workflowId, payload) {
      logger.info({ userId, workflowId }, "Triggering workflow execution");

      const [execution] = await db
        .insert(executions)
        .values({
          workflowId,
          status: "pending",
          triggerPayload: payload,
        })
        .returning();

      if (!execution) {
        throw new Error("Failed to create execution record");
      }

      // Enqueue to BullMQ — API never executes directly
      await enqueueExecution({
        executionId: execution.id,
        workflowId,
        triggerPayload: payload,
        userId,
      });

      logger.info({
        executionId: execution.id,
        workflowId,
      }, "Execution enqueued");

      return { executionId: execution.id };
    },

    async getById(executionId) {
      const [execution] = await db
        .select()
        .from(executions)
        .where(eq(executions.id, executionId))
        .limit(1);

      return (execution as ExecutionRecord) ?? null;
    },

    async listByWorkflow(workflowId, page, limit) {
      const offset = (page - 1) * limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(executions)
          .where(eq(executions.workflowId, workflowId))
          .orderBy(desc(executions.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(executions)
          .where(eq(executions.workflowId, workflowId)),
      ]);

      return {
        data: data as ExecutionRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async getSteps(executionId) {
      const steps = await db
        .select()
        .from(executionSteps)
        .where(eq(executionSteps.executionId, executionId));

      return steps as StepRecord[];
    },

    async updateStatus(executionId, status, errorMessage = null) {
      const updateData: Record<string, unknown> = { status };

      if (status === "running") {
        updateData["startedAt"] = new Date();
      }
      if (status === "completed" || status === "failed") {
        updateData["finishedAt"] = new Date();
      }
      if (errorMessage) {
        updateData["errorMessage"] = errorMessage;
      }

      await db
        .update(executions)
        .set(updateData)
        .where(eq(executions.id, executionId));
    },

    async storeStepResult(executionId, step) {
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
  };
}
