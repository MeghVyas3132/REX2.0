# REX

REX (Responsible, Ethical and Explainable AI) is a workflow automation platform for building, running, and governing AI pipelines as directed acyclic graphs (DAGs).

This repository implements the expanded PROP3 architecture with production-oriented controls across identity, runtime safety, retrieval quality, observability, and compliance.

## Platform Capabilities

- Visual DAG authoring and execution monitoring (Next.js frontend)
- Fastify API control plane with JWT authentication and policy enforcement
- BullMQ-based worker runtime for asynchronous execution and ingestion
- RBAC + ABAC-style authorization with workflow sharing and IAM policies
- Runtime domain configuration resolver (global, user, workflow overlays)
- Guardrail nodes and telemetry:
  - `input-guard`
  - `output-guard`
  - `json-simplify`
- Knowledge retrieval orchestration with reranking support
- KPI and observability endpoints plus KPI dashboard tab
- Model registry and hyperparameter profile/experiment support
- GDPR/compliance operations (export, delete, consent, retention, audit)

## Architecture

### Applications

- `apps/frontend`: Next.js UI (editor, templates, corpora, KPI, settings)
- `apps/backend`: Fastify APIs (auth, workflow, governance, KPI, GDPR)
- `apps/worker`: BullMQ consumers (execution runtime and ingestion)

### Shared Packages

- `packages/types`: shared type contracts
- `packages/utils`: config, encryption, logging, security, helpers
- `packages/database`: Drizzle schema, migrations, DB connection
- `packages/engine`: DAG validation and node execution engine
- `packages/llm`: LLM/embedding/reranker provider abstractions

## Database and Migrations

Major schema upgrades for PROP3 are included in:

- `packages/database/drizzle/0006_prop3_foundations.sql`
- `packages/database/drizzle/0007_prop3_enterprise_upgrade.sql`

These migrations add identity/governance, guardrail telemetry, workspace sharing, execution authorization, hyperparameter/alert/compliance tables, and pgvector support.

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

### Steps

1. Copy environment template and configure secrets.
2. Install dependencies.
3. Apply migrations.
4. Start frontend, backend, and worker.

Example commands:

```bash
pnpm install
pnpm db:migrate
pnpm --filter @rex/backend dev
pnpm --filter @rex/worker dev
pnpm --filter @rex/frontend dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Core Governance APIs

- Model registry: `/api/models`
- Domain config: `/api/domain-configs`, `/api/domain-configs/resolve`
- Workspaces and sharing:
  - `/api/workspaces`
  - `/api/workspaces/:workspaceId/members`
  - `/api/workspaces/:workspaceId/assign-workflow`
  - `/api/workflows/:workflowId/permissions`
  - `/api/policies`
- Hyperparameters:
  - `/api/hyperparameters/profiles`
  - `/api/hyperparameters/compare`
- Alerts and metrics:
  - `/api/alerts/rules`
  - `/api/alerts/events`
  - `/api/alerts/metrics`
  - `/api/kpi/summary`
  - `/api/kpi/timeseries`
- Compliance and GDPR:
  - `/api/compliance/consents`
  - `/api/compliance/retention-policies`
  - `/api/compliance/retention-sweep`
  - `/api/me/export`
  - `/api/me`

## Documentation

- High-level docs index: `docs/README.md`
- Endpoint catalog: `docs/endpoints.md`
- Technical requirements: `docs/trd.md`
- Knowledge transfer handover: `KT.md`

## License

Private repository. Internal use only.
