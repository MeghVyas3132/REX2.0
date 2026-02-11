# REX -- AI Workflow Automation Engine

REX is a production-grade workflow automation engine designed for building, executing, and managing AI-powered automation pipelines. It provides a visual drag-and-drop editor for composing directed acyclic graphs (DAGs) of processing nodes, a distributed execution engine backed by BullMQ, and a REST API for programmatic control.

The system is architected as a monorepo with strict separation between domain logic, infrastructure, and presentation layers. Every workflow is validated as a DAG before execution, ensuring deterministic topological ordering and cycle-free processing.

---

## Architecture

REX follows a layered monorepo architecture with five shared packages and three deployable applications.

### Shared Packages

- **@rex/types** -- TypeScript type definitions shared across all packages and applications. Defines node interfaces, workflow structures, execution models, LLM provider contracts, and API schemas.

- **@rex/utils** -- Common utilities including structured logging (Pino), AES-256-GCM encryption for API key storage, configuration management, and data cleaning operations.

- **@rex/database** -- PostgreSQL persistence layer using Drizzle ORM. Contains schema definitions for users, workflows, executions, execution steps, and encrypted API keys.

- **@rex/llm** -- LLM provider abstraction layer with factory pattern. Supports Gemini and Groq providers with a unified interface for prompt generation, token tracking, and response normalization.

- **@rex/engine** -- Core execution engine. Implements DAG validation (Kahn's algorithm for topological sort), node registry, and the sequential execution pipeline with per-step result tracking.

### Applications

- **Backend API** (Fastify) -- REST API server handling authentication (JWT), workflow CRUD, execution triggering, API key management, webhook ingestion, and scheduled workflow polling. Runs on port 4000.

- **Worker** (BullMQ) -- Distributed job processor. Consumes execution jobs from Redis, loads workflow definitions from PostgreSQL, resolves node implementations from the engine registry, and persists step-level results back to the database.

- **Frontend** (Next.js) -- Web application with a visual workflow editor. Provides drag-and-drop node composition, real-time execution status polling with per-node feedback, and a dark monochrome interface.

---

## Node Types

REX ships with 13 built-in node types organized into four categories.

### Triggers

| Node | Description |
|------|-------------|
| Manual Trigger | Starts a workflow on demand via the UI or API |
| Webhook Trigger | Starts a workflow when an external HTTP POST is received |
| Schedule Trigger | Starts a workflow on a cron expression or fixed interval |

### Actions

| Node | Description |
|------|-------------|
| LLM | Sends a prompt to Gemini or Groq with template interpolation and configurable parameters |
| HTTP Request | Makes HTTP requests to external APIs with method, headers, body, and timeout control |
| Code | Executes user-provided JavaScript with sandboxed context and timeout enforcement |
| Transformer | Transforms data using JavaScript expressions or declarative field mappings |

### Logic

| Node | Description |
|------|-------------|
| Condition | Evaluates a field against a value using operators (equals, contains, greater than, exists, etc.) |
| JSON Validator | Validates input data against required fields and field type constraints |
| Data Cleaner | Applies cleaning operations: trim, normalize case, remove special characters, mask PII |

### Output

| Node | Description |
|------|-------------|
| Log | Writes structured log entries at configurable severity levels |
| Output | Terminal node that collects and structures all upstream data as the final workflow result |
| Storage | Persists execution data to the step output with a keyed storage identifier |

---

## Execution Model

1. A workflow is submitted for execution via the API or the visual editor.
2. The backend creates an execution record with status `pending` and enqueues a job to BullMQ.
3. The worker picks up the job, loads the workflow definition, and validates the DAG.
4. Nodes are executed in topological order. Each node receives merged outputs from all parent nodes.
5. Per-step results (status, output, duration, errors) are persisted to the database in real time.
6. On failure, remaining nodes are marked as `skipped` and the execution is recorded as `failed`.
7. The frontend polls the execution endpoint and updates node status badges on the canvas.

Scheduled workflows are managed by a background scheduler service that checks for active schedule-trigger nodes at a fixed interval, computes effective run timing from cron expressions or interval configuration, and enqueues executions automatically.

---

## Security

- **Authentication**: JWT-based with bcrypt password hashing. Tokens are issued on login and verified on every protected route using scoped Fastify hooks.

- **API Key Encryption**: User-provided LLM API keys are encrypted at rest using AES-256-GCM with scrypt key derivation. Keys are decrypted only at execution time inside the worker process.

- **Code Execution Sandboxing**: The Code node runs user JavaScript inside a restricted Function constructor with a curated set of globals (JSON, Math, Date, Array, Object, String). Network access and filesystem operations are not exposed.

- **Rate Limiting**: Global rate limiting on all API endpoints. Webhook endpoints have separate, configurable rate limits.

---

## Visual Workflow Editor

The frontend includes a full-featured visual editor for building workflows:

- Drag and drop nodes from a categorized palette onto an infinite canvas.
- Connect nodes by dragging from output to input ports, rendered as SVG bezier curves.
- Configure each node through a detail panel with type-specific form fields.
- Pan and zoom the canvas for navigation across large workflows.
- Execute workflows directly from the editor with real-time status feedback.
- Per-node execution badges indicate completed, running, failed, or skipped states.
- Error details are surfaced inline on the canvas when a node fails.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5 (strict mode) |
| Frontend | Next.js 15, React 19 |
| Backend API | Fastify 5 |
| Job Queue | BullMQ 5, Redis |
| Database | PostgreSQL 16, Drizzle ORM |
| LLM Providers | Google Gemini, Groq |
| Logging | Pino 9 |
| Monorepo | pnpm workspaces, Turborepo |
| Deployment | Docker Compose (5 containers) |

---

## Infrastructure

The system deploys as five Docker containers:

- **rex-postgres** -- PostgreSQL 16 with persistent volume
- **rex-redis** -- Redis for BullMQ job queue
- **rex-backend** -- Fastify API server
- **rex-worker** -- BullMQ job consumer
- **rex-frontend** -- Next.js application server

All inter-service communication happens over the Docker bridge network. The backend and frontend are the only containers with exposed ports (4000 and 3000 respectively).

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/auth/me` | Get current user |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows` | List workflows (paginated) |
| GET | `/api/workflows/:id` | Get workflow detail |
| PATCH | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:id/execute` | Trigger execution |
| GET | `/api/workflows/:id/executions` | List executions |

### Executions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/executions/:id` | Get execution detail with step results |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/keys` | Store encrypted API key |
| GET | `/api/keys` | List keys (metadata only) |
| DELETE | `/api/keys/:id` | Delete key |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/:workflowId` | Trigger workflow via webhook |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## License

Private. Internal use only.
