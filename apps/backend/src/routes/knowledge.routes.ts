// ──────────────────────────────────────────────
// REX - Knowledge Routes
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createKnowledgeCorpusSchema,
  ingestKnowledgeDocumentSchema,
  listKnowledgeCorporaQuerySchema,
  listKnowledgeDocumentsQuerySchema,
  listKnowledgeChunksQuerySchema,
  queryKnowledgeSchema,
} from "../validation/schemas.js";
import type { KnowledgeService } from "../services/knowledge.service.js";

export function registerKnowledgeRoutes(
  app: FastifyInstance,
  knowledgeService: KnowledgeService
): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    scoped.post("/api/knowledge/corpora", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createKnowledgeCorpusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const result = await knowledgeService.createCorpus(userId, parsed.data);
      return reply.status(201).send({ success: true, data: result });
    });

    scoped.post("/api/knowledge/documents/ingest", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = ingestKnowledgeDocumentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const result = await knowledgeService.ingestDocument(userId, parsed.data);
      return reply.status(202).send({ success: true, data: result });
    });

    scoped.get("/api/knowledge/corpora", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listKnowledgeCorporaQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid query params", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const result = await knowledgeService.listCorpora(
        userId,
        {
          scopeType: parsed.data.scopeType,
          workflowId: parsed.data.workflowId,
          executionId: parsed.data.executionId,
        },
        parsed.data.page,
        parsed.data.limit
      );

      return reply.send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: parsed.data.page,
          limit: parsed.data.limit,
          totalPages: Math.ceil(result.total / parsed.data.limit),
        },
      });
    });

    scoped.get("/api/knowledge/corpora/:corpusId/documents", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listKnowledgeDocumentsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid query params", details: parsed.error.flatten() },
        });
      }

      const { corpusId } = request.params as { corpusId: string };
      const userId = (request.user as { sub: string }).sub;

      try {
        const result = await knowledgeService.listDocuments(
          userId,
          corpusId,
          parsed.data.page,
          parsed.data.limit
        );

        return reply.send({
          success: true,
          data: result.data,
          meta: {
            total: result.total,
            page: parsed.data.page,
            limit: parsed.data.limit,
            totalPages: Math.ceil(result.total / parsed.data.limit),
          },
        });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Knowledge corpus not found" },
        });
      }
    });

    scoped.get("/api/knowledge/documents/:documentId/chunks", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listKnowledgeChunksQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid query params", details: parsed.error.flatten() },
        });
      }

      const { documentId } = request.params as { documentId: string };
      const userId = (request.user as { sub: string }).sub;

      try {
        const result = await knowledgeService.listChunks(
          userId,
          documentId,
          parsed.data.page,
          parsed.data.limit
        );

        return reply.send({
          success: true,
          data: result.data,
          meta: {
            total: result.total,
            page: parsed.data.page,
            limit: parsed.data.limit,
            totalPages: Math.ceil(result.total / parsed.data.limit),
          },
        });
      } catch {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Knowledge document not found" },
        });
      }
    });

    scoped.post("/api/knowledge/query", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = queryKnowledgeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      const result = await knowledgeService.query(userId, parsed.data);
      return reply.send({ success: true, data: result });
    });
  });
}
