// ──────────────────────────────────────────────
// REX - Database Schema Index
// ──────────────────────────────────────────────

// Core multi-tenancy schemas
export {
  tenants,
  tenantUsers,
  tenantPlans,
  pluginCatalogue,
  tenantPlugins,
  tenantDataResidency,
  abacPolicies,
  adminAuditLog,
} from "./tenants.js";

// Compliance & REX scoring schemas
export {
  workflowNodeRexScores,
  workflowPublications,
  workflowLegalBasis,
  dataSubjectRequests,
} from "./compliance.js";

// User & auth schemas
export { users } from "./users.js";
export { apiKeys } from "./api-keys.js";

// Workflow & execution schemas
export { workflows } from "./workflows.js";
export { executions } from "./executions.js";
export { executionSteps } from "./execution-steps.js";
export { executionStepAttempts } from "./execution-step-attempts.js";
export { executionContextSnapshots } from "./execution-context-snapshots.js";
export { executionRetrievalEvents } from "./execution-retrieval-events.js";

// Knowledge management schemas
export { knowledgeCorpora } from "./knowledge-corpora.js";
export { knowledgeDocuments } from "./knowledge-documents.js";
export { knowledgeChunks } from "./knowledge-chunks.js";

// Configuration schemas
export { modelRegistry } from "./model-registry.js";
export { domainConfigs } from "./domain-configs.js";

// Guardrail & monitoring schemas
export { guardrailEvents } from "./guardrail-events.js";
export { alertRules } from "./alert-rules.js";
export { alertEvents } from "./alert-events.js";

// Workspace & permissions schemas
export { workspaces } from "./workspaces.js";
export { workspaceMembers } from "./workspace-members.js";
export { workflowPermissions } from "./workflow-permissions.js";
export { iamPolicies } from "./iam-policies.js";
export { executionAuthorizations } from "./execution-authorizations.js";

// Hyperparameter tuning schemas
export { hyperparameterProfiles } from "./hyperparameter-profiles.js";
export { hyperparameterExperiments } from "./hyperparameter-experiments.js";

// Compliance & privacy schemas
export { userConsents } from "./user-consents.js";
export { dataAccessAuditLogs } from "./data-access-audit-logs.js";
export { retentionPolicies } from "./retention-policies.js";
