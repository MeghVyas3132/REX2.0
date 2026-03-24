// ──────────────────────────────────────────────
// REX - Workflow Template Routes
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { tenantPlans } from "@rex/database";
import {
  instantiateWorkflowTemplateSchema,
} from "../validation/schemas.js";
import type { createTemplateService } from "../services/template.service.js";
import { canEditWorkflows } from "../services/rbac.service.js";

type TemplateService = ReturnType<typeof createTemplateService>;

export function registerTemplateRoutes(
  app: FastifyInstance,
  templateService: TemplateService,
  db: Database
): void {
  async function getAllowedTemplateIds(tenantId: string): Promise<string[] | null> {
    const [plan] = await db
      .select({ customLimits: tenantPlans.customLimits })
      .from(tenantPlans)
      .where(eq(tenantPlans.tenantId, tenantId))
      .limit(1);

    const limits = (plan?.customLimits as Record<string, unknown> | undefined) ?? {};
    const raw = limits["allowedTemplateIds"];
    if (!Array.isArray(raw)) return null;
    const ids = raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    return ids.length > 0 ? ids : null;
  }

  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    scoped.get("/api/workflow-templates", async (request: FastifyRequest, reply: FastifyReply) => {
      const allowedTemplateIds = await getAllowedTemplateIds(request.ctx.tenantId);
      const allTemplates = templateService.list();
      const data = allowedTemplateIds
        ? allTemplates.filter((template) => allowedTemplateIds.includes(template.id))
        : allTemplates;

      return reply.send({
        success: true,
        data,
      });
    });

    scoped.get("/api/workflow-templates/:templateId", async (request: FastifyRequest, reply: FastifyReply) => {
      const { templateId } = request.params as { templateId: string };
      const allowedTemplateIds = await getAllowedTemplateIds(request.ctx.tenantId);
      if (allowedTemplateIds && !allowedTemplateIds.includes(templateId)) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow template not found" },
        });
      }

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
      const tenantId = (request.user as { tenantId?: string }).tenantId ?? "00000000-0000-0000-0000-000000000001";
      if (!canEditWorkflows(request.ctx)) {
        return reply.status(403).send({
          success: false,
          error: { code: "FORBIDDEN", message: "Manager or company admin role required" },
        });
      }

      const { templateId } = request.params as { templateId: string };
      const allowedTemplateIds = await getAllowedTemplateIds(request.ctx.tenantId);
      if (allowedTemplateIds && !allowedTemplateIds.includes(templateId)) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow template not found" },
        });
      }

      try {
        const workflow = await templateService.instantiate(
          tenantId,
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
      const allowedTemplateIds = await getAllowedTemplateIds(request.ctx.tenantId);
      if (allowedTemplateIds && !allowedTemplateIds.includes(templateId)) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow template not found" },
        });
      }

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
