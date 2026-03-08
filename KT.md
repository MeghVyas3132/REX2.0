# REX PROP3 Knowledge Transfer (KT)

## 1. Executive Summary

REX is an AI workflow platform where teams design workflows as node-based graphs and run them safely in production.

This codebase now includes the PROP3 architecture layers:

- governance and access control (RBAC + ABAC-style policies)
- runtime domain configuration resolution
- safety guardrails (input and output)
- retrieval quality improvements (reranking)
- KPI and alerting capabilities
- compliance and GDPR operations

In practical terms, this means the platform is no longer only a workflow runner; it is now a governed and observable AI operations system.

## 2. Audience-Oriented Understanding

### For Non-Technical Stakeholders

- Users build workflows visually.
- Workflows can be triggered manually, by schedule, or by webhook.
- The system tracks execution speed, retrieval quality, and safety events.
- Sensitive controls are in place for who can do what.
- Data export and deletion are supported for GDPR workflows.

### For CTO / Leadership

- Clear separation of control plane (backend) and execution plane (worker).
- Governance model supports role-based and policy-based enforcement.
- Alerting and KPI APIs enable operational oversight.
- Compliance surface supports consent, audit logging, retention, export/delete.
- Schema and services are extensible for enterprise requirements.

### For Engineers

- Monorepo with shared packages for types, engine, database, and utils.
- Drizzle migrations define forward schema evolution.
- Worker runtime persists detailed execution telemetry.
- Governance routes are centralized under `governance.routes.ts`.

## 3. Repository Structure

- `apps/frontend`: UI (editor, dashboard, KPI, settings)
- `apps/backend`: API services and orchestration
- `apps/worker`: queue consumers and runtime execution
- `packages/types`: shared interfaces/contracts
- `packages/engine`: DAG validator + node execution runtime
- `packages/database`: schema + migrations
- `packages/utils`: security/config/encryption/helpers
- `packages/llm`: provider abstractions

## 4. End-to-End Runtime Flow

### Execution Flow

1. Frontend or external trigger calls backend.
2. Backend validates auth, IAM permissions, and request schema.
3. Backend resolves domain config and creates execution authorization token.
4. Backend enqueues job to BullMQ.
5. Worker validates execution authorization token.
6. Worker executes DAG through engine.
7. Worker persists steps, retries, context snapshots, retrieval events, guardrail events.
8. Worker finalizes execution status and evaluates alert rules.

### Ingestion Flow

1. Knowledge document is queued for ingestion.
2. Worker chunks text (page-aware) and generates embeddings.
3. Chunks are stored with JSON embedding and pgvector column.
4. Document/corpus statuses are updated.

## 5. PROP3 Capability Mapping

### Implemented

- Frontend editor and dashboard, including KPI tab
- Manual/scheduler/webhook triggers
- Fastify backend APIs
- BullMQ queue runtime
- DAG validation
- Input guard node
- Output guard node
- JSON simplify node
- Retrieval orchestration strategies
- Model registry
- Domain config resolver
- RBAC + ABAC-style IAM checks
- Workspaces and workflow sharing
- Hyperparameter profiles and profile comparison API
- Alert rules/events and metrics endpoint
- GDPR export/delete API
- Compliance consent/retention APIs

### Data-Layer Upgrades Implemented

- pgvector extension and vector column
- page and section indexing fields on knowledge chunks
- execution authorization table
- IAM/policy/workspace/compliance/alert tables

## 6. Key APIs to Know

### Governance

- `GET/POST /api/models`
- `GET/PUT /api/domain-configs`
- `POST /api/domain-configs/resolve`
- `GET/POST /api/workspaces`
- `POST /api/workspaces/:workspaceId/members`
- `POST /api/workspaces/:workspaceId/assign-workflow`
- `GET/PUT /api/workflows/:workflowId/permissions`
- `GET/PUT /api/policies`

### Runtime Optimization and Monitoring

- `GET/PUT /api/hyperparameters/profiles`
- `POST /api/hyperparameters/compare`
- `GET/PUT /api/alerts/rules`
- `GET /api/alerts/events`
- `GET /api/alerts/metrics`
- `GET /api/kpi/summary`
- `GET /api/kpi/timeseries`

### Compliance

- `GET/POST /api/compliance/consents`
- `PUT /api/compliance/retention-policies`
- `POST /api/compliance/retention-sweep`
- `GET /api/me/export`
- `DELETE /api/me`

## 7. Database and Migrations

Critical migrations:

- `0006_prop3_foundations.sql`
- `0007_prop3_enterprise_upgrade.sql`

These migrations are mandatory for PROP3 capabilities.

## 8. Security Model

### Identity and Access

- JWT authentication
- User roles: `admin`, `editor`, `viewer`
- IAM policies with allow/deny and condition evaluation
- Workflow sharing via explicit permission records

### Execution Safety

- Input guard detects prompt-injection and PII patterns
- Output guard enforces toxicity/PII/JSON checks
- Guardrail events persisted for audit and alerting

### Secrets

- API keys encrypted at rest
- Decrypted only in runtime paths that require provider calls

## 9. Observability Model

Telemetry tables capture:

- per-step runtime
- retry attempts
- retrieval event details
- context snapshots
- guardrail trigger events
- alert rule/event lifecycle

KPI APIs aggregate these into operational metrics for dashboards and alerting.

## 10. Operational Runbook

### Bring Up Environment

1. Configure env variables
2. Install dependencies
3. Run migrations
4. Start backend, worker, frontend

### Validate Health

- `GET /api/health`
- Run a manual workflow execution
- Confirm step/retrieval/context telemetry rows are created
- Confirm KPI endpoints return data

### Common Production Checks

- Migration level matches deployed code
- Redis and PostgreSQL health
- Queue backlog growth
- Alert event volume spikes
- Retention sweep outcomes

## 11. Current Risks and Follow-Up Recommendations

1. Add automated integration tests for governance APIs and worker authorization checks.
2. Add dedicated UI screens for governance/admin workflows (currently API-complete; UI coverage can be expanded).
3. Add streaming TTFT instrumentation if strict TTFT KPI is required.
4. Add external observability export (Prometheus scraping and dashboard provisioning) as deployment standard.

## 12. Handover Checklist

- Schema migrated through `0007`
- Environment secrets configured
- Admin user seeded/assigned
- At least one alert rule configured
- KPI dashboard reachable
- GDPR export/delete tested in non-production
- Retention policy defined per data class

## 13. Final Notes

This implementation establishes a production-grade baseline for governed AI workflow execution aligned with PROP3 principles. The system now includes both the technical controls and operational interfaces needed for controlled enterprise usage.
