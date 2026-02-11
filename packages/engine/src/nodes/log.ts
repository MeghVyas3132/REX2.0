// ──────────────────────────────────────────────
// REX - LogNode
// Writes structured log entry for observability
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const LogNode: BaseNodeDefinition = {
  type: "log",

  validate(config: Record<string, unknown>): ValidationResult {
    const validLevels = ["info", "warn", "error", "debug"];
    const level = config["level"] as string | undefined;
    if (level && !validLevels.includes(level)) {
      return {
        valid: false,
        errors: [`Invalid log level: "${level}". Valid: ${validLevels.join(", ")}`],
      };
    }
    return { valid: true, errors: [] };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    const level = (nodeConfig?.["level"] as string) ?? "info";
    const message = (nodeConfig?.["message"] as string) ?? "Workflow log entry";

    const logData = {
      nodeId: context.nodeId,
      executionId: context.executionId,
      workflowId: context.workflowId,
      inputKeys: Object.keys(input.data),
      dataSnapshot: input.data,
    };

    switch (level) {
      case "warn":
        context.logger.warn(message, logData);
        break;
      case "error":
        context.logger.error(message, logData);
        break;
      case "debug":
        context.logger.debug(message, logData);
        break;
      default:
        context.logger.info(message, logData);
    }

    return {
      data: {
        logged: true,
        level,
        message,
        timestamp: new Date().toISOString(),
      },
    };
  },
};
