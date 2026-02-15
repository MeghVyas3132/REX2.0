# Migration History

## Overview

Database migrations are managed under `packages/database/drizzle` and applied in order.

## Applied Migration Sequence

### 0000_melted_swarm

Introduced initial core schema:

- users
- api_keys
- workflows
- executions
- execution_steps
- execution_context_snapshots

Also introduced core indexes and foreign keys for workflow and execution tracking.

### 0001_tranquil_mantis

Introduced knowledge storage model:

- knowledge_corpora
- knowledge_documents
- knowledge_chunks

Added scope and status indexes for corpus/document/chunk lookup paths.

### 0002_kind_slayback

Introduced retrieval telemetry table:

- execution_retrieval_events

Added execution/node/status indexes.

### 0003_curious_demogoblin

Introduced step attempt telemetry table:

- execution_step_attempts

Added execution/node/status/attempt indexes.

### 0004_tan_titaniumer

Extended retrieval telemetry schema with orchestration fields:

- strategy
- retriever_key
- branch_index
- selected

Added indexes for retriever key and strategy.

### 0005_happy_one_above_all

Extended workflow schema with template provenance:

- source_template_id
- source_template_version
- source_template_params

Added index on `source_template_id`.

## Migration Execution Model

- Migration runner reads `DATABASE_URL`.
- Drizzle migrator applies SQL files from `packages/database/drizzle`.
- Database package script: `db:migrate`.

## Operational Guidance

- Treat migrations as forward-only in shared environments.
- Apply migrations before deploying backend/worker versions that depend on new tables.
- Telemetry tables are optional for degraded mode runtime, but required for full observability features.
