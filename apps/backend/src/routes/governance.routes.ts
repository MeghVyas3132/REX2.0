// ──────────────────────────────────────────────
// REX - Governance Routes
// Model registry, IAM policy, workspaces, KPI, alerts, compliance, GDPR
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  addWorkspaceMemberSchema,
  assignWorkflowWorkspaceSchema,
  compareHyperparameterProfilesSchema,
  createWorkspaceSchema,
  deleteMeSchema,
  iamPolicySchema,
  kpiQuerySchema,
  listAlertEventsQuerySchema,
  listHyperparameterProfilesQuerySchema,
  listModelsQuerySchema,
  setConsentSchema,
  upsertAlertRuleSchema,
  upsertDomainConfigSchema,
  upsertHyperparameterProfileSchema,
  upsertModelSchema,
  upsertRetentionPolicySchema,
  workflowPermissionSchema,
} from "../validation/schemas.js";
import type { AlertingService } from "../services/alerting.service.js";
import type { ComplianceService } from "../services/compliance.service.js";
import type { DomainConfigService } from "../services/domain-config.service.js";
import type { GDPRService } from "../services/gdpr.service.js";
import { IAMError } from "../services/iam.service.js";
import type { IAMService } from "../services/iam.service.js";
import type { HyperparameterService } from "../services/hyperparameter.service.js";
import type { KpiService } from "../services/kpi.service.js";
import type { ModelRegistryService } from "../services/model-registry.service.js";
import type { PolicyService } from "../services/policy.service.js";
import type { WorkspaceService } from "../services/workspace.service.js";

const workflowParamsSchema = z.object({
  workflowId: z.string().uuid(),
});

const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid(),
});

export function registerGovernanceRoutes(
  app: FastifyInstance,
  modelRegistryService: ModelRegistryService,
  domainConfigService: DomainConfigService,
  kpiService: KpiService,
  gdprService: GDPRService,
  iamService: IAMService,
  workspaceService: WorkspaceService,
  policyService: PolicyService,
  hyperparameterService: HyperparameterService,
  alertingService: AlertingService,
  complianceService: ComplianceService
): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    scoped.get("/api/models", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listModelsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid query params"));
      }

      const models = await modelRegistryService.list(
        parsed.data.provider,
        parsed.data.includeInactive ?? false
      );
      return reply.send({ success: true, data: models });
    });

    scoped.post("/api/models", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = upsertModelSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      try {
        await iamService.assertRole(userId, ["admin"]);
      } catch (err) {
        return respondIAMError(err, reply);
      }

      const model = await modelRegistryService.upsert(parsed.data);
      return reply.status(201).send({ success: true, data: model });
    });

    scoped.get("/api/domain-configs", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const configs = await domainConfigService.list(userId);
      return reply.send({ success: true, data: configs });
    });

    scoped.post("/api/domain-configs/resolve", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = upsertDomainConfigSchema.pick({ workflowId: true, domain: true }).safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const config = await domainConfigService.resolve(
        userId,
        parsed.data.workflowId,
        parsed.data.domain
      );
      return reply.send({ success: true, data: config });
    });

    scoped.put("/api/domain-configs", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = upsertDomainConfigSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      try {
        await iamService.assertRole(userId, ["admin", "editor"]);
      } catch (err) {
        return respondIAMError(err, reply);
      }

      const result = await domainConfigService.upsert(userId, parsed.data);
      return reply.send({ success: true, data: result });
    });

    scoped.get("/api/workspaces", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const workspaces = await workspaceService.listForUser(userId);
      return reply.send({ success: true, data: workspaces });
    });

    scoped.post("/api/workspaces", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createWorkspaceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const workspace = await workspaceService.create(userId, parsed.data.name);
      return reply.status(201).send({ success: true, data: workspace });
    });

    scoped.post("/api/workspaces/:workspaceId/members", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = workspaceParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send(validationError(params.error.flatten(), "Invalid workspace id"));
      }

      const parsed = addWorkspaceMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      try {
        await iamService.assertRole(userId, ["admin", "editor"]);
      } catch (err) {
        return respondIAMError(err, reply);
      }

      await workspaceService.addMember(
        userId,
        params.data.workspaceId,
        parsed.data.memberUserId,
        parsed.data.role
      );
      return reply.send({ success: true, data: { updated: true } });
    });

    scoped.post("/api/workspaces/:workspaceId/assign-workflow", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = workspaceParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send(validationError(params.error.flatten(), "Invalid workspace id"));
      }

      const parsed = assignWorkflowWorkspaceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      await workspaceService.assignWorkflow(userId, params.data.workspaceId, parsed.data.workflowId);
      return reply.send({ success: true, data: { assigned: true } });
    });

    scoped.get("/api/workflows/:workflowId/permissions", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = workflowParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send(validationError(params.error.flatten(), "Invalid workflow id"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await policyService.listWorkflowPermissions(userId, params.data.workflowId);
      return reply.send({ success: true, data });
    });

    scoped.put("/api/workflows/:workflowId/permissions", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = workflowParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send(validationError(params.error.flatten(), "Invalid workflow id"));
      }

      const parsed = workflowPermissionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      await policyService.upsertWorkflowPermission(userId, params.data.workflowId, {
        userId: parsed.data.userId,
        role: parsed.data.role,
        attributes: parsed.data.attributes,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      });
      return reply.send({ success: true, data: { updated: true } });
    });

    scoped.get("/api/policies", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const data = await policyService.listPolicies(userId);
      return reply.send({ success: true, data });
    });

    scoped.put("/api/policies", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = iamPolicySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await policyService.upsertPolicy(userId, parsed.data);
      return reply.send({ success: true, data });
    });

    scoped.get("/api/hyperparameters/profiles", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listHyperparameterProfilesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid query params"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await hyperparameterService.listProfiles(userId, parsed.data.workflowId);
      return reply.send({ success: true, data });
    });

    scoped.put("/api/hyperparameters/profiles", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = upsertHyperparameterProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await hyperparameterService.upsertProfile(userId, parsed.data);
      return reply.send({ success: true, data });
    });

    scoped.post("/api/hyperparameters/compare", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = compareHyperparameterProfilesSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await hyperparameterService.compareProfiles(
        userId,
        parsed.data.workflowId,
        parsed.data.profileAId,
        parsed.data.profileBId
      );
      return reply.send({ success: true, data });
    });

    scoped.get("/api/alerts/rules", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const data = await alertingService.listRules(userId);
      return reply.send({ success: true, data });
    });

    scoped.put("/api/alerts/rules", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = upsertAlertRuleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await alertingService.upsertRule(userId, parsed.data);
      return reply.send({ success: true, data });
    });

    scoped.get("/api/alerts/events", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listAlertEventsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid query params"));
      }
      const userId = (request.user as { sub: string }).sub;
      const data = await alertingService.listEvents(userId, parsed.data.limit);
      return reply.send({ success: true, data });
    });

    scoped.get("/api/alerts/metrics", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const text = await alertingService.getPrometheusMetrics(userId);
      return reply.type("text/plain; version=0.0.4; charset=utf-8").send(text);
    });

    scoped.get("/api/kpi/summary", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = kpiQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid query params"));
      }

      const userId = (request.user as { sub: string }).sub;
      const summary = await kpiService.getSummary(
        userId,
        parsed.data.days,
        parsed.data.latencyThresholdMs
      );
      return reply.send({ success: true, data: summary });
    });

    scoped.get("/api/kpi/timeseries", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = kpiQuerySchema.pick({ days: true }).safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid query params"));
      }

      const userId = (request.user as { sub: string }).sub;
      const timeseries = await kpiService.getTimeseries(userId, parsed.data.days);
      return reply.send({ success: true, data: timeseries });
    });

    scoped.get("/api/compliance/consents", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const data = await complianceService.listConsents(userId);
      return reply.send({ success: true, data });
    });

    scoped.post("/api/compliance/consents", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = setConsentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await complianceService.setConsent(userId, parsed.data);
      return reply.send({ success: true, data });
    });

    scoped.put("/api/compliance/retention-policies", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = upsertRetentionPolicySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      const data = await complianceService.upsertRetentionPolicy(userId, parsed.data);
      return reply.send({ success: true, data });
    });

    scoped.post("/api/compliance/retention-sweep", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const data = await complianceService.runRetentionSweep(userId);
      return reply.send({ success: true, data });
    });

    scoped.get("/api/me/export", async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { sub: string }).sub;
      const data = await gdprService.exportUserData(userId);
      return reply.send({ success: true, data });
    });

    scoped.delete("/api/me", async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = deleteMeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(validationError(parsed.error.flatten(), "Invalid input"));
      }

      const userId = (request.user as { sub: string }).sub;
      await gdprService.deleteUser(userId, parsed.data.confirmEmail);
      return reply.send({ success: true, data: { deleted: true } });
    });
  });
}

function validationError(details: unknown, message: string) {
  return {
    success: false,
    error: { code: "VALIDATION_ERROR", message, details },
  };
}

function respondIAMError(err: unknown, reply: FastifyReply) {
  if (err instanceof IAMError) {
    return reply.status(err.statusCode).send({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  throw err;
}
