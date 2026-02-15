// ──────────────────────────────────────────────
// REX - MemoryWriteNode
// Writes values into execution-scoped memory
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

const OPERATIONS = ["set", "append", "increment"] as const;
type MemoryWriteOperation = (typeof OPERATIONS)[number];

export const MemoryWriteNode: BaseNodeDefinition = {
  type: "memory-write",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    const memoryKey = typeof config["memoryKey"] === "string" ? config["memoryKey"].trim() : "";
    if (!memoryKey) {
      errors.push("MemoryWriteNode requires 'memoryKey'");
    }

    const operation = typeof config["operation"] === "string" ? config["operation"] : "set";
    if (!OPERATIONS.includes(operation as MemoryWriteOperation)) {
      errors.push(`Invalid operation "${operation}". Valid: ${OPERATIONS.join(", ")}`);
    }

    if (operation === "increment" && config["incrementBy"] !== undefined) {
      const incrementBy = Number(config["incrementBy"]);
      if (!Number.isFinite(incrementBy)) {
        errors.push("incrementBy must be a valid number");
      }
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("MemoryWriteNode: missing nodeConfig in metadata");
    }

    const memoryKey = String(nodeConfig["memoryKey"] ?? "").trim();
    const operation = (nodeConfig["operation"] as MemoryWriteOperation | undefined) ?? "set";
    const outputKey = String(nodeConfig["outputKey"] ?? "_memoryValue");
    const includeInOutput = parseBooleanLike(nodeConfig["includeInOutput"], true);

    const previousValue = context.getMemory(memoryKey);
    const resolvedValue = resolveConfiguredValue(nodeConfig, input.data);
    const nextValue = applyOperation(
      operation,
      previousValue,
      resolvedValue,
      Number(nodeConfig["incrementBy"])
    );

    context.setMemory(memoryKey, nextValue);

    context.logger.info("Execution memory updated", {
      nodeId: context.nodeId,
      memoryKey,
      operation,
      includeInOutput,
    });

    return {
      data: {
        ...input.data,
        ...(includeInOutput ? { [outputKey]: nextValue } : {}),
        _memoryWrite: {
          key: memoryKey,
          operation,
          previousValue,
          nextValue,
          updatedAt: new Date().toISOString(),
        },
      },
    };
  },
};

function resolveConfiguredValue(
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): unknown {
  const valuePath = typeof config["valuePath"] === "string" ? config["valuePath"].trim() : "";
  if (valuePath) {
    return resolvePath(inputData, valuePath);
  }

  const valueTemplate =
    typeof config["valueTemplate"] === "string" ? config["valueTemplate"] : "";
  if (valueTemplate.trim()) {
    return interpolateTemplate(valueTemplate, inputData);
  }

  if (Object.prototype.hasOwnProperty.call(config, "value")) {
    return config["value"];
  }

  return inputData;
}

function resolvePath(
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

function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const value = resolvePath(data, path);
    return String(value ?? `{{${path}}}`);
  });
}

function applyOperation(
  operation: MemoryWriteOperation,
  previousValue: unknown,
  resolvedValue: unknown,
  incrementByRaw: number
): unknown {
  if (operation === "append") {
    if (Array.isArray(previousValue)) {
      return [...previousValue, resolvedValue];
    }
    if (previousValue === undefined) {
      return [resolvedValue];
    }
    return [previousValue, resolvedValue];
  }

  if (operation === "increment") {
    const current =
      typeof previousValue === "number" && Number.isFinite(previousValue)
        ? previousValue
        : Number(previousValue ?? 0);
    const base = Number.isFinite(current) ? current : 0;
    const incrementBy = Number.isFinite(incrementByRaw) ? incrementByRaw : 1;
    return base + incrementBy;
  }

  return resolvedValue;
}

function parseBooleanLike(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}
