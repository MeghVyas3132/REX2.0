// ──────────────────────────────────────────────
// REX - MemoryReadNode
// Reads values from execution-scoped memory
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const MemoryReadNode: BaseNodeDefinition = {
  type: "memory-read",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    const memoryKey = typeof config["memoryKey"] === "string" ? config["memoryKey"].trim() : "";
    if (!memoryKey) {
      errors.push("MemoryReadNode requires 'memoryKey'");
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("MemoryReadNode: missing nodeConfig in metadata");
    }

    const memoryKey = String(nodeConfig["memoryKey"] ?? "").trim();
    const outputKey = String(nodeConfig["outputKey"] ?? "_memoryValue");
    const required = parseBooleanLike(nodeConfig["required"], false);
    const hasDefault = Object.prototype.hasOwnProperty.call(nodeConfig, "defaultValue");

    const value = context.getMemory(memoryKey);
    const found = value !== undefined;

    if (!found && required && !hasDefault) {
      throw new Error(`Execution memory key "${memoryKey}" was not found`);
    }

    const resolvedValue = found ? value : nodeConfig["defaultValue"];

    context.logger.info("Execution memory read", {
      nodeId: context.nodeId,
      memoryKey,
      found,
      required,
    });

    return {
      data: {
        ...input.data,
        [outputKey]: resolvedValue,
        _memoryRead: {
          key: memoryKey,
          found,
          usedDefault: !found && hasDefault,
          readAt: new Date().toISOString(),
        },
      },
    };
  },
};

function parseBooleanLike(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}
