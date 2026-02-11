// ──────────────────────────────────────────────
// REX - Auth Routes
// Controllers only — business logic in services
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerSchema, loginSchema } from "../validation/schemas.js";
import type { AuthService } from "../services/auth.service.js";
import { ServiceError } from "../services/auth.service.js";

export function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthService
): void {
  app.post("/api/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
      });
    }

    try {
      const user = await authService.register(parsed.data.email, parsed.data.name, parsed.data.password);
      const token = app.jwt.sign({ sub: user.id, email: user.email });

      return reply.status(201).send({
        success: true,
        data: { user, token },
      });
    } catch (err) {
      if (err instanceof ServiceError) {
        return reply.status(err.statusCode).send({
          success: false,
          error: { code: err.code, message: err.message },
        });
      }
      throw err;
    }
  });

  app.post("/api/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
      });
    }

    try {
      const user = await authService.login(parsed.data.email, parsed.data.password);
      const token = app.jwt.sign({ sub: user.id, email: user.email });

      return reply.send({
        success: true,
        data: { user, token },
      });
    } catch (err) {
      if (err instanceof ServiceError) {
        return reply.status(err.statusCode).send({
          success: false,
          error: { code: err.code, message: err.message },
        });
      }
      throw err;
    }
  });

  app.get("/api/auth/me", {
    onRequest: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { sub: string }).sub;
    const user = await authService.getUserById(userId);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

    return reply.send({ success: true, data: { user } });
  });
}
