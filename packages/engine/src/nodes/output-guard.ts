// ──────────────────────────────────────────────
// REX - OutputGuardNode
// Post-LLM safety and format checks
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";
import { detectPII, detectToxicity, redactPII } from "@rex/utils";

export const OutputGuardNode: BaseNodeDefinition = {
  type: "output-guard",

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
      throw new Error("OutputGuardNode: missing nodeConfig in metadata");
    }

    const valuePath = asString(nodeConfig["valuePath"]) ?? "content";
    const outputKey = asString(nodeConfig["outputKey"]) ?? "_guardedOutput";
    const blockOnToxicity = asBoolean(nodeConfig["blockOnToxicity"], true);
    const blockOnPII = asBoolean(nodeConfig["blockOnPII"], false);
    const requireJson = asBoolean(nodeConfig["requireJson"], false);
    const redactPIIEnabled = asBoolean(nodeConfig["redactPII"], false);

    const sourceValue = resolvePath(input.data, valuePath);
    const sourceText = toText(sourceValue);
    const toxicityMatches = detectToxicity(sourceText);
    const piiMatches = detectPII(sourceText);
    const hasToxicity = toxicityMatches.length > 0;
    const hasPII = piiMatches.length > 0;
    const sanitizedText = redactPIIEnabled ? redactPII(sourceText) : sourceText;

    if (requireJson) {
      try {
        JSON.parse(sourceText);
      } catch {
        throw new Error("Output guard blocked output: expected valid JSON");
      }
    }
    if (hasToxicity && blockOnToxicity) {
      throw new Error("Output guard blocked toxic output");
    }
    if (hasPII && blockOnPII) {
      throw new Error("Output guard blocked PII in output");
    }

    const guardState = {
      stage: "output",
      triggered: hasToxicity || hasPII,
      blocked: false,
      hasToxicity,
      hasPII,
      toxicityMatches,
      piiMatches,
      redacted: redactPIIEnabled && hasPII,
      jsonRequired: requireJson,
      timestamp: new Date().toISOString(),
    };

    context.logger.info("Output guard evaluated", {
      nodeId: context.nodeId,
      hasToxicity,
      hasPII,
      redacted: guardState.redacted,
      requireJson,
    });

    return {
      data: {
        ...input.data,
        [outputKey]: sanitizedText,
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
