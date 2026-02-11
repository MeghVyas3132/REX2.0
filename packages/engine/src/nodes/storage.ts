// ──────────────────────────────────────────────
// REX - StorageNode
// Persists data to execution context / marks for storage
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const StorageNode: BaseNodeDefinition = {
  type: "storage",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["storageKey"]) {
      errors.push("StorageNode requires a 'storageKey' in config");
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    const storageKey = (nodeConfig?.["storageKey"] as string) ?? "default";

    context.logger.info("Storing execution data", {
      nodeId: context.nodeId,
      storageKey,
      dataKeys: Object.keys(input.data),
    });

    // In MVP, storage is persisting to the execution step output.
    // Future: external storage (S3, Redis, custom DB table)
    return {
      data: {
        stored: true,
        storageKey,
        payload: input.data,
        storedAt: new Date().toISOString(),
      },
    };
  },
};
