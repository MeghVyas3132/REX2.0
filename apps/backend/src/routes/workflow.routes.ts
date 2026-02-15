// ──────────────────────────────────────────────
// REX - Workflow Routes
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  paginationSchema,
  triggerWorkflowSchema,
  listExecutionRetrievalEventsQuerySchema,
  listExecutionStepAttemptsQuerySchema,
  listExecutionContextSnapshotsQuerySchema,
} from "../validation/schemas.js";
import type { WorkflowService } from "../services/workflow.service.js";
import type { ExecutionService } from "../services/execution.service.js";

export function registerWorkflowRoutes(
  app: FastifyInstance,
  workflowService: WorkflowService,
  executionService: ExecutionService
): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    // Auth hook is scoped — only applies to routes inside this register block
    scoped.addHook("onRequest", app.authenticate);

    // Create workflow
    scoped.post("/api/workflows", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createWorkflowSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const workflow = await workflowService.create(
        userId,
        parsed.data.name,
        parsed.data.description,
        parsed.data.nodes,
        parsed.data.edges
      );

      return reply.status(201).send({ success: true, data: workflow });
    });

    // List workflows
    scoped.get("/api/workflows", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const pagination = paginationSchema.parse(request.query);

      const result = await workflowService.list(userId, pagination.page, pagination.limit);

      return reply.send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      });
    });

    // Get single workflow
    scoped.get("/api/workflows/:workflowId", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const { workflowId } = request.params as { workflowId: string };

      const workflow = await workflowService.getById(userId, workflowId);
      if (!workflow) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow not found" },
        });
      }

      return reply.send({ success: true, data: workflow });
    });

    // Update workflow
    scoped.patch("/api/workflows/:workflowId", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = updateWorkflowSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const { workflowId } = request.params as { workflowId: string };

      try {
        const workflow = await workflowService.update(userId, workflowId, parsed.data);
        return reply.send({ success: true, data: workflow });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow not found" },
        });
      }
    });

    // Delete workflow
    scoped.delete("/api/workflows/:workflowId", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const { workflowId } = request.params as { workflowId: string };

      try {
        await workflowService.delete(userId, workflowId);
        return reply.send({ success: true, data: { deleted: true } });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow not found" },
        });
      }
    });

    // Trigger workflow execution
    scoped.post("/api/workflows/:workflowId/execute", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = triggerWorkflowSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const { workflowId } = request.params as { workflowId: string };

      // Verify workflow exists and belongs to user
      const workflow = await workflowService.getById(userId, workflowId);
      if (!workflow) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow not found" },
        });
      }

      const result = await executionService.trigger(userId, workflowId, parsed.data.payload);

      return reply.status(202).send({ success: true, data: result });
    });

    // List executions for a workflow
    scoped.get("/api/workflows/:workflowId/executions", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const { workflowId } = request.params as { workflowId: string };
      const pagination = paginationSchema.parse(request.query);

      const result = await executionService.listByWorkflow(
        userId,
        workflowId,
        pagination.page,
        pagination.limit
      );

      return reply.send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      });
    });

    // Get execution details
    scoped.get("/api/executions/:executionId", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const { executionId } = request.params as { executionId: string };

      const execution = await executionService.getById(userId, executionId);
      if (!execution) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Execution not found" },
        });
      }

      const steps = await executionService.getSteps(executionId);
      const retrievalPreview = await executionService.listRetrievalEvents(userId, executionId, {
        page: 1,
        limit: 50,
      });
      const stepAttemptsPreview = await executionService.listStepAttempts(userId, executionId, {
        page: 1,
        limit: 50,
      });
      const contextSnapshotPreview = await executionService.listContextSnapshots(userId, executionId, {
        page: 1,
        limit: 20,
      });

      return reply.send({
        success: true,
        data: {
          ...execution,
          steps,
          stepAttempts: stepAttemptsPreview.data,
          retrievalEvents: retrievalPreview.data,
          contextSnapshots: contextSnapshotPreview.data,
          stepAttemptsMeta: {
            total: stepAttemptsPreview.total,
            page: 1,
            limit: 50,
            totalPages: Math.max(1, Math.ceil(stepAttemptsPreview.total / 50)),
            truncated: stepAttemptsPreview.total > 50,
          },
          retrievalEventsMeta: {
            total: retrievalPreview.total,
            page: 1,
            limit: 50,
            totalPages: Math.max(1, Math.ceil(retrievalPreview.total / 50)),
            truncated: retrievalPreview.total > 50,
          },
          contextSnapshotsMeta: {
            total: contextSnapshotPreview.total,
            page: 1,
            limit: 20,
            totalPages: Math.max(1, Math.ceil(contextSnapshotPreview.total / 20)),
            truncated: contextSnapshotPreview.total > 20,
          },
        },
      });
    });

    scoped.get("/api/executions/:executionId/step-attempts", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listExecutionStepAttemptsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query params",
            details: parsed.error.flatten(),
          },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const { executionId } = request.params as { executionId: string };

      try {
        const result = await executionService.listStepAttempts(userId, executionId, {
          nodeId: parsed.data.nodeId,
          status: parsed.data.status,
          page: parsed.data.page,
          limit: parsed.data.limit,
        });

        return reply.send({
          success: true,
          data: result.data,
          meta: {
            total: result.total,
            page: parsed.data.page,
            limit: parsed.data.limit,
            totalPages: Math.max(1, Math.ceil(result.total / parsed.data.limit)),
          },
        });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Execution not found" },
        });
      }
    });

    scoped.get("/api/executions/:executionId/retrieval-events", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listExecutionRetrievalEventsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query params",
            details: parsed.error.flatten(),
          },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const { executionId } = request.params as { executionId: string };

      try {
        const result = await executionService.listRetrievalEvents(userId, executionId, {
          nodeId: parsed.data.nodeId,
          status: parsed.data.status,
          strategy: parsed.data.strategy,
          retrieverKey: parsed.data.retrieverKey,
          selected: parsed.data.selected,
          page: parsed.data.page,
          limit: parsed.data.limit,
        });

        return reply.send({
          success: true,
          data: result.data,
          meta: {
            total: result.total,
            page: parsed.data.page,
            limit: parsed.data.limit,
            totalPages: Math.max(1, Math.ceil(result.total / parsed.data.limit)),
          },
        });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Execution not found" },
        });
      }
    });

    scoped.get("/api/executions/:executionId/context-snapshots", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listExecutionContextSnapshotsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query params",
            details: parsed.error.flatten(),
          },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const { executionId } = request.params as { executionId: string };

      try {
        const result = await executionService.listContextSnapshots(userId, executionId, {
          reason: parsed.data.reason,
          page: parsed.data.page,
          limit: parsed.data.limit,
        });

        return reply.send({
          success: true,
          data: result.data,
          meta: {
            total: result.total,
            page: parsed.data.page,
            limit: parsed.data.limit,
            totalPages: Math.max(1, Math.ceil(result.total / parsed.data.limit)),
          },
        });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Execution not found" },
        });
      }
    });
  });
}
