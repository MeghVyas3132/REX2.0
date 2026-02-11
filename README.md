# REX - AI Workflow Automation Engine

Production-foundation MVP of a DAG-based workflow automation platform. Backend inspired by n8n, built as a monorepo with strict separation of concerns.

## Architecture

```
apps/
  backend/     Fastify 5 REST API (auth, workflows, webhooks, queue)
  worker/      BullMQ worker (executes workflows off-queue)
  frontend/    Next.js 15 App Router (dark monochrome UI)

packages/
  types/       Shared TypeScript interfaces
  utils/       Encryption (AES-256-GCM), cleaning, logging (Pino), config
  database/    Drizzle ORM schema, PostgreSQL connection, migrations
  llm/         LLM provider abstraction (Gemini, Groq)
  engine/      Node registry, DAG validator, execution engine
```

## Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | Next.js 15, React 19, TypeScript |
| Backend   | Fastify 5, TypeScript          |
| Worker    | BullMQ 5, ioredis              |
| Database  | PostgreSQL 16, Drizzle ORM     |
| Auth      | JWT (fastify/jwt), bcrypt      |
| Queue     | Redis 7 + BullMQ               |
| LLM       | Gemini API, Groq API           |
| Encryption| AES-256-GCM + scrypt           |
| Logging   | Pino (structured JSON)         |
| Infra     | Docker Compose (5 containers)  |

## Node Types

| Type              | Purpose                                      |
|-------------------|----------------------------------------------|
| `webhook_trigger` | HTTP POST trigger for external integrations   |
| `manual_trigger`  | On-demand execution with arbitrary payload    |
| `data_cleaner`    | Trim, normalize case, remove chars, mask PII  |
| `llm`             | LLM inference (Gemini/Groq) with templates    |
| `json_validator`  | Schema validation (required fields, types)    |
| `storage`         | Key-value read/write (in-memory for MVP)      |
| `log`             | Structured logging at configurable level      |

## Prerequisites

- Docker and Docker Compose
- No local Node.js or npm required

## Quick Start

```bash
# Clone and enter project
cd REX2.0

# Copy environment file
cp .env.example .env
# Edit .env and set your ENCRYPTION_MASTER_KEY and JWT_SECRET

# Start all services
docker compose up --build

# Services:
#   Frontend   → http://localhost:3000
#   Backend    → http://localhost:4000
#   PostgreSQL → localhost:5432
#   Redis      → localhost:6379
```

## Database Setup

Migrations and seeding run inside Docker containers:

```bash
# Run migrations (creates all tables)
docker compose exec backend npx tsx node_modules/@rex/database/src/migrate.ts

# Seed 10 example workflows for demo@rex.dev (password: demo1234)
docker compose exec backend npx tsx node_modules/@rex/database/src/seed.ts
```

Or directly in the database package container context:

```bash
docker compose exec backend sh -c "cd node_modules/@rex/database && npx tsx src/migrate.ts"
docker compose exec backend sh -c "cd node_modules/@rex/database && npx tsx src/seed.ts"
```

## API Endpoints

### Auth
```
POST /api/auth/register   { email, name, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me          [Bearer token]
```

### Workflows
```
GET    /api/workflows                        List workflows
POST   /api/workflows                        Create workflow
GET    /api/workflows/:id                    Get workflow
PATCH  /api/workflows/:id                    Update workflow
DELETE /api/workflows/:id                    Delete workflow
POST   /api/workflows/:id/execute            Execute workflow
GET    /api/workflows/:id/executions         List executions
GET    /api/workflows/:id/executions/:eid    Get execution + steps
```

### Webhooks (public, rate-limited)
```
POST /api/webhooks/:workflowId              Trigger webhook workflow
```

### API Keys (BYOK)
```
GET    /api/keys              List stored keys
POST   /api/keys              Store encrypted key { provider, key, label }
DELETE /api/keys/:id          Remove key
```

## Seeded Workflows

| # | Name                        | Trigger  | Nodes Used                        |
|---|-----------------------------|---------|------------------------------------|
| 1 | Smart Form Cleaner          | Webhook | cleaner, validator, storage, log   |
| 2 | Resume Bullet Enhancer      | Manual  | cleaner, llm, log                  |
| 3 | CSV Data Cleaner            | Webhook | cleaner, validator, log            |
| 4 | Log Severity Classifier     | Webhook | cleaner, llm, storage, log         |
| 5 | PII Scrubber                | Webhook | cleaner, validator, storage, log   |
| 6 | Customer Feedback Analyzer  | Manual  | cleaner, llm, validator, storage   |
| 7 | Email Content Standardizer  | Webhook | cleaner, validator, storage, log   |
| 8 | API Payload Sanitizer       | Webhook | validator, cleaner, validator, log |
| 9 | AI Data Enrichment Pipeline | Manual  | cleaner, llm, validator, storage, log |
| 10| Incident Report Processor   | Webhook | cleaner, llm, validator, storage, log |

## BYOK (Bring Your Own Key)

LLM nodes require API keys. Keys are encrypted at rest with AES-256-GCM using scrypt key derivation from `ENCRYPTION_MASTER_KEY`. Store keys via the Settings page or POST /api/keys.

Supported providers:
- **Gemini** (generativelanguage.googleapis.com)
- **Groq** (api.groq.com, OpenAI-compatible)

## Execution Flow

1. User triggers workflow (manual, webhook, or via API)
2. Backend creates execution record, enqueues job to BullMQ
3. Worker picks up job, loads workflow from DB
4. DAG validator runs Kahn's algorithm for topological sort
5. Engine executes nodes sequentially in resolved order
6. Each step result (input, output, duration, status) persisted to DB
7. Execution status updated (completed/failed)

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable              | Description                      |
|----------------------|----------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string     |
| `REDIS_URL`           | Redis connection string          |
| `JWT_SECRET`          | JWT signing secret               |
| `ENCRYPTION_MASTER_KEY` | 32+ char key for AES-256-GCM  |
| `BACKEND_PORT`        | Backend port (default 4000)      |
| `FRONTEND_PORT`       | Frontend port (default 3000)     |
| `WORKER_CONCURRENCY`  | Parallel job processing (default 5) |

## Project Structure

```
REX2.0/
├── docker-compose.yml
├── .env / .env.example
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── server.ts            Fastify bootstrap
│   │       ├── routes/              auth, apikey, workflow, webhook
│   │       ├── services/            auth, apikey, workflow, execution
│   │       ├── queue/client.ts      BullMQ queue producer
│   │       ├── validation/          Zod schemas
│   │       └── types/               Fastify augmentation
│   ├── worker/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── worker.ts            BullMQ consumer
│   │       └── handler.ts           Execution handler
│   └── frontend/
│       ├── Dockerfile
│       └── src/
│           ├── app/                 Next.js App Router pages
│           └── lib/                 API client, auth context
└── packages/
    ├── types/src/                   Shared interfaces
    ├── utils/src/                   Encryption, cleaning, logger
    ├── database/src/                Schema, connection, seed
    ├── llm/src/                     Gemini/Groq providers
    └── engine/src/                  Nodes, DAG, execution engine
```

## License

Private. Internal use only.
