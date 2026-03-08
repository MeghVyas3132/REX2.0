// ──────────────────────────────────────────────
// REX - API Key Routes
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createApiKeySchema } from "../validation/schemas.js";
import type { ApiKeyService } from "../services/apikey.service.js";
import type { IAMService } from "../services/iam.service.js";
import { IAMError } from "../services/iam.service.js";

export function registerApiKeyRoutes(
  app: FastifyInstance,
  apiKeyService: ApiKeyService,
  iamService: IAMService
): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    // All routes in this scope require authentication
    scoped.addHook("onRequest", app.authenticate);

    scoped.post("/api/keys", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createApiKeySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      const userId = (request.user as { sub: string }).sub;
      try {
        await iamService.assertRole(userId, ["admin", "editor"]);
      } catch (err) {
        if (err instanceof IAMError) {
          return reply.status(err.statusCode).send({
            success: false,
            error: { code: err.code, message: err.message },
          });
        }
        throw err;
      }
      const result = await apiKeyService.storeKey(
        userId,
        parsed.data.provider,
        parsed.data.key,
        parsed.data.label
      );

      return reply.status(201).send({ success: true, data: result });
    });

    scoped.get("/api/keys", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const keys = await apiKeyService.listKeys(userId);

      return reply.send({ success: true, data: keys });
    });

    scoped.delete("/api/keys/:keyId", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      try {
        await iamService.assertRole(userId, ["admin", "editor"]);
      } catch (err) {
        if (err instanceof IAMError) {
          return reply.status(err.statusCode).send({
            success: false,
            error: { code: err.code, message: err.message },
          });
        }
        throw err;
      }
      const { keyId } = request.params as { keyId: string };

      await apiKeyService.deleteKey(userId, keyId);

      return reply.send({ success: true, data: { deleted: true } });
    });
  });
}
