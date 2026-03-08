// ──────────────────────────────────────────────
// REX - InputGuardNode
// Pre-LLM guardrail checks and sanitization
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";
import { detectPII, detectPromptInjection, redactPII } from "@rex/utils";

export const InputGuardNode: BaseNodeDefinition = {
  type: "input-guard",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    if (config["valuePath"] !== undefined && typeof config["valuePath"] !== "string") {
      errors.push("valuePath must be a string");
    }
    if (config["outputKey"] !== undefined && typeof config["outputKey"] !== "string") {
      errors.push("outputKey must be a string");
    }
    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("InputGuardNode: missing nodeConfig in metadata");
    }

    const valuePath = asString(nodeConfig["valuePath"]) ?? "";
    const outputKey = asString(nodeConfig["outputKey"]) ?? "_guardedInput";
    const blockOnPromptInjection = asBoolean(nodeConfig["blockOnPromptInjection"], true);
    const blockOnPII = asBoolean(nodeConfig["blockOnPII"], false);
    const redactPIIEnabled = asBoolean(nodeConfig["redactPII"], true);

    const sourceValue = valuePath ? resolvePath(input.data, valuePath) : input.data;
    const sourceText = toText(sourceValue);
    const promptInjectionMatches = detectPromptInjection(sourceText);
    const piiMatches = detectPII(sourceText);
    const hasPromptInjection = promptInjectionMatches.length > 0;
    const hasPII = piiMatches.length > 0;
    const sanitized = redactPIIEnabled ? redactPII(sourceText) : sourceText;

    if (hasPromptInjection && blockOnPromptInjection) {
      throw new Error(
        `Input guard blocked prompt injection pattern: ${promptInjectionMatches[0]?.match ?? "unknown"}`
      );
    }
    if (hasPII && blockOnPII) {
      throw new Error("Input guard blocked detected PII");
    }

    const guardState = {
      stage: "input",
      triggered: hasPromptInjection || hasPII,
      blocked: false,
      hasPromptInjection,
      hasPII,
      promptInjectionMatches,
      piiMatches,
      redacted: redactPIIEnabled && hasPII,
      timestamp: new Date().toISOString(),
    };

    context.logger.info("Input guard evaluated", {
      nodeId: context.nodeId,
      hasPromptInjection,
      hasPII,
      redacted: guardState.redacted,
    });

    return {
      data: {
        ...input.data,
        [outputKey]: sanitized,
        _guard: guardState,
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

function toText(value: unknown): string {
  if (typeof value === "string") return value;
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
