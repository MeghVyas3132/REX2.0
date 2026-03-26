# LLD - Low-Level Design

## 1. Backend Modules
### 1.1 Bootstrapping
- `apps/backend/src/server.ts`
  - Loads config.
  - Creates Fastify app with CORS, rate limit, JWT.
  - Initializes services via dependency injection.
  - Decorates `app.authenticate` to run auth + tenant middleware.
  - Registers all route modules.
  - Starts scheduler and health endpoint.

### 1.2 Middleware
- `middleware/auth.ts`
  - Verifies JWT and maps claims into `request.ctx`.
- `middleware/tenant.ts`
  - Loads tenant, plan, enabled plugins; blocks inactive tenant.
- `middleware/abac.ts`
  - Evaluates tenant ABAC policies via `json-logic-js`.

### 1.3 Route Modules
- Auth: register/login/me.
- API keys: store/list/delete encrypted provider keys.
- Workflows/executions: CRUD + trigger + telemetry listing + stop.
- Webhook: public rate-limited execution trigger endpoint.
- Knowledge: corpus/doc/chunk/query lifecycle.
- Templates: list/get/preview/instantiate.
- Governance: models, domain configs, workspaces, permissions, policies, hyperparameters, alerts, KPI, compliance, GDPR.
- Tenant: tenant profile/users/plugins/plan/usage, plugin catalogue views.
- Admin: super-admin tenant/plan/plugin global operations.
- Publication: publishable workflow catalog.
- REX: score retrieval and autofix operations.

## 2. Key Services and Responsibilities
- `auth.service.ts`: registration, password hashing, login, membership defaults.
- `workflow.service.ts`: tenant-scoped workflow CRUD, version increment on graph mutation.
- `execution.service.ts`: execution creation, enqueueing, status updates, telemetry retrieval.
- `knowledge.service.ts`: corpus/document records, ingestion enqueue, deterministic similarity query.
- `iam.service.ts`: role checks + workflow action checks + policy evaluation.
- `domain-config.service.ts`: layered config resolution (global/user/workflow).
- `kpi.service.ts`: summary and time-series aggregation.
- `compliance.service.ts`: consent, retention, legal basis, DSAR, report generation.
- `publication.service.ts`: publication CRUD/publish state.
- `rex-autofix.service.ts`: compute scores and mutate graph with autofix helper nodes/flags.

## 3. Worker Internals
- `worker.ts`: single BullMQ worker handles two job types.
- `handler.ts` (`execute-workflow`):
  - Verifies execution state.
  - Resolves API keys/domain config/hyperparameters.
  - Calls engine and persists step-level observability.
- `knowledge-handler.ts` (`ingest-knowledge-document`):
  - Chunks docs, resolves embedding settings, computes embeddings, writes chunks.

## 4. Engine Internals
- `dag-validator.ts`: Kahn topological sort + cycle detection.
- `execution-engine.ts`:
  - Validates DAG.
  - Executes node-by-node in topological order.
  - Emits context updates/hooks.
  - Handles skip/retry/fail flows.
- `nodes/index.ts`: built-in node registration list includes:
  - trigger: webhook/manual/schedule
  - transform/logic: data-cleaner, transformer, condition, code, evaluation, execution-control
  - model/io: llm, http-request, file-upload, storage, output, log
  - memory/knowledge: memory-read/write, knowledge-ingest/retrieve
  - guardrails: input-guard, output-guard, json-simplify
- `rex/scorer.ts`: weighted Responsible/Ethical/Explainable score computation and autofix action generation.

## 5. Database Schema
### 5.1 Core Identity/Tenant
- `users`, `tenants`, `tenant_users`, `tenant_plans`, `tenant_plugins`, `plugin_catalogue`, `abac_policies`, `admin_audit_log`, `tenant_data_residency`.

### 5.2 Workflow Runtime
- `workflows`, `executions`, `execution_steps`, `execution_step_attempts`, `execution_context_snapshots`, `execution_retrieval_events`, `execution_authorizations`.

### 5.3 Knowledge
- `knowledge_corpora`, `knowledge_documents`, `knowledge_chunks` (includes `embedding_vector vector(1536)`).

### 5.4 Governance/Sharing
- `workspaces`, `workspace_members`, `workflow_permissions`, `iam_policies`, `model_registry`, `domain_configs`, `hyperparameter_profiles`, `hyperparameter_experiments`, `alert_rules`, `alert_events`.

### 5.5 Compliance
- `workflow_node_rex_scores`, `workflow_publications`, `workflow_legal_basis`, `data_subject_requests`, `user_consents`, `retention_policies`, `data_access_audit_logs`, plus `guardrail_events`.

## 6. Critical Code Paths
1. Authenticated request path: JWT verify -> auth context -> tenant context -> route handler -> service -> DB/queue.
2. Execution path: route -> `execution.service.trigger` -> queue -> worker handler -> engine -> DB telemetry.
3. Retrieval observability path: node retrieval attempt -> event persistence -> API list endpoints.
4. Compliance retention path: policy lookup -> resource-specific deletion sweeps.

## 7. Frontend Deletion Impact (Current State)
### 7.1 Deleted Layer Scope
- Frontend application routes/components/libs/styles under `apps/frontend/src/**` are deleted.
- Frontend package metadata and build files (`apps/frontend/package.json`, `apps/frontend/tsconfig.json`, `apps/frontend/Dockerfile`) are deleted.

### 7.2 Impacted Integration Points
- CI frontend stages cannot succeed without restoration or conditionalization.
- Docker compose frontend service cannot build from missing context.
- Root scripts that target `@rex/frontend` are stale in backend-only mode.

### 7.3 Required Reconciliation (Low-Level)
1. If restoring frontend
- Restore `apps/frontend/**` and verify package/workspace discovery.

2. If retaining backend-only mode
- Remove or guard `@rex/frontend` commands in root scripts/CI.
- Remove or profile-gate compose `frontend` service.
- Keep API contracts in docs as backend source of truth.
