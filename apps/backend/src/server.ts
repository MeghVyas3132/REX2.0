// ──────────────────────────────────────────────
// REX - Backend API Server
// ──────────────────────────────────────────────

import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { getDatabase } from "@rex/database";
import { loadConfig, createLogger } from "@rex/utils";
import { createAuthService } from "./services/auth.service.js";
import { createApiKeyService } from "./services/apikey.service.js";
import { createWorkflowService } from "./services/workflow.service.js";
import { createExecutionService } from "./services/execution.service.js";
import { registerAuthRoutes } from "./routes/auth.routes.js";
import { registerApiKeyRoutes } from "./routes/apikey.routes.js";
import { registerWorkflowRoutes } from "./routes/workflow.routes.js";
import { registerWebhookRoutes } from "./routes/webhook.routes.js";
import { registerChatRoutes } from "./routes/chat.routes.js";
import { startScheduler } from "./services/scheduler.service.js";

const logger = createLogger("server");

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  // Initialize Fastify with Pino logger
  const app = Fastify({
    logger: {
      level: config.logLevel,
      timestamp: true,
    },
  });

  // Database
  const db = getDatabase(config.postgres.url);

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
  });

  await app.register(fastifyJwt, {
    secret: config.jwt.secret,
  });

  // Authentication decorator
  app.decorate("authenticate", async function (request: Parameters<typeof app.authenticate>[0], reply: Parameters<typeof app.authenticate>[1]) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
      });
    }
  });

  // Services (dependency injection)
  const authService = createAuthService(db);
  const apiKeyService = createApiKeyService(db);
  const workflowService = createWorkflowService(db);
  const executionService = createExecutionService(db);

  // Routes
  registerAuthRoutes(app, authService);
  registerApiKeyRoutes(app, apiKeyService);
  registerWorkflowRoutes(app, workflowService, executionService);
  registerWebhookRoutes(app, db, executionService);
  registerChatRoutes(app, apiKeyService);

  // Start scheduler for cron/interval workflows
  startScheduler(db, executionService);

  // Health check
  app.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Global error handler
  app.setErrorHandler((error: Error & { statusCode?: number }, _request: FastifyRequest, reply: FastifyReply) => {
    logger.error({
      message: error.message,
      statusCode: error.statusCode,
      stack: config.nodeEnv === "development" ? error.stack : undefined,
    }, "Unhandled error");

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
        message: statusCode === 500 ? "Internal server error" : error.message,
      },
    });
  });

  // Start server
  try {
    await app.listen({ port: config.backend.port, host: config.backend.host });
    logger.info({
      port: config.backend.port,
      environment: config.nodeEnv,
    }, "REX Backend API started");
  } catch (err) {
    logger.error({ error: err }, "Failed to start server");
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error({ error: err }, "Bootstrap failed");
  process.exit(1);
});
