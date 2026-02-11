// ──────────────────────────────────────────────
// REX - DAG Validator
// Ensures workflow graph is a valid DAG (no cycles)
// and resolves topological execution order
// ──────────────────────────────────────────────

import type { WorkflowNode, WorkflowEdge } from "@rex/types";

export interface DAGValidationResult {
  valid: boolean;
  executionOrder: string[];
  errors: string[];
}

export function validateDAG(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): DAGValidationResult {
  const errors: string[] = [];

  // Build adjacency list and in-degree map
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, []);
    inDegree.set(nodeId, 0);
  }

  // Validate edges reference existing nodes
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge "${edge.id}" references unknown source node "${edge.source}"`);
      continue;
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge "${edge.id}" references unknown target node "${edge.target}"`);
      continue;
    }
    if (edge.source === edge.target) {
      errors.push(`Edge "${edge.id}" creates a self-loop on node "${edge.source}"`);
      continue;
    }

    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  if (errors.length > 0) {
    return { valid: false, executionOrder: [], errors };
  }

  // Kahn's algorithm for topological sort + cycle detection
  const queue: string[] = [];
  const executionOrder: string[] = [];

  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    executionOrder.push(current);

    const neighbors = adjacency.get(current) ?? [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (executionOrder.length !== nodeIds.size) {
    errors.push(
      "Workflow contains a cycle. Workflows must be directed acyclic graphs (DAG)."
    );
    return { valid: false, executionOrder: [], errors };
  }

  return { valid: true, executionOrder, errors: [] };
}
