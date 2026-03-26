# PRD - REX 2.0 (Code-Derived)

## 1. Product Purpose
REX is a workflow automation platform for building, executing, and governing AI workflows modeled as DAGs. The implemented system provides:
- API-driven workflow lifecycle management.
- Asynchronous execution through queue-backed workers.
- Knowledge ingestion/retrieval pipelines.
- Governance controls (tenanting, IAM policies, compliance, alerting, KPIs, publication).

Source basis:
- `apps/backend/src/server.ts`
- `apps/backend/src/routes/*.ts`
- `apps/backend/src/services/*.ts`
- `apps/worker/src/*.ts`
- `packages/engine/src/*.ts`
- `packages/database/src/schema/*.ts`

## 2. Primary User Personas (Inferred From Authorization Logic)
1. Super Admin
- Global platform administrator (`globalRole = super_admin`).
- Manages tenants, plans, plugins, tenant users, and admin audit visibility.
- Routes: `/admin/*` in `admin.routes.ts`.

2. Tenant Org Admin / Editor / Viewer
- Tenant-scoped users (`tenantRole` in JWT context + `tenant_users`).
- Admin/editor can create/edit workflows and manage certain tenant resources.
- Viewer is read-constrained for workflow mutation.

3. Workflow Builder / Operator
- Manages workflows, templates, executions, knowledge corpora/documents, and publications.

4. Governance/Compliance Operator
- Manages policies, retention, legal basis, consents, DSAR responses, and compliance reports.

## 3. Goals and Functional Scope
### 3.1 Workflow Authoring and Runtime
- Create/list/get/update/delete workflows.
- Execute workflows from API and webhooks.
- Stop active executions.
- Inspect execution details, step attempts, retrieval events, and context snapshots.

### 3.2 Knowledge/RAG
- Create corpora with scope (`user`, `workflow`, `execution`).
- Ingest documents asynchronously.
- Query knowledge with scoped retrieval.
- List corpora/documents/chunks.

### 3.3 Templates
- List templates, preview template graph, instantiate workflow from template.

### 3.4 Governance and Ops
- Model registry and domain configuration overlays.
- Workspaces and workflow sharing/permissions.
- IAM policy management and action assertions.
- Hyperparameter profiles and comparisons.
- Alert rule/event management and metrics export.
- KPI summary and timeseries.

### 3.5 Compliance
- Consent capture and listing.
- Retention policy upsert + retention sweep.
- Workflow legal basis management.
- Data subject request create/list/respond.
- Compliance reporting.
- GDPR export and delete-me endpoints.

### 3.6 Publication and REX Scoring
- Publish workflows as catalog entries.
- Execute published workflows.
- Compute/list REX scores and preview/apply autofixes.

## 4. Key User Workflows (Implementation-Derived)
1. Register/Login
- `POST /api/auth/register` or `POST /api/auth/login`.
- JWT issued with tenant + role claims.

2. Create and Run Workflow
- `POST /api/workflows` -> `POST /api/workflows/:workflowId/execute`.
- Execution persisted as `pending` and enqueued via BullMQ.
- Worker executes DAG and writes execution telemetry.

3. Knowledge Ingestion
- `POST /api/knowledge/corpora`.
- `POST /api/knowledge/documents/ingest` creates document + enqueue job.
- Worker chunks, embeds, writes chunks, updates statuses.

4. Governance Enforcement
- Route auth hook populates context.
- Tenant middleware validates active tenant + plan/plugins.
- IAM checks assert role/action before mutation routes.

5. Compliance Operations
- Capture consent and legal basis.
- Periodic/manual retention sweep removes stale resources by policy.
- DSAR request lifecycle tracked in DB.

## 5. Non-Goals (From Current Code)
- No active frontend app present in workspace tree (`apps/frontend` missing), despite references in Docker/CI/scripts.
- No explicit real cron scheduler library; schedule trigger uses interval polling + cron approximation.
- No streaming endpoint support in backend routes.

## 6. Success Signals (Operationally Visible in Code)
- Health endpoint returns OK (`GET /api/health`).
- Execution lifecycle transitions persist in DB (`pending` -> `running` -> terminal states).
- Knowledge corpus/document statuses converge to `ready` or `failed`.
- KPI endpoints surface latency/retrieval/guardrail metrics.
- Alert metrics endpoint exports Prometheus text format.
