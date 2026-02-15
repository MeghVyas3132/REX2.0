// ──────────────────────────────────────────────
// REX - EvaluationNode
// Evaluates node output quality and can request retry
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

interface EvaluationCheckResult {
  key: string;
  passed: boolean;
  message: string;
}

export const EvaluationNode: BaseNodeDefinition = {
  type: "evaluation",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (config["valuePath"] !== undefined && typeof config["valuePath"] !== "string") {
      errors.push("valuePath must be a string");
    }

    if (config["requiredText"] !== undefined && typeof config["requiredText"] !== "string") {
      errors.push("requiredText must be a string");
    }

    if (config["minLength"] !== undefined) {
      const minLength = Number(config["minLength"]);
      if (!Number.isFinite(minLength) || minLength < 1) {
        errors.push("minLength must be a positive number");
      }
    }

    if (config["maxLength"] !== undefined) {
      const maxLength = Number(config["maxLength"]);
      if (!Number.isFinite(maxLength) || maxLength < 1) {
        errors.push("maxLength must be a positive number");
      }
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("EvaluationNode: missing nodeConfig in metadata");
    }

    const valuePath =
      typeof nodeConfig["valuePath"] === "string" && nodeConfig["valuePath"].trim().length > 0
        ? nodeConfig["valuePath"].trim()
        : "content";
    const value = resolvePath(input.data, valuePath);
    const text = stringifyValue(value);
    const checks: EvaluationCheckResult[] = [];

    const requiredText =
      typeof nodeConfig["requiredText"] === "string" ? nodeConfig["requiredText"].trim() : "";
    if (requiredText.length > 0) {
      const passed = text.toLowerCase().includes(requiredText.toLowerCase());
      checks.push({
        key: "requiredText",
        passed,
        message: passed
          ? `Required text "${requiredText}" found`
          : `Required text "${requiredText}" not found`,
      });
    }

    const minLength = toPositiveInteger(nodeConfig["minLength"]);
    if (minLength !== null) {
      const passed = text.length >= minLength;
      checks.push({
        key: "minLength",
        passed,
        message: passed
          ? `Length ${text.length} meets minimum ${minLength}`
          : `Length ${text.length} below minimum ${minLength}`,
      });
    }

    const maxLength = toPositiveInteger(nodeConfig["maxLength"]);
    if (maxLength !== null) {
      const passed = text.length <= maxLength;
      checks.push({
        key: "maxLength",
        passed,
        message: passed
          ? `Length ${text.length} within maximum ${maxLength}`
          : `Length ${text.length} exceeds maximum ${maxLength}`,
      });
    }

    const totalChecks = checks.length;
    const passedChecks = checks.filter((check) => check.passed).length;
    const passed = totalChecks === 0 ? text.length > 0 : passedChecks === totalChecks;
    const score = totalChecks === 0 ? (passed ? 100 : 0) : Math.round((passedChecks / totalChecks) * 100);

    const requestRetryOnFail = parseBooleanLike(nodeConfig["requestRetryOnFail"], false);
    const strict = parseBooleanLike(nodeConfig["strict"], false);
    const retryDelayMs = clampInt(nodeConfig["retryDelayMs"], 0, 10_000, 0);
    const reasonPrefix =
      typeof nodeConfig["retryReasonPrefix"] === "string"
        ? nodeConfig["retryReasonPrefix"].trim()
        : "Evaluation failed";
    const failureReason = checks.find((check) => !check.passed)?.message ?? "Evaluation failed";

    if (!passed && strict) {
      throw new Error(failureReason);
    }

    const retryMetadata =
      !passed && requestRetryOnFail
        ? {
            requested: true,
            reason: `${reasonPrefix}: ${failureReason}`,
            delayMs: retryDelayMs > 0 ? retryDelayMs : undefined,
          }
        : undefined;

    context.logger.info("Evaluation completed", {
      nodeId: context.nodeId,
      valuePath,
      passed,
      score,
      totalChecks,
      passedChecks,
      requestRetryOnFail,
    });

    return {
      data: {
        ...input.data,
        _evaluation: {
          valuePath,
          passed,
          score,
          totalChecks,
          passedChecks,
          checks,
          evaluatedAt: new Date().toISOString(),
        },
      },
      metadata: {
        retry: retryMetadata,
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
    } else {
      return undefined;
    }
  }

  return value;
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const normalized = Math.floor(parsed);
    return normalized > 0 ? normalized : null;
  }
  return null;
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

function parseBooleanLike(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}
