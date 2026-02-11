// ──────────────────────────────────────────────
// REX - ConditionNode
// Evaluates a condition and passes data through
// with a result flag for downstream branching
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const ConditionNode: BaseNodeDefinition = {
  type: "condition",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["field"]) {
      errors.push("ConditionNode requires a 'field' path in config");
    }

    const validOperators = [
      "equals",
      "not_equals",
      "contains",
      "not_contains",
      "greater_than",
      "less_than",
      "greater_than_or_equal",
      "less_than_or_equal",
      "is_empty",
      "is_not_empty",
      "exists",
      "not_exists",
    ];
    const operator = config["operator"] as string | undefined;
    if (operator && !validOperators.includes(operator)) {
      errors.push(
        `Invalid operator: "${operator}". Valid: ${validOperators.join(", ")}`
      );
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("ConditionNode: missing nodeConfig in metadata");
    }

    const field = nodeConfig["field"] as string;
    const operator = (nodeConfig["operator"] as string) ?? "equals";
    const expectedValue = nodeConfig["value"];

    // Resolve field value from input data using dot notation
    const actualValue = resolveField(input.data, field);

    const result = evaluateCondition(actualValue, operator, expectedValue);

    context.logger.info("Condition evaluated", {
      nodeId: context.nodeId,
      field,
      operator,
      result,
    });

    return {
      data: {
        ...input.data,
        _condition: {
          field,
          operator,
          expected: expectedValue,
          actual: actualValue,
          result,
        },
      },
      metadata: {
        conditionResult: result,
      },
    };
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

function evaluateCondition(
  actual: unknown,
  operator: string,
  expected: unknown
): boolean {
  switch (operator) {
    case "equals":
      return String(actual) === String(expected);

    case "not_equals":
      return String(actual) !== String(expected);

    case "contains":
      return String(actual).includes(String(expected));

    case "not_contains":
      return !String(actual).includes(String(expected));

    case "greater_than":
      return Number(actual) > Number(expected);

    case "less_than":
      return Number(actual) < Number(expected);

    case "greater_than_or_equal":
      return Number(actual) >= Number(expected);

    case "less_than_or_equal":
      return Number(actual) <= Number(expected);

    case "is_empty":
      return (
        actual === null ||
        actual === undefined ||
        actual === "" ||
        (Array.isArray(actual) && actual.length === 0)
      );

    case "is_not_empty":
      return !(
        actual === null ||
        actual === undefined ||
        actual === "" ||
        (Array.isArray(actual) && actual.length === 0)
      );

    case "exists":
      return actual !== undefined && actual !== null;

    case "not_exists":
      return actual === undefined || actual === null;

    default:
      return false;
  }
}
