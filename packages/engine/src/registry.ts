// ──────────────────────────────────────────────
// REX - Node Registry
// Dynamic registration and resolution of nodes
// ──────────────────────────────────────────────

import type { BaseNodeDefinition } from "@rex/types";

const registry = new Map<string, BaseNodeDefinition>();

export function registerNode(node: BaseNodeDefinition): void {
  if (registry.has(node.type)) {
    throw new Error(`Node type "${node.type}" is already registered`);
  }
  registry.set(node.type, node);
}

export function resolveNode(type: string): BaseNodeDefinition {
  const node = registry.get(type);
  if (!node) {
    throw new Error(
      `Unknown node type "${type}". Available types: ${Array.from(registry.keys()).join(", ")}`
    );
  }
  return node;
}

export function getRegisteredNodeTypes(): string[] {
  return Array.from(registry.keys());
}

export function isNodeRegistered(type: string): boolean {
  return registry.has(type);
}

export function clearRegistry(): void {
  registry.clear();
}
