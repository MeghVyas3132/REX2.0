import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { IAMService } from "../services/iam.service.js";
import type { RexAutofixService } from "../services/rex-autofix.service.js";

const workflowParamsSchema = z.object({ workflowId: z.string().uuid() });
const previewParamsSchema = z.object({ workflowId: z.string().uuid(), nodeId: z.string().min(1) });
const applyFixSchema = z.object({
  nodeId: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
});

export function registerRexRoutes(
  app: FastifyInstance,
  rexAutofixService: RexAutofixService,
  iamService: IAMService
): void {
  app.register(async function scoped(scopedInstance: FastifyInstance) {
    scopedInstance.addHook("onRequest", app.authenticate);

    scopedInstance.get("/api/workflows/:workflowId/rex-scores", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = workflowParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid workflow id" } });
      }

      const userId = (request.user as { sub: string }).sub;
      const tenantId = request.ctx.tenantId;
      await iamService.assertWorkflowAction(userId, params.data.workflowId, "view");

      const query = request.query as { recompute?: string };
      const data = query.recompute === "true"
        ? await rexAutofixService.computeAndPersistScores(tenantId, params.data.workflowId)
        : await rexAutofixService.listScores(tenantId, params.data.workflowId);

      return reply.send({ success: true, data });
    });

    scopedInstance.get("/api/workflows/:workflowId/rex-fixes/preview/:nodeId", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = previewParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid parameters" } });
      }

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, params.data.workflowId, "view");

      const data = await rexAutofixService.previewFixes(
        request.ctx.tenantId,
        params.data.workflowId,
        params.data.nodeId
      );

      return reply.send({ success: true, data });
    });

    scopedInstance.post("/api/workflows/:workflowId/rex-fixes/apply", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = workflowParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid workflow id" } });
      }

      const parsed = applyFixSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
      }

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, params.data.workflowId, "edit");

      const data = await rexAutofixService.applyFixes({
        tenantId: request.ctx.tenantId,
        workflowId: params.data.workflowId,
        nodeId: parsed.data.nodeId,
        actions: parsed.data.actions,
        actorUserId: userId,
      });

      return reply.send({ success: true, data });
    });
  });
}
