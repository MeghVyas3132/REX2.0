// ──────────────────────────────────────────────
// REX - Workflow Routes
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  paginationSchema,
  triggerWorkflowSchema,
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
      const { workflowId } = request.params as { workflowId: string };
      const pagination = paginationSchema.parse(request.query);

      const result = await executionService.listByWorkflow(workflowId, pagination.page, pagination.limit);

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
      const { executionId } = request.params as { executionId: string };

      const execution = await executionService.getById(executionId);
      if (!execution) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Execution not found" },
        });
      }

      const steps = await executionService.getSteps(executionId);

      return reply.send({
        success: true,
        data: { ...execution, steps },
      });
    });
  });
}
