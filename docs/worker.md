# Worker Runtime

## Role

`apps/worker` is the execution plane. It consumes BullMQ jobs and runs workflow/knowledge runtime logic.

## Job Types

- `execute-workflow`
- `ingest-knowledge-document`

## Execution Runtime Flow

1. Load execution and validate it is runnable.
2. Validate execution authorization token (`execution_authorizations`).
3. Load workflow graph and resolve domain config overlays.
4. Apply runtime defaults to node configs.
5. Execute graph through `@rex/engine`.
6. Persist execution telemetry:
   - `execution_steps`
   - `execution_step_attempts`
   - `execution_context_snapshots`
   - `execution_retrieval_events`
   - `guardrail_events`
7. Finalize execution status.
8. Evaluate alert rules and persist `alert_events` when thresholds are breached.

## Retrieval Runtime

Retrieval pipeline supports:

- scoped corpus filtering
- embedding-based candidate scoring
- lexical scoring
- optional reranking

Embedding/reranking behavior is configured from resolved domain config and can use deterministic fallback when provider keys are unavailable.

## Ingestion Runtime

Document ingestion pipeline:

1. Move document to `processing`
2. Chunk by page boundary (`\f`) and text windows
3. Generate embeddings (provider or deterministic fallback)
4. Persist both JSON embedding and pgvector literal
5. Persist `page_number` and `section_path` metadata
6. Set document/corpus status to `ready` or `failed`

## Failure Behavior

- Failed execution jobs are rethrown for BullMQ retry policy.
- Optional table availability issues are logged and handled in degraded mode where safe.
- Authorization failures fail execution and prevent node runtime.

## Operational Controls

- Concurrency from environment (`WORKER_CONCURRENCY`)
- Retrieval budgets from environment (`RETRIEVAL_MAX_*`)
- Job retention limits configured in worker queue setup
