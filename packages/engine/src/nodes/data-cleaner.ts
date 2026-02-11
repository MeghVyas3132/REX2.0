// ──────────────────────────────────────────────
// REX - DataCleanerNode
// Applies cleaning operations to input data
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
  CleaningConfig,
  CleaningOperation,
} from "@rex/types";
import { cleanData } from "@rex/utils";

const VALID_OPERATIONS: CleaningOperation[] = [
  "trim",
  "normalize-case",
  "remove-special-chars",
  "remove-duplicates",
  "validate-json",
  "mask-pii",
];

export const DataCleanerNode: BaseNodeDefinition = {
  type: "data-cleaner",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["operations"] || !Array.isArray(config["operations"])) {
      errors.push("DataCleaner requires an 'operations' array in config");
      return { valid: false, errors };
    }

    const ops = config["operations"] as string[];
    for (const op of ops) {
      if (!VALID_OPERATIONS.includes(op as CleaningOperation)) {
        errors.push(
          `Invalid cleaning operation: "${op}". Valid operations: ${VALID_OPERATIONS.join(", ")}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const config = input.metadata?.["nodeConfig"] as CleaningConfig | undefined;
    if (!config) {
      throw new Error("DataCleanerNode: missing cleaning config in metadata.nodeConfig");
    }

    context.logger.info("Starting data cleaning", {
      nodeId: context.nodeId,
      operations: config.operations,
    });

    const result = cleanData(input.data, config);

    context.logger.info("Data cleaning completed", {
      nodeId: context.nodeId,
      operationsApplied: result.operationsApplied,
      piiFound: result.piiFound?.length ?? 0,
    });

    return {
      data: {
        cleaned: result.cleaned,
        operationsApplied: result.operationsApplied,
        piiFound: result.piiFound ?? [],
      },
    };
  },
};
