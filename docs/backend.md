# Backend Architecture

## Role

`apps/backend` is the control plane for:

- identity and authentication
- workflow lifecycle management
- execution orchestration and queueing
- governance and authorization
- KPI and compliance APIs

The backend does not execute workflow nodes directly.

## Stack

- Fastify
- JWT (`@fastify/jwt`)
- Zod request validation
- Drizzle ORM
- BullMQ producer

## Core Service Map

- `auth.service.ts`: register/login/current user
- `workflow.service.ts`: workflow CRUD
- `execution.service.ts`: execution creation, authorization issuance, queue enqueue
- `iam.service.ts`: RBAC + ABAC-style workflow authorization
- `workspace.service.ts`: workspace ownership/membership and workflow assignment
- `policy.service.ts`: workflow sharing and IAM policy persistence
- `model-registry.service.ts`: model catalog
- `domain-config.service.ts`: runtime overlay resolution
- `hyperparameter.service.ts`: profile management and profile comparison
- `kpi.service.ts`: KPI aggregation (summary/time-series)
- `alerting.service.ts`: rule/event model and Prometheus output
- `compliance.service.ts`: consent, audit log, retention policy/sweep
- `gdpr.service.ts`: export and account deletion

## Security and Governance Flow

1. Route validates payload and JWT.
2. IAM checks role/resource permissions.
3. Execution trigger resolves runtime domain config.
4. Execution authorization token is issued (`execution_authorizations`).
5. Job is enqueued with execution authorization context.

This decouples API authorization decisions from worker runtime execution.

## Governance Surface

Implemented API areas:

- Model registry
- Domain configs
- Workspaces and sharing
- IAM policies
- Hyperparameter profiles and comparison
- Alert rule/event APIs
- KPI summary and time-series
- Consent/retention operations
- GDPR export/delete

## Scheduler

`startScheduler` scans active workflows and enqueues due schedule-trigger executions through `ExecutionService`, so IAM/domain-config/execution-authorization behavior remains consistent across manual, webhook, and scheduler triggers.

## Operational Notes

- Apply migrations before backend deployment.
- Keep JWT/encryption secrets rotated and environment-scoped.
- Use `alerts/metrics` for metrics scraping integration.
- Use retention sweep to enforce data lifecycle policies.
