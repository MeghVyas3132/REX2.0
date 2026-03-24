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
import { registerAppRoutes } from "./routes/index.js";
import { startScheduler } from "./services/scheduler.service.js";
import { createKnowledgeService } from "./services/knowledge.service.js";
import { createTemplateService } from "./services/template.service.js";
import { createIAMService } from "./services/iam.service.js";
import { createModelRegistryService } from "./services/model-registry.service.js";
import { createDomainConfigService } from "./services/domain-config.service.js";
import { createKpiService } from "./services/kpi.service.js";
import { createGDPRService } from "./services/gdpr.service.js";
import { createWorkspaceService } from "./services/workspace.service.js";
import { createPolicyService } from "./services/policy.service.js";
import { createHyperparameterService } from "./services/hyperparameter.service.js";
import { createAlertingService } from "./services/alerting.service.js";
import { createComplianceService } from "./services/compliance.service.js";
import { createExecutionAuthorizationService } from "./services/execution-authorization.service.js";
import { applyAuthContext } from "./middleware/auth.js";
import { createTenantMiddleware } from "./middleware/tenant.js";
import { createPublicationService } from "./services/publication.service.js";
import { createRexAutofixService } from "./services/rex-autofix.service.js";

const logger = createLogger("server");

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  // Initialize Fastify with Pino logger
  const app = Fastify({
    logger: {
      level: config.logLevel,
      timestamp: true,
    },
    bodyLimit: 10 * 1024 * 1024, // 10 MB for file uploads
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

  // Services (dependency injection)
  const authService = createAuthService(db);
  const iamService = createIAMService(db);
  const domainConfigService = createDomainConfigService(db);
  const executionAuthorizationService = createExecutionAuthorizationService(db);
  const hyperparameterService = createHyperparameterService(db);
  const apiKeyService = createApiKeyService(db);
  const workflowService = createWorkflowService(db);
  const executionService = createExecutionService(
    db,
    iamService,
    domainConfigService,
    executionAuthorizationService,
    hyperparameterService
  );
  const knowledgeService = createKnowledgeService(db);
  const templateService = createTemplateService(workflowService);
  const modelRegistryService = createModelRegistryService(db);
  const kpiService = createKpiService(db);
  const gdprService = createGDPRService(db);
  const workspaceService = createWorkspaceService(db);
  const policyService = createPolicyService(db);
  const alertingService = createAlertingService(db);
  const complianceService = createComplianceService(db);
  const publicationService = createPublicationService(db);
  const rexAutofixService = createRexAutofixService(db);
  const tenantMiddleware = createTenantMiddleware(db);

  // Authentication decorator
  app.decorate("authenticate", async function (request: Parameters<typeof app.authenticate>[0], reply: Parameters<typeof app.authenticate>[1]) {
    await applyAuthContext(request, reply);
    if (reply.sent) return;
    await tenantMiddleware(request, reply);
  });

  // Routes
  registerAppRoutes(app, {
    db,
    authService,
    apiKeyService,
    workflowService,
    executionService,
    iamService,
    knowledgeService,
    templateService,
    modelRegistryService,
    domainConfigService,
    kpiService,
    gdprService,
    workspaceService,
    policyService,
    hyperparameterService,
    alertingService,
    complianceService,
    publicationService,
    rexAutofixService,
  });

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
  logger.error(
    {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    },
    "Bootstrap failed"
  );
  process.exit(1);
});
