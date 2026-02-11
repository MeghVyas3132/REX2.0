// ──────────────────────────────────────────────
// REX - WebhookTriggerNode
// Receives external HTTP POST data as workflow input
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const WebhookTriggerNode: BaseNodeDefinition = {
  type: "webhook-trigger",

  validate(_config: Record<string, unknown>): ValidationResult {
    // Webhook trigger accepts any config — the actual payload comes at runtime
    return { valid: true, errors: [] };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    context.logger.info("Webhook trigger activated", {
      nodeId: context.nodeId,
      hasData: Object.keys(input.data).length > 0,
    });

    return {
      data: { ...input.data },
      metadata: {
        trigger: "webhook",
        receivedAt: new Date().toISOString(),
      },
    };
  },
};
