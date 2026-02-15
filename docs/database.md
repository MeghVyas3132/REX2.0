# Database Model

## Scope

REX uses PostgreSQL with Drizzle ORM. Data is structured around users, workflows, executions, runtime telemetry, and knowledge corpora.

## Core Tables

### Identity and Secrets

- `users`
  - Account identity and password hash.
- `api_keys`
  - Encrypted provider API keys per user.

### Workflow Authoring

- `workflows`
  - Graph JSON (`nodes`, `edges`), lifecycle status, version.
  - Template provenance fields:
    - `source_template_id`
    - `source_template_version`
    - `source_template_params`

### Execution Tracking

- `executions`
  - Trigger payload, run state, timestamps, error summary.
- `execution_steps`
  - One row per node result in execution order.
- `execution_step_attempts`
  - Retry and attempt-level detail per node.
- `execution_context_snapshots`
  - Sequenced snapshots of mutable execution context.
- `execution_retrieval_events`
  - Retrieval telemetry and branch strategy metadata.

### Knowledge and Retrieval

- `knowledge_corpora`
  - Scoped corpus container by user/workflow/execution.
- `knowledge_documents`
  - Source content and ingestion lifecycle state.
- `knowledge_chunks`
  - Chunked content, embedding payload, and metadata.

## Relationship Overview

- User owns workflows, API keys, corpora, and documents.
- Workflow has many executions.
- Execution has many steps, step attempts, retrieval events, and context snapshots.
- Corpus has many documents and chunks.
- Chunk references both corpus and document.

## Multi-Scope Knowledge Model

Knowledge scope is controlled by corpus columns:

- `scope_type`: user, workflow, execution
- `workflow_id`: optional for workflow scope
- `execution_id`: optional for execution scope

## Indexing Strategy

Indexes exist for high-frequency query paths:

- workflow status and ownership
- execution status and creation time
- execution telemetry by execution/node/status
- corpus/document/chunk ownership and status
- template provenance lookup on workflows

## JSON and Telemetry Fields

- Workflow graphs are stored as JSONB.
- Execution context snapshots store full JSONB state.
- Retrieval and knowledge metadata use JSONB for extensibility.

## Integrity and Cascade

Foreign keys use cascade delete for dependent entities in core lifecycle chains, including executions under workflow and steps under execution.
