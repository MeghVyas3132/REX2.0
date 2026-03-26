# TRD - Technical Requirements Document

## 1. Tech Stack
- Language: TypeScript (ESM modules).
- Runtime: Node.js (CI uses Node 22; Docker images use Node 20-alpine).
- Monorepo: pnpm workspace + Turborepo.
- API Framework: Fastify.
- Validation: Zod.
- ORM/SQL: Drizzle ORM + postgres driver.
- Queue: BullMQ + Redis.
- Auth: JWT (`@fastify/jwt`).
- Logging: Pino.
- Testing: Vitest (backend), Node test runner (engine), Playwright script present.

## 2. Workspace Packages
- `apps/backend`
- `apps/worker`
- `packages/database`
- `packages/engine`
- `packages/llm`
- `packages/types`
- `packages/utils`

Note: CI/Docker/scripts also reference `@rex/frontend` and `apps/frontend`, but this directory is not present in current workspace tree.

## 3. Environment Requirements
Required env vars (enforced by `packages/utils/src/config.ts`):
- Core: `NODE_ENV`, `LOG_LEVEL`
- Postgres: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- Backend: `BACKEND_PORT`, `BACKEND_HOST`
- JWT: `JWT_SECRET`, `JWT_EXPIRY`
- Encryption: `ENCRYPTION_MASTER_KEY`
- Worker: `WORKER_CONCURRENCY`, `QUEUE_NAME`
- Rate limits: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `WEBHOOK_RATE_LIMIT_MAX`, `WEBHOOK_RATE_LIMIT_WINDOW_MS`
- Optional retrieval limits: `RETRIEVAL_MAX_*`

## 4. Build and Run Commands
From root `package.json`:
- `pnpm install`
- `pnpm db:migrate`
- `pnpm build`
- `pnpm dev`
- `pnpm test`
- `pnpm typecheck`

Service-focused:
- Backend dev: `pnpm --filter @rex/backend dev`
- Worker dev: `pnpm --filter @rex/worker dev`
- DB migrate: `pnpm --filter @rex/database db:migrate`

## 5. Infrastructure Dependencies
- PostgreSQL with pgvector extension support (`pgvector/pgvector:pg16` in compose).
- Redis 7 (`redis:7-alpine`).
- Docker Compose for local orchestration.

## 6. CI/CD Validation
GitHub Actions workflow:
- Install deps (frozen lockfile).
- Typecheck (`pnpm typecheck`).
- Build (`pnpm build`).
- Run backend and engine tests.
- Run frontend build and e2e verify gates (currently inconsistent with missing frontend dir).

## 7. Operational Constraints and Defaults
- Backend request body limit: 10 MB.
- Global rate limit defaults: 100 req/min.
- Webhook rate limit defaults: 30 req/min.
- Queue jobs default attempts/backoff: 3 attempts, exponential backoff 2s.
- Scheduler poll interval: 30s, simple cron approximation.

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

## Frontend State Reconciliation Requirements

Current observed state:
- `apps/frontend` is deleted in the working tree (148 files marked deleted).
- Frontend is still referenced by:
	- `.github/workflows/ci.yml`
	- `docker-compose.yml`
	- root `package.json` scripts

Required reconciliation options:
1. Restore frontend option
- Restore `apps/frontend` and ensure frontend package is discoverable by workspace tooling.
- Keep CI frontend build/e2e gates enabled.

2. Backend-only option
- Remove or gate frontend references from CI and root scripts.
- Remove or profile-gate compose frontend service.
- Update verification criteria to backend/worker/packages only.

Acceptance criteria for either option:
- `pnpm build` and `pnpm typecheck` pass without missing-package failures.
- CI pipeline does not include unreachable stages.
- Compose startup does not reference absent build contexts.
