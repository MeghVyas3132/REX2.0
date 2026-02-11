// ──────────────────────────────────────────────
// REX - ScheduleTriggerNode
// Triggered by a cron/interval schedule
// At execution time, just records metadata
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const ScheduleTriggerNode: BaseNodeDefinition = {
  type: "schedule-trigger",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["cron"] && !config["intervalMs"]) {
      errors.push(
        "ScheduleTriggerNode requires either 'cron' expression or 'intervalMs' in config"
      );
    }

    if (config["cron"]) {
      const cron = config["cron"] as string;
      const parts = cron.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) {
        errors.push(
          "Invalid cron expression. Expected 5 or 6 fields (minute hour day month weekday [year])"
        );
      }
    }

    if (config["intervalMs"]) {
      const interval = config["intervalMs"] as number;
      if (typeof interval !== "number" || interval < 60000) {
        errors.push("intervalMs must be a number >= 60000 (1 minute minimum)");
      }
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;

    context.logger.info("Schedule trigger activated", {
      nodeId: context.nodeId,
      cron: nodeConfig?.["cron"],
      intervalMs: nodeConfig?.["intervalMs"],
    });

    return {
      data: { ...input.data },
      metadata: {
        trigger: "schedule",
        triggeredAt: new Date().toISOString(),
        cron: nodeConfig?.["cron"],
        intervalMs: nodeConfig?.["intervalMs"],
      },
    };
  },
};
