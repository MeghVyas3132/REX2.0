// ──────────────────────────────────────────────
// REX - TransformerNode
// Transforms input data using mapping expressions
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const TransformerNode: BaseNodeDefinition = {
  type: "transformer",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["expression"] && !config["mappings"]) {
      errors.push(
        "TransformerNode requires either 'expression' (JS) or 'mappings' (field mapping object) in config"
      );
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("TransformerNode: missing nodeConfig in metadata");
    }

    context.logger.info("Transforming data", {
      nodeId: context.nodeId,
      inputKeys: Object.keys(input.data),
    });

    // Mode 1: JavaScript expression
    if (nodeConfig["expression"]) {
      const expression = nodeConfig["expression"] as string;

      try {
        const fn = new Function(
          "data",
          "input",
          `"use strict"; return (${expression});`
        );
        const result = fn(input.data, input.data);

        const outputData: Record<string, unknown> =
          result !== null && typeof result === "object" && !Array.isArray(result)
            ? (result as Record<string, unknown>)
            : { result };

        context.logger.info("Expression transform completed", {
          nodeId: context.nodeId,
          outputKeys: Object.keys(outputData),
        });

        return { data: outputData };
      } catch (err) {
        throw new Error(
          `Transform expression failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Mode 2: Field mappings { outputField: "input.field.path" }
    if (nodeConfig["mappings"]) {
      const mappings = nodeConfig["mappings"] as Record<string, string>;
      const outputData: Record<string, unknown> = {};

      for (const [outputKey, inputPath] of Object.entries(mappings)) {
        outputData[outputKey] = resolveField(input.data, inputPath);
      }

      context.logger.info("Mapping transform completed", {
        nodeId: context.nodeId,
        mappedFields: Object.keys(outputData),
      });

      return { data: outputData };
    }

    // Passthrough if no transform configured
    return { data: { ...input.data } };
  },
};

function resolveField(
  data: Record<string, unknown>,
  path: string
): unknown {
  const keys = path.split(".");
  let value: unknown = data;
  for (const key of keys) {
    if (value !== null && typeof value === "object") {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return value;
}
