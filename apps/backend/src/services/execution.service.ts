// ──────────────────────────────────────────────
// REX - Execution Service
// ──────────────────────────────────────────────

import { and, eq, desc, count, inArray } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  executions,
  executionSteps,
  executionStepAttempts,
  executionRetrievalEvents,
  executionContextSnapshots,
  workflows,
} from "@rex/database";
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
  getById(userId: string, executionId: string): Promise<ExecutionRecord | null>;
  listByWorkflow(
    userId: string,
    workflowId: string,
    page: number,
    limit: number
  ): Promise<{ data: ExecutionRecord[]; total: number }>;
  listActiveByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ data: ActiveWorkflowExecutionRecord[]; total: number }>;
  getSteps(executionId: string): Promise<StepRecord[]>;
  listStepAttempts(
    userId: string,
    executionId: string,
    options: StepAttemptListOptions
  ): Promise<{ data: StepAttemptRecord[]; total: number }>;
  getRetrievalEvents(executionId: string): Promise<RetrievalEventRecord[]>;
  listRetrievalEvents(
    userId: string,
    executionId: string,
    options: RetrievalEventListOptions
  ): Promise<{ data: RetrievalEventRecord[]; total: number }>;
  listContextSnapshots(
    userId: string,
    executionId: string,
    options: ContextSnapshotListOptions
  ): Promise<{ data: ExecutionContextSnapshotRecord[]; total: number }>;
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

export interface ActiveWorkflowExecutionRecord {
  workflowId: string;
  workflowName: string;
  workflowStatus: string;
  executionId: string;
  executionStatus: string;
  startedAt: Date | null;
  createdAt: Date;
}

export interface StepAttemptRecord {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  attempt: number;
  status: "completed" | "retry" | "failed";
  durationMs: number;
  reason: string | null;
  createdAt: Date;
}

export interface StepAttemptListOptions {
  nodeId?: string;
  status?: "completed" | "retry" | "failed";
  page: number;
  limit: number;
}

export interface RetrievalEventRecord {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  query: string;
  topK: number;
  attempt: number;
  maxAttempts: number;
  status: string;
  matchesCount: number;
  durationMs: number;
  errorMessage: string | null;
  scopeType: string | null;
  corpusId: string | null;
  workflowIdScope: string | null;
  executionIdScope: string | null;
  strategy: string | null;
  retrieverKey: string | null;
  branchIndex: number | null;
  selected: boolean | null;
  createdAt: Date;
}

export interface RetrievalEventListOptions {
  nodeId?: string;
  status?: "success" | "empty" | "failed";
  strategy?: "single" | "merge" | "first-non-empty" | "best-score" | "adaptive";
  retrieverKey?: string;
  selected?: boolean;
  page: number;
  limit: number;
}

export interface ExecutionContextSnapshotRecord {
  id: string;
  executionId: string;
  sequence: number;
  reason: "init" | "step" | "final" | "error";
  nodeId: string | null;
  nodeType: string | null;
  state: unknown;
  createdAt: Date;
}

export interface ContextSnapshotListOptions {
  reason?: "init" | "step" | "final" | "error";
  page: number;
  limit: number;
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

    async getById(userId, executionId) {
      const [execution] = await db
        .select()
        .from(executions)
        .innerJoin(workflows, eq(workflows.id, executions.workflowId))
        .where(and(eq(executions.id, executionId), eq(workflows.userId, userId)))
        .limit(1);

      return (execution?.executions as ExecutionRecord | undefined) ?? null;
    },

    async listByWorkflow(userId, workflowId, page, limit) {
      const offset = (page - 1) * limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(and(eq(executions.workflowId, workflowId), eq(workflows.userId, userId)))
          .orderBy(desc(executions.createdAt))
          .limit(limit)
          .offset(offset)
          .then((rows) => rows.map((row) => row.executions)),
        db
          .select({ total: count() })
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(and(eq(executions.workflowId, workflowId), eq(workflows.userId, userId))),
      ]);

      return {
        data: data as ExecutionRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async listActiveByUser(userId, page, limit) {
      const offset = (page - 1) * limit;
      const activeStatuses = ["pending", "running"];

      const [data, totalResult] = await Promise.all([
        db
          .select({
            workflowId: workflows.id,
            workflowName: workflows.name,
            workflowStatus: workflows.status,
            executionId: executions.id,
            executionStatus: executions.status,
            startedAt: executions.startedAt,
            createdAt: executions.createdAt,
          })
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(
            and(
              eq(workflows.userId, userId),
              inArray(executions.status, activeStatuses)
            )
          )
          .orderBy(desc(executions.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(
            and(
              eq(workflows.userId, userId),
              inArray(executions.status, activeStatuses)
            )
          ),
      ]);

      return {
        data: data as ActiveWorkflowExecutionRecord[],
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

    async listStepAttempts(userId, executionId, options) {
      const owned = await isExecutionOwnedByUser(db, userId, executionId);
      if (!owned) {
        throw new Error("Execution not found or access denied");
      }

      const conditions = [eq(executionStepAttempts.executionId, executionId)];
      if (options.nodeId) {
        conditions.push(eq(executionStepAttempts.nodeId, options.nodeId));
      }
      if (options.status) {
        conditions.push(eq(executionStepAttempts.status, options.status));
      }

      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      const offset = (options.page - 1) * options.limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(executionStepAttempts)
          .where(whereClause)
          .orderBy(desc(executionStepAttempts.createdAt))
          .limit(options.limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(executionStepAttempts)
          .where(whereClause),
      ]);

      return {
        data: data as StepAttemptRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async getRetrievalEvents(executionId) {
      const events = await db
        .select()
        .from(executionRetrievalEvents)
        .where(eq(executionRetrievalEvents.executionId, executionId))
        .orderBy(
          executionRetrievalEvents.createdAt,
          executionRetrievalEvents.nodeId,
          executionRetrievalEvents.attempt
        );

      return events as RetrievalEventRecord[];
    },

    async listRetrievalEvents(userId, executionId, options) {
      const owned = await isExecutionOwnedByUser(db, userId, executionId);
      if (!owned) {
        throw new Error("Execution not found or access denied");
      }

      const conditions = [eq(executionRetrievalEvents.executionId, executionId)];
      if (options.nodeId) {
        conditions.push(eq(executionRetrievalEvents.nodeId, options.nodeId));
      }
      if (options.status) {
        conditions.push(eq(executionRetrievalEvents.status, options.status));
      }
      if (options.strategy) {
        conditions.push(eq(executionRetrievalEvents.strategy, options.strategy));
      }
      if (options.retrieverKey) {
        conditions.push(eq(executionRetrievalEvents.retrieverKey, options.retrieverKey));
      }
      if (typeof options.selected === "boolean") {
        conditions.push(eq(executionRetrievalEvents.selected, options.selected));
      }

      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      const offset = (options.page - 1) * options.limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(executionRetrievalEvents)
          .where(whereClause)
          .orderBy(desc(executionRetrievalEvents.createdAt))
          .limit(options.limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(executionRetrievalEvents)
          .where(whereClause),
      ]);

      return {
        data: data as RetrievalEventRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async listContextSnapshots(userId, executionId, options) {
      const owned = await isExecutionOwnedByUser(db, userId, executionId);
      if (!owned) {
        throw new Error("Execution not found or access denied");
      }

      const conditions = [eq(executionContextSnapshots.executionId, executionId)];
      if (options.reason) {
        conditions.push(eq(executionContextSnapshots.reason, options.reason));
      }

      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      const offset = (options.page - 1) * options.limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(executionContextSnapshots)
          .where(whereClause)
          .orderBy(desc(executionContextSnapshots.sequence))
          .limit(options.limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(executionContextSnapshots)
          .where(whereClause),
      ]);

      return {
        data: data as ExecutionContextSnapshotRecord[],
        total: totalResult[0]?.total ?? 0,
      };
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

async function isExecutionOwnedByUser(
  db: Database,
  userId: string,
  executionId: string
): Promise<boolean> {
  const [owned] = await db
    .select({ id: executions.id })
    .from(executions)
    .innerJoin(workflows, eq(workflows.id, executions.workflowId))
    .where(and(eq(executions.id, executionId), eq(workflows.userId, userId)))
    .limit(1);

  return Boolean(owned);
}
