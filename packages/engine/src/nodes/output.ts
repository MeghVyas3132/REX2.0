// ──────────────────────────────────────────────
// REX - OutputNode
// Terminal node that marks the final workflow output
// Collects and structures all upstream data
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const OutputNode: BaseNodeDefinition = {
  type: "output",

  validate(_config: Record<string, unknown>): ValidationResult {
    return { valid: true, errors: [] };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    context.logger.info("Workflow output collected", {
      nodeId: context.nodeId,
      outputKeys: Object.keys(input.data),
    });

    return {
      data: {
        ...input.data,
        _output: {
          collectedAt: new Date().toISOString(),
          executionId: context.executionId,
          workflowId: context.workflowId,
        },
      },
    };
  },
};
