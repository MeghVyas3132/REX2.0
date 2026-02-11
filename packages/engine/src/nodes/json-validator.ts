// ──────────────────────────────────────────────
// REX - JSONValidatorNode
// Validates data against a JSON structure/schema
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const JSONValidatorNode: BaseNodeDefinition = {
  type: "json-validator",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["schema"] && !config["requiredFields"]) {
      errors.push(
        "JSONValidatorNode requires 'schema' object or 'requiredFields' array in config"
      );
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("JSONValidatorNode: missing nodeConfig in metadata");
    }

    const dataToValidate = input.data;
    const validationErrors: string[] = [];

    // Check required fields
    const requiredFields = nodeConfig["requiredFields"] as string[] | undefined;
    if (requiredFields) {
      for (const field of requiredFields) {
        if (!(field in dataToValidate)) {
          validationErrors.push(`Missing required field: "${field}"`);
        }
      }
    }

    // Check field types
    const fieldTypes = nodeConfig["fieldTypes"] as Record<string, string> | undefined;
    if (fieldTypes) {
      for (const [field, expectedType] of Object.entries(fieldTypes)) {
        const value = dataToValidate[field];
        if (value !== undefined && typeof value !== expectedType) {
          validationErrors.push(
            `Field "${field}" expected type "${expectedType}", got "${typeof value}"`
          );
        }
      }
    }

    // String JSON validation
    if (typeof dataToValidate["json"] === "string") {
      try {
        JSON.parse(dataToValidate["json"] as string);
      } catch {
        validationErrors.push("Field 'json' contains invalid JSON string");
      }
    }

    const isValid = validationErrors.length === 0;

    context.logger.info("JSON validation completed", {
      nodeId: context.nodeId,
      valid: isValid,
      errorCount: validationErrors.length,
    });

    if (!isValid && nodeConfig["strict"] === true) {
      throw new Error(
        `JSON validation failed: ${validationErrors.join("; ")}`
      );
    }

    return {
      data: {
        ...dataToValidate,
        _validation: {
          valid: isValid,
          errors: validationErrors,
        },
      },
    };
  },
};
