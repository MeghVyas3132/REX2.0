# Execution Engine

## Engine Role

`@rex/engine` is pure domain logic. It validates DAG correctness, resolves node implementations, executes nodes with deterministic order guarantees, and produces execution telemetry.

## Core Input Contract

`executeWorkflow` receives:

- Execution metadata: execution ID, workflow ID, user ID
- Workflow graph: nodes and edges
- Trigger payload
- Runtime providers:
  - API key resolver
  - optional retrieval function
  - optional ingestion function
- Hooks:
  - step start
  - step complete
  - context update
  - retrieval event

## Execution Context Model

The engine maintains mutable context state during a run:

- `memory`: execution-time short-term memory and node communication keys
- `knowledge`: retrieval-related state and scheduler metadata
- `control`: loop/retry/termination counters and guardrails
- `retrieval`: retrieval budget counters and limits
- `runtime`: active node and timing metadata

Context can be read and patched by node implementations via `NodeExecutionContext` helpers.

## Node Execution Lifecycle

1. Validate graph as DAG.
2. Build parent-output map.
3. Plan topological execution waves.
4. For each node:
   - Validate node config.
   - Resolve merged parent outputs.
   - Apply branch-condition skip rules.
   - Optionally execute retrieval injection path (engine-level retrieval config).
   - Build `NodeInput` and `NodeExecutionContext`.
   - Execute with retry policy.
   - Apply context patches returned by node metadata.
   - Persist retry outcome metadata.
5. Emit final context snapshot and execution result.

## Retry and Loop Controls

- Node retry policies support:
  - retry on errors
  - retry on explicit retry directives
  - max attempts
  - retry delay
- Execution-level control tracks retry and loop counters and can terminate execution early when limits are exceeded.

## Branching and Edge Conditions

Edge conditions are evaluated against parent outputs and route metadata. Unsupported or unsatisfied branches result in node skip status rather than failure.

## Retrieval Orchestration

`knowledge-retrieve` node supports multiple strategies:

- single
- first-non-empty
- merge
- best-score
- adaptive

Engine enforces retrieval budgets and records retrieval telemetry for every attempt.

## Ingestion Orchestration

`knowledge-ingest` node calls runtime ingestion callback and can persist active corpus state into execution memory for downstream nodes.

## Determinism Guarantees

- DAG topological ordering is deterministic for a given graph and queue order.
- Wave planning respects topological constraints even when wave members are parallel candidates.
- Failed nodes can terminate downstream path with deterministic skipped-step handling.

## Exported Runtime Nodes

Registered built-in node families include:

- Triggers
- Action nodes (LLM, HTTP, transformer, code, file upload)
- Logic nodes (condition, validator, data cleaner)
- Output/log/storage
- Memory and execution-control nodes
- Evaluation node
- Knowledge ingestion/retrieval nodes
