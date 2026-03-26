# HLD - High-Level Design

## 1. Architecture Style
Hybrid modular monolith + async worker architecture in a pnpm/turbo monorepo:
- Synchronous control plane: Fastify backend.
- Asynchronous execution plane: BullMQ worker(s).
- Shared domain libraries: engine/types/utils/database/llm packages.
- Persistence: PostgreSQL (+ pgvector) and Redis.

## 2. Logical Components
1. API Server (`apps/backend`)
- Authenticates requests (JWT), applies tenant context, exposes REST APIs.
- Handles orchestration requests (workflow trigger, knowledge ingest enqueue, governance operations).

2. Worker (`apps/worker`)
- Consumes BullMQ jobs from queue `workflow-execution` (default).
- Executes workflows and knowledge ingestion jobs.

3. Workflow Engine (`packages/engine`)
- DAG validation and topological execution.
- Node registry and built-in node executors.
- REX scoring logic.

4. Database Package (`packages/database`)
- Drizzle schema definitions + migration runner.
- Tenant, workflow, execution, governance, and compliance tables.

5. LLM Package (`packages/llm`)
- Provider factory and provider implementations (`gemini`, `groq`), plus embedding/reranker provider abstractions.

6. Utilities (`packages/utils`)
- Env/config loader, encryption helpers, logging, sanitization, chunking, embedding helpers.

## 3. End-to-End Runtime Flow
### 3.1 Workflow Execution
1. Client calls `POST /api/workflows/:id/execute`.
2. Backend validates auth/authorization and writes execution row (`pending`).
3. Backend issues execution authorization token record.
4. Backend enqueues BullMQ job `execute-workflow`.
5. Worker dequeues, marks execution `running`, validates authorization.
6. Worker calls engine `executeWorkflow`.
7. Worker writes steps, retries, retrieval events, context snapshots, guardrail/alert telemetry.
8. Worker marks execution terminal status.

### 3.2 Knowledge Ingestion
1. Client calls ingest endpoint.
2. Backend writes knowledge document (`pending`) and enqueues `ingest-knowledge-document`.
3. Worker chunks text, computes embeddings (provider or deterministic fallback), stores chunks.
4. Statuses update on document and corpus (`ready`/`failed`).

## 4. External Integrations
- PostgreSQL (primary store, including vector column type in knowledge chunks).
- Redis (BullMQ transport and scheduling backbone).
- External AI APIs via provider-specific calls:
  - Gemini/Groq for LLM generation.
  - OpenAI/Cohere for embeddings (optional via stored API keys).

## 5. Security and Access Control
- JWT auth (`@fastify/jwt`) populates request user identity.
- Tenant middleware validates tenant status and enriches tenant plan/plugins in context.
- IAM service enforces role-based + permission + policy constraints.
- ABAC middleware exists and can evaluate JSON-logic policies.

## 6. Deployment Model (From Infra Files)
Docker Compose services:
- `postgres` (pgvector image)
- `redis`
- `backend`
- `worker`
- `frontend` (referenced, but app missing in workspace)

CI pipeline performs typecheck, build, backend+engine tests, frontend build gate, and verify command.

## 7. High-Level Dependency Graph
- `backend` -> `database`, `engine`, `llm`, `types`, `utils`, Redis queue client.
- `worker` -> `database`, `engine`, `types`, `utils`, BullMQ.
- `engine` -> `types`, `utils`, `llm`.
- `database` -> `utils`, `types`, Drizzle/Postgres.

## 8. Frontend State and Reconciliation
### 8.1 Observed Repository State
- `apps/frontend` is currently deleted in the working tree (148 deleted files).
- Frontend references still exist in infra/build metadata:
  - `.github/workflows/ci.yml` (`@rex/frontend` filter)
  - `docker-compose.yml` (`frontend` service, `apps/frontend` build context)
  - `package.json` (`@rex/frontend` script target)

### 8.2 Architectural Implication
- Runtime architecture currently operates as backend + worker + database + redis.
- The web UI layer is not deployable from this workspace state.

### 8.3 Reconciliation Paths
1. Full-stack path
- Restore `apps/frontend` and keep CI/compose/package references as-is.

2. Backend-only path
- Remove or gate frontend references from CI, compose, and scripts.
- Update release checks to validate only backend/worker/packages.
