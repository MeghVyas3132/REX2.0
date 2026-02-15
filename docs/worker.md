# Worker Runtime

## Service Role

The worker is the execution plane for REX. It consumes BullMQ jobs, runs workflow execution through the engine, and persists runtime telemetry.

## Runtime Stack

- Queue consumer: BullMQ Worker
- Domain runtime: `@rex/engine`
- Persistence: Drizzle ORM with PostgreSQL

## Job Types

- `execute-workflow`
  - Executes a workflow DAG for a specific execution record.
- `ingest-knowledge-document`
  - Processes queued document ingestion into chunks and embeddings.

## Execution Job Lifecycle

1. Mark execution `running` and set `startedAt`.
2. Load workflow graph from DB.
3. Resolve provider API keys for node runtime use.
4. Execute graph via engine with runtime callbacks:
   - `onStepComplete`: persist execution step row.
   - `onContextUpdate`: persist execution context snapshots.
   - `onRetrievalEvent`: persist retrieval attempt events.
   - `retrieveKnowledge`: runtime retrieval function.
   - `ingestKnowledge`: runtime ingestion function.
5. Mark execution `completed` or `failed` with finish timestamp and error message.

## Persistence During Execution

- `execution_steps`
  - One row per node execution/skipped/failure result.
- `execution_step_attempts`
  - Per-attempt retry metadata derived from step output metadata.
- `execution_context_snapshots`
  - Ordered snapshots (`sequence`) of mutable execution context.
- `execution_retrieval_events`
  - Per retrieval branch/attempt telemetry.

## Knowledge Query Runtime

- Scopes corpora by user and optional scope dimensions.
- Loads candidate chunks and computes ranking via deterministic embedding similarity.
- Returns top-K matches to engine/runtime node.

## Runtime Ingestion Path

- Resolves existing scoped corpus or creates a runtime corpus.
- Writes document as `processing`.
- Chunks content and computes deterministic embeddings.
- Persists chunk rows and marks document/corpus status.

## Error Handling and Retries

- Execution job failures are rethrown for BullMQ retry policy.
- Missing optional telemetry tables are handled with warnings and graceful continuation.
- Knowledge ingestion marks document/corpus failed on processing errors.

## Operational Notes

- Node registry is initialized once at worker module load.
- Worker concurrency is configurable via environment variable.
- Removal policies keep successful and failed jobs bounded in Redis.
