// ──────────────────────────────────────────────
// REX - Workflow Template Routes
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  instantiateWorkflowTemplateSchema,
} from "../validation/schemas.js";
import type { createTemplateService } from "../services/template.service.js";

type TemplateService = ReturnType<typeof createTemplateService>;

export function registerTemplateRoutes(
  app: FastifyInstance,
  templateService: TemplateService
): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    scoped.get("/api/workflow-templates", async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        data: templateService.list(),
      });
    });

    scoped.get("/api/workflow-templates/:templateId", async (request: FastifyRequest, reply: FastifyReply) => {
      const { templateId } = request.params as { templateId: string };
      const template = templateService.getById(templateId);
      if (!template) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow template not found" },
        });
      }

      return reply.send({
        success: true,
        data: template,
      });
    });

    scoped.post("/api/workflow-templates/:templateId/instantiate", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = instantiateWorkflowTemplateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const { templateId } = request.params as { templateId: string };

      try {
        const workflow = await templateService.instantiate(
          userId,
          templateId,
          parsed.data
        );
        return reply.status(201).send({
          success: true,
          data: workflow,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to instantiate template";
        if (message.includes("Unknown workflow template")) {
          return reply.status(404).send({
            success: false,
            error: { code: "NOT_FOUND", message: "Workflow template not found" },
          });
        }
        if (message.includes("Invalid template params")) {
          return reply.status(400).send({
            success: false,
            error: { code: "VALIDATION_ERROR", message },
          });
        }
        return reply.status(500).send({
          success: false,
          error: { code: "INTERNAL_ERROR", message },
        });
      }
    });

    scoped.post("/api/workflow-templates/:templateId/preview", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = instantiateWorkflowTemplateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        });
      }

      const { templateId } = request.params as { templateId: string };
      try {
        const preview = templateService.preview(templateId, parsed.data);
        return reply.send({
          success: true,
          data: preview,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to preview template";
        if (message.includes("Unknown workflow template")) {
          return reply.status(404).send({
            success: false,
            error: { code: "NOT_FOUND", message: "Workflow template not found" },
          });
        }
        if (message.includes("Invalid template params")) {
          return reply.status(400).send({
            success: false,
            error: { code: "VALIDATION_ERROR", message },
          });
        }
        return reply.status(500).send({
          success: false,
          error: { code: "INTERNAL_ERROR", message },
        });
      }
    });
  });
}
