// ──────────────────────────────────────────────
// REX - ExecutionControlNode
// Mutates execution control state (retries/loops/terminate)
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
  ExecutionContextPatch,
} from "@rex/types";

const CONTROL_ACTIONS = [
  "increment-retry",
  "increment-loop",
  "reset-retry",
  "reset-loop",
  "set-max-retries",
  "set-max-loops",
  "terminate",
  "clear-terminate",
] as const;

type ControlAction = (typeof CONTROL_ACTIONS)[number];

export const ExecutionControlNode: BaseNodeDefinition = {
  type: "execution-control",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const action = typeof config["action"] === "string" ? config["action"] : "increment-retry";

    if (!CONTROL_ACTIONS.includes(action as ControlAction)) {
      errors.push(`Invalid action "${action}". Valid: ${CONTROL_ACTIONS.join(", ")}`);
    }

    if (
      (action === "increment-retry" ||
        action === "increment-loop" ||
        action === "set-max-retries" ||
        action === "set-max-loops") &&
      config["value"] !== undefined
    ) {
      const value = Number(config["value"]);
      if (!Number.isFinite(value)) {
        errors.push("value must be a valid number");
      }
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("ExecutionControlNode: missing nodeConfig in metadata");
    }

    const action = (nodeConfig["action"] as ControlAction | undefined) ?? "increment-retry";
    const current = context.getExecutionContext().control;
    const patch = buildControlPatch(action, current, Number(nodeConfig["value"]));

    context.updateExecutionContext(patch);

    const reason =
      action === "terminate" && typeof nodeConfig["reason"] === "string"
        ? nodeConfig["reason"].trim()
        : "";
    if (reason) {
      context.setMemory("control.terminateReason", reason);
    }

    const next = context.getExecutionContext().control;

    context.logger.info("Execution control updated", {
      nodeId: context.nodeId,
      action,
      patch: patch.control,
      reason: reason || undefined,
    });

    return {
      data: {
        ...input.data,
        _control: {
          action,
          reason: reason || null,
          state: next,
          updatedAt: new Date().toISOString(),
        },
      },
    };
  },
};

function buildControlPatch(
  action: ControlAction,
  current: {
    loopCount: number;
    retryCount: number;
    maxLoops: number;
    maxRetries: number;
    terminate: boolean;
  },
  valueRaw: number
): ExecutionContextPatch {
  const value = Number.isFinite(valueRaw) ? Math.max(0, Math.floor(valueRaw)) : 1;

  switch (action) {
    case "increment-retry":
      return { control: { retryCount: current.retryCount + value } };
    case "increment-loop":
      return { control: { loopCount: current.loopCount + value } };
    case "reset-retry":
      return { control: { retryCount: 0 } };
    case "reset-loop":
      return { control: { loopCount: 0 } };
    case "set-max-retries":
      return { control: { maxRetries: Math.max(1, value) } };
    case "set-max-loops":
      return { control: { maxLoops: Math.max(1, value) } };
    case "terminate":
      return { control: { terminate: true } };
    case "clear-terminate":
      return { control: { terminate: false } };
    default:
      return {};
  }
}
