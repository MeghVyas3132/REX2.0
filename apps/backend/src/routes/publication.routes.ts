import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createPublicationSchema,
  executePublicationSchema,
  updatePublicationSchema,
} from "../validation/schemas.js";
import type { ExecutionService } from "../services/execution.service.js";
import type { IAMService } from "../services/iam.service.js";
import type { PublicationService } from "../services/publication.service.js";

export function registerPublicationRoutes(
  app: FastifyInstance,
  publicationService: PublicationService,
  executionService: ExecutionService,
  iamService: IAMService
): void {
  app.register(async function scoped(scopedInstance: FastifyInstance) {
    scopedInstance.addHook("onRequest", app.authenticate);

    async function getPublicationOr404(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<Awaited<ReturnType<typeof publicationService.getById>> | null> {
      const { id } = request.params as { id: string };
      const publication = await publicationService.getById(request.ctx.tenantId, id);
      if (!publication) {
        await reply
          .status(404)
          .send({ success: false, error: { code: "NOT_FOUND", message: "Publication not found" } });
        return null;
      }
      return publication;
    }

    scopedInstance.post("/api/publications", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createPublicationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
      }

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, parsed.data.workflowId, "edit");

      const data = await publicationService.create(request.ctx.tenantId, userId, parsed.data);
      return reply.status(201).send({ success: true, data });
    });

    scopedInstance.get("/api/publications", async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { catalog?: string };
      const data = await publicationService.list(request.ctx.tenantId, query.catalog !== "true");
      return reply.send({ success: true, data });
    });

    scopedInstance.get("/api/publications/catalog", async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await publicationService.list(request.ctx.tenantId, false);
      return reply.send({ success: true, data });
    });

    scopedInstance.get("/api/publications/:id", async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await getPublicationOr404(request, reply);
      if (!data) return;
      return reply.send({ success: true, data });
    });

    scopedInstance.patch("/api/publications/:id", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = updatePublicationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
      }

      const publication = await getPublicationOr404(request, reply);
      if (!publication) return;

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, publication.workflowId, "edit");

      const { id } = request.params as { id: string };
      const data = await publicationService.update(request.ctx.tenantId, id, parsed.data);
      return reply.send({ success: true, data });
    });

    scopedInstance.delete("/api/publications/:id", async (request: FastifyRequest, reply: FastifyReply) => {
      const publication = await getPublicationOr404(request, reply);
      if (!publication) return;

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, publication.workflowId, "delete");

      const { id } = request.params as { id: string };
      await publicationService.remove(request.ctx.tenantId, id);
      return reply.send({ success: true, data: { deleted: true } });
    });

    scopedInstance.post("/api/publications/:id/publish", async (request: FastifyRequest, reply: FastifyReply) => {
      const publication = await getPublicationOr404(request, reply);
      if (!publication) return;

      const { id } = request.params as { id: string };
      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, publication.workflowId, "edit");
      const data = await publicationService.publish(request.ctx.tenantId, id, userId);
      return reply.send({ success: true, data });
    });

    scopedInstance.post("/api/publications/:id/unpublish", async (request: FastifyRequest, reply: FastifyReply) => {
      const publication = await getPublicationOr404(request, reply);
      if (!publication) return;

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, publication.workflowId, "edit");

      const { id } = request.params as { id: string };
      const data = await publicationService.unpublish(request.ctx.tenantId, id);
      return reply.send({ success: true, data });
    });

    scopedInstance.post("/api/publications/:id/execute", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = executePublicationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
      }

      const { id } = request.params as { id: string };
      const publication = await publicationService.getById(request.ctx.tenantId, id);
      if (!publication || !publication.isPublished) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Published workflow not found" } });
      }

      const userId = (request.user as { sub: string }).sub;
      await iamService.assertWorkflowAction(userId, publication.workflowId, "execute");
      const data = await executionService.trigger(userId, publication.workflowId, parsed.data.inputs);

      return reply.send({ success: true, data });
    });
  });
}
