# REX

REX stands for Responsible, Ethical and Explainable AI.

REX is a workflow automation platform for building and operating AI pipelines as directed acyclic graphs (DAGs). It includes a visual editor, a queue-backed distributed execution runtime, and a versioned RAG template system.

## What REX Provides

- Visual DAG workflow editor
- Deterministic graph validation and topological execution
- BullMQ-based distributed worker execution
- Step-level execution persistence in PostgreSQL
- Execution context snapshots and retry telemetry
- Knowledge ingestion and scoped retrieval APIs
- RAG templates that instantiate into editable workflows
- Encrypted API key management for LLM providers

## Architecture Summary

REX is a monorepo with shared packages and deployable apps.

### Applications

- Frontend (`apps/frontend`)
  - Next.js application for workflow editing, template usage, execution visibility, and settings.
- Backend (`apps/backend`)
  - Fastify API control plane for auth, workflows, executions, templates, and knowledge endpoints.
- Worker (`apps/worker`)
  - BullMQ consumer that executes workflows and processes knowledge ingestion jobs.

### Shared Packages

- `@rex/types`
  - Shared type contracts for workflows, executions, nodes, templates, and knowledge runtime.
- `@rex/utils`
  - Configuration, logging, encryption, and knowledge helper utilities.
- `@rex/database`
  - Drizzle schema, migrations, and DB connection utilities.
- `@rex/engine`
  - DAG validator, node registry, and execution engine runtime.
- `@rex/llm`
  - Provider abstraction for Gemini and Groq.

## Execution Model

1. Backend receives an execution trigger request.
2. Backend creates an `executions` row in `pending` state.
3. Backend enqueues `execute-workflow` job to BullMQ.
4. Worker loads workflow graph and executes via `@rex/engine`.
5. Worker persists steps, context snapshots, step attempts, and retrieval events.
6. Execution record is finalized as `completed` or `failed`.

## Runtime Node Catalog

Current runtime supports 20 built-in node types across trigger, action, logic, memory/control, and knowledge categories.

Knowledge-aware nodes:

- `knowledge-ingest`
- `knowledge-retrieve`

Cognitive/runtime support nodes:

- `memory-read`
- `memory-write`
- `evaluation`
- `execution-control`

## RAG Templates

Current template catalog includes:

- simple-rag
- memory-augmented-rag
- agentic-rag
- graph-rag
- branched-rag
- self-rag
- adaptive-rag
- speculative-rag
- corrective-rag
- modular-rag
- multimodal-rag
- hyde-retrieval

Templates compile into standard workflow nodes and edges and remain fully editable after instantiation.

## Persistence Overview

Core entities:

- workflows
- executions
- execution_steps
- execution_step_attempts
- execution_context_snapshots
- execution_retrieval_events
- knowledge_corpora
- knowledge_documents
- knowledge_chunks

## Local Deployment

Use Docker Compose for full-stack runtime:

1. Copy `.env.example` to `.env` and set secure secrets.
2. Build and start services with `docker compose up -d --build`.
3. Run migrations with `pnpm db:migrate` from repository root.
4. Access frontend at `http://localhost:3000` and backend at `http://localhost:4000`.

## Documentation

Detailed documentation is available under `docs/`.

- `docs/README.md`
- `docs/prd.md`
- `docs/trd.md`
- `docs/backend.md`
- `docs/worker.md`
- `docs/engine.md`
- `docs/dag.md`
- `docs/rag.md`
- `docs/frontend.md`
- `docs/database.md`
- `docs/migrations.md`
- `docs/endpoints.md`

## License

Private repository. Internal use only.
