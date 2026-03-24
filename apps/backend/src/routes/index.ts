import type { FastifyInstance } from "fastify";
import type { Database } from "@rex/database";
import type { AuthService } from "../services/auth.service.js";
import type { ApiKeyService } from "../services/apikey.service.js";
import type { WorkflowService } from "../services/workflow.service.js";
import type { ExecutionService } from "../services/execution.service.js";
import type { IAMService } from "../services/iam.service.js";
import type { createKnowledgeService } from "../services/knowledge.service.js";
import type { createTemplateService } from "../services/template.service.js";
import type { ModelRegistryService } from "../services/model-registry.service.js";
import type { DomainConfigService } from "../services/domain-config.service.js";
import type { KpiService } from "../services/kpi.service.js";
import type { GDPRService } from "../services/gdpr.service.js";
import type { WorkspaceService } from "../services/workspace.service.js";
import type { PolicyService } from "../services/policy.service.js";
import type { HyperparameterService } from "../services/hyperparameter.service.js";
import type { AlertingService } from "../services/alerting.service.js";
import type { ComplianceService } from "../services/compliance.service.js";
import type { createPublicationService } from "../services/publication.service.js";
import type { createRexAutofixService } from "../services/rex-autofix.service.js";
import { registerAuthRoutes } from "./auth.routes.js";
import { registerApiKeyRoutes } from "./apikey.routes.js";
import { registerWorkflowRoutes } from "./workflow.routes.js";
import { registerWebhookRoutes } from "./webhook.routes.js";
import { registerChatRoutes } from "./chat.routes.js";
import { registerFileUploadRoutes } from "./file-upload.routes.js";
import { registerKnowledgeRoutes } from "./knowledge.routes.js";
import { registerTemplateRoutes } from "./template.routes.js";
import { registerGovernanceRoutes } from "./governance.routes.js";
import { registerAdminRoutes } from "./admin.routes.js";
import { registerTenantRoutes } from "./tenant.routes.js";
import { registerPublicationRoutes } from "./publication.routes.js";
import { registerRexRoutes } from "./rex.routes.js";

type KnowledgeService = ReturnType<typeof createKnowledgeService>;
type TemplateService = ReturnType<typeof createTemplateService>;
type PublicationService = ReturnType<typeof createPublicationService>;
type RexAutofixService = ReturnType<typeof createRexAutofixService>;

export interface RouteDependencies {
  db: Database;
  authService: AuthService;
  apiKeyService: ApiKeyService;
  workflowService: WorkflowService;
  executionService: ExecutionService;
  iamService: IAMService;
  knowledgeService: KnowledgeService;
  templateService: TemplateService;
  modelRegistryService: ModelRegistryService;
  domainConfigService: DomainConfigService;
  kpiService: KpiService;
  gdprService: GDPRService;
  workspaceService: WorkspaceService;
  policyService: PolicyService;
  hyperparameterService: HyperparameterService;
  alertingService: AlertingService;
  complianceService: ComplianceService;
  publicationService: PublicationService;
  rexAutofixService: RexAutofixService;
}

export function registerAppRoutes(app: FastifyInstance, deps: RouteDependencies): void {
  registerAuthRoutes(app, deps.authService);
  registerApiKeyRoutes(app, deps.apiKeyService, deps.iamService);
  registerWorkflowRoutes(app, deps.workflowService, deps.executionService, deps.iamService);
  registerWebhookRoutes(app, deps.db, deps.executionService);
  registerChatRoutes(app, deps.apiKeyService);
  registerFileUploadRoutes(app);
  registerKnowledgeRoutes(app, deps.knowledgeService, deps.iamService);
  registerTemplateRoutes(app, deps.templateService, deps.db);
  registerGovernanceRoutes(
    app,
    deps.modelRegistryService,
    deps.domainConfigService,
    deps.kpiService,
    deps.gdprService,
    deps.iamService,
    deps.workspaceService,
    deps.policyService,
    deps.hyperparameterService,
    deps.alertingService,
    deps.complianceService
  );
  registerAdminRoutes(app, deps.db);
  registerTenantRoutes(app, deps.db);
  registerPublicationRoutes(app, deps.publicationService, deps.executionService, deps.iamService);
  registerRexRoutes(app, deps.rexAutofixService, deps.iamService);
}
