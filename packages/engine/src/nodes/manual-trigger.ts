// ──────────────────────────────────────────────
// REX - ManualTriggerNode
// Triggered manually with user-provided payload
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const ManualTriggerNode: BaseNodeDefinition = {
  type: "manual-trigger",

  validate(_config: Record<string, unknown>): ValidationResult {
    return { valid: true, errors: [] };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    context.logger.info("Manual trigger activated", {
      nodeId: context.nodeId,
    });

    return {
      data: { ...input.data },
      metadata: {
        trigger: "manual",
        triggeredAt: new Date().toISOString(),
      },
    };
  },
};
