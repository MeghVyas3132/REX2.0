// ──────────────────────────────────────────────
// REX - JSONSimplifyNode
// Flattens complex payloads for retrieval/LLM
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";
import { flattenJson } from "@rex/utils";

export const JSONSimplifyNode: BaseNodeDefinition = {
  type: "json-simplify",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    if (config["inputPath"] !== undefined && typeof config["inputPath"] !== "string") {
      errors.push("inputPath must be a string");
    }
    if (config["outputKey"] !== undefined && typeof config["outputKey"] !== "string") {
      errors.push("outputKey must be a string");
    }
    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("JSONSimplifyNode: missing nodeConfig in metadata");
    }

    const inputPath = asString(nodeConfig["inputPath"]) ?? "";
    const outputKey = asString(nodeConfig["outputKey"]) ?? "_jsonSimplified";
    const maxDepth = clampInt(nodeConfig["maxDepth"], 1, 12, 6);
    const includeArrays = asBoolean(nodeConfig["includeArrays"], true);

    const source = inputPath ? resolvePath(input.data, inputPath) : input.data;
    const simplified = flattenJson(source, { maxDepth, includeArrays });
    const asText = Object.entries(simplified)
      .map(([key, value]) => `${key}: ${stringifyValue(value)}`)
      .join("\n");

    context.logger.info("JSON simplification completed", {
      nodeId: context.nodeId,
      inputPath: inputPath || null,
      keys: Object.keys(simplified).length,
      maxDepth,
      includeArrays,
    });

    return {
      data: {
        ...input.data,
        [outputKey]: simplified,
        _jsonSimplifiedText: asText,
      },
    };
  },
};

function resolvePath(data: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = data;
  for (const key of keys) {
    if (value !== null && typeof value === "object") {
      value = (value as Record<string, unknown>)[key];
      continue;
    }
    return undefined;
  }
  return value;
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Math.floor(value)));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(max, Math.floor(parsed)));
    }
  }
  return fallback;
}
