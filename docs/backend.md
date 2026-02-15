# Backend Architecture

## Service Role

The backend is the control plane for REX. It provides authentication, workflow CRUD, execution triggering, template instantiation, knowledge APIs, and operational query endpoints. It does not execute workflow nodes directly.

## Runtime Stack

- Framework: Fastify
- Authentication: JWT via Fastify JWT plugin
- Validation: Zod schemas
- Persistence: Drizzle ORM with PostgreSQL
- Queue producer: BullMQ

## Module Boundaries

- `server.ts`
  - Initializes Fastify plugins, auth decorator, services, and route registration.
  - Starts scheduler loop.
  - Provides health endpoint and global error handler.
- `routes/*`
  - Input validation, auth guard, status code mapping, response shape.
- `services/*`
  - Domain-level operations and data access orchestration.
- `queue/client.ts`
  - BullMQ producer for execution and knowledge ingestion jobs.
- `validation/schemas.ts`
  - Request validation contracts.

## Request Handling Pattern

1. Route validates request payload/query with Zod.
2. Route extracts authenticated user ID from JWT.
3. Route delegates to service layer.
4. Service validates ownership/scoping and performs DB operations.
5. Route maps service result to standard response envelope.

## Standard Response Envelope

- Success: `success: true`, with `data` and optional `meta`.
- Failure: `success: false`, with `error.code`, `error.message`, and optional details.

## Security Controls

- JWT guard applied to protected route groups.
- Scoped ownership checks in service methods for workflow and execution resources.
- API keys are encrypted at rest and never returned decrypted over API.
- Global and webhook-specific rate limiting.
- Structured error handling with controlled 500 responses.

## Scheduler Behavior

- Scheduler starts during backend bootstrap.
- Polls active workflows with schedule-trigger nodes.
- Creates execution records and enqueues worker jobs when schedules are due.

## Knowledge API Responsibilities

- Corpus creation with scope constraints: user, workflow, execution.
- Document ingestion request creation and enqueueing.
- Corpora/documents/chunks listing.
- Scoped semantic-style query endpoint over stored chunk embeddings.

## Template API Responsibilities

- Lists versioned workflow templates.
- Provides template preview (graph without persistence).
- Instantiates template into a normal editable workflow and stores template provenance.

## Operational Concerns

- Any queue outage affects execution trigger completion behavior.
- Missing migration tables degrade features such as step attempts or retrieval-event persistence.
- CORS origin is currently permissive (`origin: true`) and should be environment-scoped per deployment policy.
