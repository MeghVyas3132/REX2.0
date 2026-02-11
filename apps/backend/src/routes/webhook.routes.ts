// ──────────────────────────────────────────────
// REX - Webhook Routes
// Rate-limited public endpoint for webhook triggers
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and } from "drizzle-orm";
import type { Database } from "@rex/database";
import { workflows } from "@rex/database";
import type { ExecutionService } from "../services/execution.service.js";
import { createLogger, loadConfig } from "@rex/utils";

const logger = createLogger("webhook-routes");

export function registerWebhookRoutes(
  app: FastifyInstance,
  db: Database,
  executionService: ExecutionService
): void {
  const config = loadConfig();

  app.post("/api/webhooks/:workflowId", {
    config: {
      rateLimit: {
        max: config.webhookRateLimit.max,
        timeWindow: config.webhookRateLimit.windowMs,
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { workflowId } = request.params as { workflowId: string };

    // Verify workflow exists and is active
    const [workflow] = await db
      .select({ id: workflows.id, userId: workflows.userId, status: workflows.status })
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.status, "active")))
      .limit(1);

    if (!workflow) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Workflow not found or inactive" },
      });
    }

    const payload = (request.body ?? {}) as Record<string, unknown>;

    logger.info({ workflowId, payloadKeys: Object.keys(payload) }, "Webhook received");

    const result = await executionService.trigger(workflow.userId, workflowId, payload);

    return reply.status(202).send({ success: true, data: result });
  });
}
