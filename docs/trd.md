# Technical Requirements Document (TRD)

## Purpose

Define architecture contracts and implementation requirements for REX runtime, data model, and platform operations.

## System Topology

- Frontend: Next.js client application
- Backend: Fastify API control plane
- Worker: BullMQ execution and ingestion runtime
- Persistence: PostgreSQL
- Queue: Redis + BullMQ
- Shared packages: types, utils, database, engine, llm

## Technical Principles

- Single source of type contracts in `@rex/types`
- Workflow execution logic isolated in `@rex/engine`
- API layer remains orchestration and validation only
- Queue decouples request latency from execution latency
- Persisted telemetry over ephemeral logs for operational audit

## Execution Requirements

1. Validate every workflow graph as DAG before execution.
2. Execute nodes in deterministic topological order.
3. Support branch-condition based skip semantics.
4. Persist per-step result rows.
5. Persist retry attempt telemetry when available.
6. Persist execution context snapshots with monotonic sequence.
7. Support runtime retrieval and ingestion callbacks.

## RAG Technical Requirements

1. Knowledge model must support user/workflow/execution scoping.
2. Ingestion must produce chunked content and embedding payload per chunk.
3. Retrieval must support top-K and strategy-based branch orchestration.
4. Retrieval events must persist attempt and strategy metadata.
5. RAG templates must compile to standard DAG nodes and edges.
6. Runtime memory must remain mutable across node boundaries in one run.

## API Requirements

- All protected routes require JWT verification.
- All mutable payloads validated with Zod schemas.
- Standardized success/error response envelopes.
- Pagination metadata for list endpoints.

## Database Requirements

- Foreign key integrity with cascade where lifecycle-coupled.
- Indexes for high-frequency query paths.
- JSONB for flexible workflow and telemetry payloads.
- Migration-driven schema evolution only.

## Security Requirements

- Encrypt provider keys at rest using configured master key.
- Do not expose decrypted keys through API.
- Enforce ownership checks on workflow and execution resources.
- Apply global and webhook-specific rate limits.

## Performance and Reliability Requirements

- Worker concurrency configurable by environment.
- BullMQ retry/backoff configured for transient failures.
- Retrieval budget limits per execution to avoid runaway behavior.
- Graceful degradation if optional telemetry table is unavailable.

## Deployment Requirements

- Dockerized services with health checks for stateful dependencies.
- Migrations applied before application runtime upgrade.
- Environment variables supplied consistently to backend and worker.

## Verification Requirements

- Workspace build must pass for all packages/apps.
- Engine test suite must pass for retry, control, and retrieval orchestration behavior.
- Template preview and instantiation endpoints must return valid DAG graph payloads.
