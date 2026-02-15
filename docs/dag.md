# DAG Validation and Scheduling

## Validator Role

The DAG validator ensures workflows are executable and cycle-free before runtime execution starts.

## Validation Rules

- Every edge source and target must reference an existing node.
- Self-loop edges are invalid.
- Graph must be acyclic.

## Algorithm

Topological sorting uses Kahn's algorithm:

1. Build adjacency map and in-degree counts.
2. Queue nodes with in-degree zero.
3. Iteratively pop queue, append to execution order, reduce neighbor in-degrees.
4. If processed node count does not match graph node count, graph contains a cycle.

## Output

Validator returns:

- `valid` flag
- `executionOrder` list of node IDs for runtime
- `errors` list when invalid

## Runtime Scheduling Layer

After DAG validation, engine builds execution waves from topological order and parent dependencies.

- A wave contains nodes whose prerequisites are satisfied.
- Waves preserve topological correctness.
- Wave metadata is written into execution context knowledge for observability.

## Conditional Routing

Execution includes conditional edge evaluation during parent output resolution.

- Unsatisfied branch conditions mark downstream nodes as `skipped`.
- Branch skips are deterministic based on recorded parent outputs.

## Compatibility Constraints

- Any template-generated workflow must still satisfy DAG constraints.
- Loop-like behavior must be modeled through retry/evaluation controls, not cyclic edges.
