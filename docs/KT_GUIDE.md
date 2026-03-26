# KT Guide - End-to-End Knowledge Transfer

## 1. System Mental Model
REX splits into:
- Control plane (`apps/backend`): validates/authenticates requests, writes authoritative DB state, enqueues async jobs.
- Execution plane (`apps/worker`): consumes queue jobs and runs engine logic.
- Shared packages (`packages/*`): business primitives reused by backend and worker.

Think of backend as command + read model APIs, and worker as deterministic execution processor.

## 2. How a Request Becomes an Execution
1. JWT-authenticated user calls execution endpoint.
2. Backend checks IAM and tenant constraints.
3. Execution record created in DB.
4. Job pushed to BullMQ.
5. Worker pulls job and runs engine.
6. Worker writes telemetry rows (steps, attempts, retrieval events, snapshots).
7. API reads those rows back via execution endpoints.

## 3. Local Runbook
1. Configure `.env` from `.env.example`.
2. Start infrastructure:
   - `docker compose up -d postgres redis`
3. Install deps:
   - `pnpm install`
4. Migrate:
   - `pnpm db:migrate`
5. Start services:
   - `pnpm --filter @rex/backend dev`
   - `pnpm --filter @rex/worker dev`

Optional quality gates:
- `pnpm typecheck`
- `pnpm --filter @rex/backend test`
- `pnpm --filter @rex/engine test`

## 4. Debugging Guide
### 4.1 Auth/Access Failures
- Inspect JWT claims expected by `middleware/auth.ts`.
- Check tenant activation and plan/plugin context in `middleware/tenant.ts`.
- Validate IAM checks in `services/iam.service.ts`.

### 4.2 Execution Stuck or Missing
- Verify queue connectivity (`REDIS_HOST`, `QUEUE_NAME`).
- Confirm worker process is running.
- Inspect execution row status and step rows.

### 4.3 Knowledge Ingestion Failures
- Validate corpus/document ownership constraints.
- Check worker logs from `knowledge-handler.ts`.
- If provider embeddings fail, deterministic fallback is expected.

### 4.4 Policy/Compliance Issues
- Review retention and legal basis tables.
- Confirm actor role for DSAR response and admin-gated actions.

## 5. Key Design Decisions Observed in Code
1. Queue-first execution
- Backend never executes workflow inline; always enqueues.

2. Layered config model
- Domain configs merge by specificity (global -> user -> workflow).

3. Observability as first-class data
- Retrieval, context snapshots, and step attempts are persisted and queryable.

4. Tenant-centric architecture
- Most primary tables include `tenant_id`; middleware enforces tenant state.

5. Policy extensibility
- IAM policy conditions are data-driven and evaluated at runtime.

## 6. Common Pitfalls
- Missing or weak env values (`JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, DB/Redis vars).
- Running backend without worker (executions remain pending).
- Forgetting migrations before runtime.
- Expecting frontend checks to pass in CI when `apps/frontend` is absent in current workspace.

## 7. Module-to-Owner Hand-off Checklist
- Backend routes and validation inventory reviewed.
- Service dependency graph understood.
- Queue contracts (`ExecutionJobPayload`, `KnowledgeIngestionJobPayload`) verified.
- Database schema and migration journal reviewed.
- Critical smoke tests and failure paths documented.

## 8. Frontend Deletion Reconciliation Runbook
### 8.1 Confirm State
1. Run `git status --short | grep '^ D apps/frontend' | wc -l`.
2. If non-zero, treat frontend as removed in current tree.

### 8.2 Identify Stale References
Run:
- `grep -Rno "apps/frontend\|@rex/frontend\|frontend" .github docker-compose.yml package.json turbo.json pnpm-workspace.yaml`

Expected current stale references include:
- `.github/workflows/ci.yml`
- `docker-compose.yml`
- `package.json`

### 8.3 Reconcile
1. Restore path
- Restore `apps/frontend/**` and rerun full CI checks.

2. Backend-only path
- Remove/guard frontend steps from CI.
- Remove/guard frontend service from compose.
- Remove/guard frontend script targets in root package scripts.

### 8.4 Validate Post-Reconciliation
- `pnpm typecheck`
- `pnpm build`
- backend and engine tests
- `docker compose config` must have no invalid build context references.
