// ──────────────────────────────────────────────
// REX - Schedule Service
// Polls for workflows with schedule-trigger nodes
// and enqueues executions on their cron/interval
// ──────────────────────────────────────────────

import { eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { workflows } from "@rex/database";
import { createLogger } from "@rex/utils";
import type { ExecutionService } from "./execution.service.js";
import type { WorkflowNode } from "@rex/types";

const logger = createLogger("scheduler");

interface ScheduleEntry {
  workflowId: string;
  userId: string;
  cron?: string;
  intervalMs?: number;
  lastRunAt: number;
}

export function startScheduler(
  db: Database,
  executionService: ExecutionService
): void {
  const scheduleMap = new Map<string, ScheduleEntry>();
  const CHECK_INTERVAL = 30000; // Check every 30 seconds

  logger.info("Scheduler started");

  async function checkSchedules(): Promise<void> {
    try {
      // Load all active workflows
      const activeWorkflows = await db
        .select()
        .from(workflows)
        .where(eq(workflows.status, "active"));

      const now = Date.now();

      for (const wf of activeWorkflows) {
        const nodes = wf.nodes as WorkflowNode[];
        const scheduleTrigger = nodes.find(
          (n: WorkflowNode) => n.type === "schedule-trigger"
        );

        if (!scheduleTrigger) continue;

        const config = scheduleTrigger.config;
        const intervalMs = config["intervalMs"] as number | undefined;
        const cron = config["cron"] as string | undefined;

        if (!intervalMs && !cron) continue;

        const existing = scheduleMap.get(wf.id);
        const lastRun = existing?.lastRunAt ?? 0;

        // Simple interval-based scheduling (MVP)
        // For cron, we approximate with interval parsing
        const effectiveInterval = intervalMs ?? parseCronToInterval(cron ?? "");

        if (effectiveInterval > 0 && now - lastRun >= effectiveInterval) {
          logger.info({
            workflowId: wf.id,
            interval: effectiveInterval,
          }, "Triggering scheduled workflow");

          try {
            await executionService.trigger(wf.userId, wf.id, {
              _trigger: "schedule",
              _scheduledAt: new Date().toISOString(),
            });

            scheduleMap.set(wf.id, {
              workflowId: wf.id,
              userId: wf.userId,
              cron,
              intervalMs,
              lastRunAt: now,
            });
          } catch (err) {
            logger.error({
              workflowId: wf.id,
              error: err instanceof Error ? err.message : "Unknown error",
            }, "Failed to trigger scheduled workflow");
          }
        }
      }
    } catch (err) {
      logger.error({
        error: err instanceof Error ? err.message : "Unknown error",
      }, "Scheduler check failed");
    }
  }

  // Run check on interval
  setInterval(checkSchedules, CHECK_INTERVAL);

  // Run initial check after 5 seconds
  setTimeout(checkSchedules, 5000);
}

// Simple cron-to-interval approximation for MVP
// Supports common patterns; production would use a proper cron parser
function parseCronToInterval(cron: string): number {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return 0;

  const [minute, hour] = parts;

  // Every minute: * * * * *
  if (minute === "*" && hour === "*") return 60000;

  // Every N minutes: */N * * * *
  if (minute?.startsWith("*/") && hour === "*") {
    const n = parseInt(minute.slice(2), 10);
    if (!isNaN(n) && n > 0) return n * 60000;
  }

  // Specific minute, every hour: N * * * *
  if (minute && !minute.includes("*") && hour === "*") {
    return 3600000; // hourly
  }

  // Specific minute and hour: N N * * *
  if (minute && !minute.includes("*") && hour && !hour.includes("*")) {
    return 86400000; // daily
  }

  // Default: hourly
  return 3600000;
}
