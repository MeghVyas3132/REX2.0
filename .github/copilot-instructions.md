# REX - Copilot Instructions

## Build, Test, and Lint Commands

### Install and Setup
```bash
pnpm install                    # Install all dependencies
pnpm db:migrate                 # Apply database migrations
```

### Development
```bash
pnpm dev                        # Start all services via Turbo
pnpm --filter @rex/backend dev  # Backend only (port 4000)
pnpm --filter @rex/worker dev   # Worker only
pnpm --filter @rex/frontend dev # Frontend only (port 3000)
```

### Build
```bash
pnpm build                      # Build all packages and apps
pnpm --filter @rex/engine build # Build specific package
```

### Type Checking
```bash
pnpm typecheck                  # Check all packages
pnpm --filter @rex/frontend typecheck  # Check specific package
```

### Linting
```bash
pnpm lint                       # Lint all packages
pnpm lint:frontend              # Frontend only
```

### Testing
```bash
# All tests
pnpm test                       # Run all unit tests

# Per-package tests
pnpm --filter @rex/frontend test            # All frontend tests
pnpm --filter @rex/backend test             # All backend tests
pnpm --filter @rex/engine test              # Engine tests

# Frontend-specific test suites
pnpm test:frontend              # Alias for frontend tests
pnpm --filter @rex/frontend test:unit       # Unit tests only
pnpm --filter @rex/frontend test:integration # Integration tests only
pnpm --filter @rex/frontend test:contracts  # Contract tests only
pnpm --filter @rex/frontend test:api-client # API client tests only
pnpm test:e2e                   # End-to-end tests (Playwright)

# Watch mode
pnpm --filter @rex/frontend test:watch      # Run tests in watch mode
```

### Database Operations
```bash
pnpm db:generate                # Generate Drizzle migrations
pnpm db:migrate                 # Run migrations
pnpm db:seed                    # Seed database
```

### Verification Workflows
```bash
# Pre-deployment verification gates
pnpm verify:platform            # Platform verification
pnpm verify:core-runtime        # Core runtime verification
pnpm verify:e2e                 # Full E2E verification gate
pnpm verify:work-packages       # All work package verifications

# Performance checks
pnpm perf:bundle                # Check frontend bundle size
```

### Other Commands
```bash
pnpm contracts:sync:report      # Generate contract sync report
pnpm clean                      # Clean all build artifacts
```

## High-Level Architecture

### Monorepo Structure
REX is organized as a pnpm workspace + Turborepo monorepo with three runtime applications and six shared packages.

**Applications** (in `apps/`):
- **backend**: Fastify control plane - handles authentication, workflow CRUD, execution orchestration, governance, KPI, and compliance APIs. Does NOT execute workflows.
- **worker**: BullMQ-based execution plane - consumes workflow jobs, executes DAG nodes via engine, persists telemetry, and handles knowledge ingestion.
- **frontend**: Next.js App Router UI - workflow editor, templates, KPI dashboard, settings, execution visualization.

**Shared Packages** (in `packages/`):
- **types**: Shared TypeScript contracts for auth, workflow, execution, compliance, and node definitions
- **database**: Drizzle ORM schema, migrations, DB connection, and helpers
- **engine**: Pure DAG validation and node execution logic with retry/branching support
- **llm**: LLM/embedding/reranker provider abstractions (Gemini, Groq, etc.)
- **utils**: Configuration, encryption, logging, security helpers, knowledge chunking
- **types**: Domain contracts across the platform

### Architecture Patterns

**Control Plane vs Execution Plane Separation**:
- Backend (control plane) issues execution authorization tokens and enqueues jobs
- Worker (execution plane) validates authorization and executes workflow nodes
- This separation ensures consistent IAM/policy enforcement regardless of trigger type (manual, webhook, schedule)

**Execution Flow**:
1. User triggers workflow via API (manual, webhook, or scheduler)
2. Backend validates auth, checks IAM policies, resolves domain config
3. Backend issues execution authorization token and enqueues BullMQ job
4. Worker picks up job, validates authorization, executes via engine
5. Engine orchestrates DAG nodes topologically with retry/branching logic
6. Worker persists execution steps, attempts, retrieval events, and telemetry
7. Frontend polls execution status and displays step-by-step results

**DAG Execution Model**:
- Engine validates graph as DAG (no cycles)
- Topological sort determines execution order
- Parent outputs are merged and passed to child nodes
- Edge conditions support branching (skip nodes based on parent outputs)
- Node execution includes retry policies, context patching, and retrieval injection
- Execution context tracks memory, knowledge state, control counters, and retrieval budgets

**Governance and Authorization**:
- JWT authentication via `@fastify/jwt`
- RBAC roles: `owner`, `admin`, `editor`, `viewer`
- ABAC-style policy enforcement via `iam_policies` table
- Workspace-based multi-tenancy with member roles
- Execution authorization tokens decouple API auth from runtime execution

### Key Subsystems

**Knowledge/RAG Pipeline**:
- Documents ingested via `knowledge-ingest` node (chunking, embedding)
- Chunks stored in `knowledge_chunks` with `embedding_vector` (pgvector)
- Retrieval via `knowledge-retrieve` node with multiple strategies:
  - `single`, `first-non-empty`, `merge`, `best-score`, `adaptive`
- Reranking support for retrieval quality
- Retrieval budget limits enforce cost control

**Guardrails and Safety**:
- `input-guard`: validates/sanitizes inputs before processing
- `output-guard`: validates/filters outputs before returning
- `json-simplify`: sanitizes JSON structures
- Guardrail events persisted to `guardrail_events` table
- Runtime control tracks guardrail violation counts

**Hyperparameter Management**:
- Model hyperparameter profiles stored in `hyperparameter_profiles`
- Experiment tracking via `experiments` table
- Profile comparison API for A/B testing
- Domain configs provide runtime overlay resolution (global → user → workflow)

**KPI and Observability**:
- KPI summary and time-series endpoints aggregate execution metrics
- Alert rules and events support operational monitoring
- Prometheus-compatible `/api/alerts/metrics` endpoint
- Frontend KPI dashboard displays summary cards and daily trends

**Compliance and GDPR**:
- Consent management via `consents` table
- Data retention policies and sweep operations
- Audit logging in `audit_logs` table
- User data export (`/api/me/export`) and deletion (`/api/me`)
- Data Subject Access Request (DSAR) workflows

## Key Conventions

### Database and Migrations
- **Always run migrations before deployment**: `pnpm db:migrate`
- Migrations are in `packages/database/drizzle/` with sequential naming
- Major PROP3 migrations: `0006_prop3_foundations.sql`, `0007_prop3_enterprise_upgrade.sql`
- Schema files organized by domain in `packages/database/src/schema/`
- Use Drizzle ORM query builder, not raw SQL (unless migration)
- `pgvector` extension required for embedding storage

### TypeScript and Module System
- **ESM modules only** - use `import`/`export`, not `require()`
- All packages use `"type": "module"` in package.json
- Strict TypeScript config in `tsconfig.base.json` with `noUncheckedIndexedAccess: true`
- Shared types MUST be defined in `packages/types`, not duplicated

### Package Dependencies
- Use workspace protocol for internal dependencies: `"@rex/types": "workspace:*"`
- Backend/worker depend on: types, database, engine, llm, utils
- Frontend depends on: types (via API client)
- Engine is pure domain logic with minimal dependencies

### API Structure
- Backend routes organized by domain in `apps/backend/src/routes/`
- Route handlers call service layer (never direct DB access in routes)
- Services in `apps/backend/src/services/`
- All requests validated with Zod schemas from `apps/backend/src/validation/schemas.ts`
- Protected routes require JWT bearer token
- Error responses follow envelope: `{ error: string, statusCode: number }`

### Node Development
- Node implementations in `packages/engine/src/nodes/`
- Each node exports a `BaseNodeDefinition` with:
  - `type`: unique node type identifier
  - `manifest`: config schema and metadata
  - `execute`: async execution function
- Register nodes via `registerAllNodes()` called at engine initialization
- Node execution receives `NodeInput` and `NodeExecutionContext`
- Nodes can patch context via return metadata: `{ contextPatches: [...] }`

### Testing
- **Backend/Engine**: Vitest with `describe`/`it` structure
- **Frontend**: Vitest + Testing Library for unit/integration, Playwright for E2E
- Test files colocated: `__tests__/` directories or `.test.ts` suffix
- Contract tests in frontend verify API client matches backend contracts
- Run single test file: `pnpm --filter <package> vitest run <path>`

### Environment Configuration
- Required env vars enforced in `packages/utils/src/config.ts`
- Copy `.env.example` to `.env` for local development
- Backend needs: `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, `DATABASE_URL`, `REDIS_HOST`
- Frontend needs: `NEXT_PUBLIC_API_URL`
- Never commit secrets to `.env` files

### Worker and Queue
- BullMQ queue name: `workflow-execution` (configurable via `QUEUE_NAME`)
- Job payload includes execution ID, workflow graph, trigger data, and authorization
- Worker concurrency controlled by `WORKER_CONCURRENCY` env var
- Jobs retry 3 times with exponential backoff by default
- Graceful shutdown: worker completes in-flight jobs before exit

### Frontend State Management
- Auth context via React Context API in `src/lib/auth/`
- API client with typed methods in `src/lib/api/`
- React Query for server state caching (via `@tanstack/react-query`)
- Zustand for client-side UI state (imported from `zustand`)
- No Redux or other complex state managers

### Logging
- Pino logger throughout backend and worker
- Log level controlled by `LOG_LEVEL` env var
- Structured logging with correlation IDs for request tracing
- Frontend uses browser console (no server-side logging from client)

### Security
- Encryption via `packages/utils/src/encryption.ts` using `ENCRYPTION_MASTER_KEY`
- API keys encrypted at rest in `api_keys` table
- Sensitive fields masked in logs via `maskSensitiveInput()`
- Rate limiting on backend routes: 100 req/min global, 30 req/min webhooks
- CORS configured via `@fastify/cors`

### Documentation
- Technical docs in `docs/` directory - consult when making architectural changes
- High-level architecture: `docs/HLD.md`
- Low-level design: `docs/LLD.md`
- API endpoints: `docs/endpoints.md`, `docs/API_ENDPOINTS.md`
- Database schema: `docs/database.md`
- Package inventory: `docs/packages.md`
- Knowledge transfer: `docs/KT.md`

## Development Workflow

1. **Start dependencies**: Ensure PostgreSQL (with pgvector) and Redis are running
2. **Configure environment**: Copy `.env.example` to `.env` and fill in secrets
3. **Install and migrate**: `pnpm install && pnpm db:migrate`
4. **Start services**:
   - Terminal 1: `pnpm --filter @rex/backend dev`
   - Terminal 2: `pnpm --filter @rex/worker dev`
   - Terminal 3: `pnpm --filter @rex/frontend dev`
5. **Access**: Frontend at `http://localhost:3000`, Backend at `http://localhost:4000`

## Common Tasks

### Adding a New Node Type
1. Create node definition in `packages/engine/src/nodes/<category>/<node-name>.ts`
2. Export node from `packages/engine/src/nodes/<category>/index.ts`
3. Add node type to `packages/types/src/node.ts` enum if needed
4. Update `registerAllNodes()` in `packages/engine/src/nodes/index.ts`
5. Add frontend node palette entry in `apps/frontend/src/features/editor/`
6. Write node execution tests

### Adding a New API Endpoint
1. Define Zod schema in `apps/backend/src/validation/schemas.ts`
2. Add route handler in appropriate routes file (e.g., `apps/backend/src/routes/workflow.routes.ts`)
3. Implement service method in `apps/backend/src/services/<domain>.service.ts`
4. Add frontend API client method in `apps/frontend/src/lib/api/client.ts`
5. Update types in `packages/types/src/api.ts` if needed
6. Add contract test in `apps/frontend/src/features/__tests__/`

### Adding a Database Table
1. Create schema file in `packages/database/src/schema/<table-name>.ts`
2. Export from `packages/database/src/schema/index.ts`
3. Run `pnpm db:generate` to create migration
4. Review and edit migration file in `packages/database/drizzle/`
5. Run `pnpm db:migrate` to apply locally
6. Update `docs/database.md` with table description

### Troubleshooting Build Issues
- **"Cannot find module"**: Run `pnpm build` in dependency packages first (Turbo handles this)
- **Type errors**: Run `pnpm typecheck` to see all errors across packages
- **Stale builds**: Run `pnpm clean && pnpm build` to rebuild from scratch
- **Migration errors**: Check `DATABASE_URL` and ensure PostgreSQL is running

## Additional Resources

- [Root README](../README.md) - Platform overview and quick start
- [Technical Requirements (TRD)](../docs/trd.md) - Tech stack and constraints
- [Knowledge Transfer (KT)](../docs/KT.md) - Comprehensive onboarding guide
- [API Endpoints](../docs/endpoints.md) - Complete API reference
- [Database Model](../docs/database.md) - Schema and relationships
