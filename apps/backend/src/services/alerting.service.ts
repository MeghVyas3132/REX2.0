// ──────────────────────────────────────────────
// REX - Alerting Service
// ──────────────────────────────────────────────

import { and, desc, eq, gte, isNull, or } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  alertEvents,
  alertRules,
  executionSteps,
  executions,
  guardrailEvents,
  knowledgeCorpora,
  knowledgeDocuments,
  workflows,
} from "@rex/database";
import { DEFAULT_TENANT_ID } from "./tenant-default.js";

export interface AlertingService {
  listRules(userId: string, tenantId?: string): Promise<Array<{
    id: string;
    workflowId: string | null;
    ruleType: string;
    severity: string;
    threshold: number;
    windowMinutes: number;
    config: Record<string, unknown>;
    isActive: boolean;
  }>>;
  upsertRule(userId: string, input: {
    id?: string;
    workflowId?: string | null;
    ruleType: "latency-breach" | "guardrail-triggered" | "corpus-health-alert";
    severity?: "warn" | "critical";
    threshold?: number;
    windowMinutes?: number;
    config?: Record<string, unknown>;
    isActive?: boolean;
  }, tenantId?: string): Promise<{ id: string }>;
  listEvents(userId: string, limit?: number, tenantId?: string): Promise<Array<{
    id: string;
    workflowId: string | null;
    ruleType: string;
    severity: string;
    message: string;
    payload: Record<string, unknown>;
    triggeredAt: Date;
    resolvedAt: Date | null;
  }>>;
  evaluateForExecution(userId: string, workflowId: string, executionId: string, tenantId?: string): Promise<void>;
  getPrometheusMetrics(userId: string, tenantId?: string): Promise<string>;
}

export function createAlertingService(db: Database): AlertingService {
  return {
    async listRules(userId, tenantId = DEFAULT_TENANT_ID) {
      const rows = await db
        .select()
        .from(alertRules)
        .where(and(eq(alertRules.userId, userId), eq(alertRules.tenantId, tenantId)))
        .orderBy(desc(alertRules.updatedAt));
      return rows.map((row) => ({
        id: row.id,
        workflowId: row.workflowId,
        ruleType: row.ruleType,
        severity: row.severity,
        threshold: row.threshold,
        windowMinutes: row.windowMinutes,
        config: toRecord(row.config),
        isActive: row.isActive,
      }));
    },

    async upsertRule(userId, input, tenantId = DEFAULT_TENANT_ID) {
      if (input.id) {
        const [updated] = await db
          .update(alertRules)
          .set({
            workflowId: input.workflowId ?? null,
            ruleType: input.ruleType,
            severity: input.severity ?? "warn",
            threshold: input.threshold ?? 1,
            windowMinutes: input.windowMinutes ?? 60,
            config: input.config ?? {},
            isActive: input.isActive ?? true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(alertRules.id, input.id),
              eq(alertRules.userId, userId),
              eq(alertRules.tenantId, tenantId)
            )
          )
          .returning({ id: alertRules.id });
        if (!updated) throw new Error("Rule not found or access denied");
        return updated;
      }

      const [created] = await db
        .insert(alertRules)
        .values({
          tenantId,
          userId,
          workflowId: input.workflowId ?? null,
          ruleType: input.ruleType,
          severity: input.severity ?? "warn",
          threshold: input.threshold ?? 1,
          windowMinutes: input.windowMinutes ?? 60,
          config: input.config ?? {},
          isActive: input.isActive ?? true,
        })
        .returning({ id: alertRules.id });
      if (!created) throw new Error("Failed to create alert rule");
      return created;
    },

    async listEvents(userId, limit = 100, tenantId = DEFAULT_TENANT_ID) {
      const rows = await db
        .select()
        .from(alertEvents)
        .where(and(eq(alertEvents.userId, userId), eq(alertEvents.tenantId, tenantId)))
        .orderBy(desc(alertEvents.triggeredAt))
        .limit(Math.max(1, Math.min(limit, 500)));
      return rows.map((row) => ({
        id: row.id,
        workflowId: row.workflowId,
        ruleType: row.ruleType,
        severity: row.severity,
        message: row.message,
        payload: toRecord(row.payload),
        triggeredAt: row.triggeredAt,
        resolvedAt: row.resolvedAt,
      }));
    },

    async evaluateForExecution(userId, workflowId, executionId, tenantId = DEFAULT_TENANT_ID) {
      const rules = await db
        .select()
        .from(alertRules)
        .where(
          and(
            eq(alertRules.userId, userId),
            eq(alertRules.tenantId, tenantId),
            eq(alertRules.isActive, true),
            or(eq(alertRules.workflowId, workflowId), isNull(alertRules.workflowId))
          )
        );

      if (rules.length === 0) return;

      for (const rule of rules) {
        if (rule.ruleType === "latency-breach") {
          const [step] = await db
            .select({ durationMs: executionSteps.durationMs })
            .from(executionSteps)
            .where(
              and(
                eq(executionSteps.executionId, executionId),
                eq(executionSteps.tenantId, tenantId),
                gte(executionSteps.durationMs, rule.threshold)
              )
            )
            .limit(1);

          if (step) {
            await createAlertEvent(db, {
              tenantId,
              userId,
              workflowId,
              alertRuleId: rule.id,
              ruleType: rule.ruleType,
              severity: rule.severity,
              message: `Latency breach detected for execution ${executionId}`,
              payload: {
                executionId,
                thresholdMs: rule.threshold,
              },
            });
          }
        } else if (rule.ruleType === "guardrail-triggered") {
          const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
          const events = await db
            .select({ id: guardrailEvents.id })
            .from(guardrailEvents)
            .where(
              and(
                eq(guardrailEvents.userId, userId),
                eq(guardrailEvents.tenantId, tenantId),
                eq(guardrailEvents.workflowId, workflowId),
                gte(guardrailEvents.createdAt, windowStart)
              )
            );

          if (events.length >= rule.threshold) {
            await createAlertEvent(db, {
              tenantId,
              userId,
              workflowId,
              alertRuleId: rule.id,
              ruleType: rule.ruleType,
              severity: rule.severity,
              message: `Guardrail trigger threshold reached (${events.length})`,
              payload: {
                count: events.length,
                threshold: rule.threshold,
                windowMinutes: rule.windowMinutes,
              },
            });
          }
        } else if (rule.ruleType === "corpus-health-alert") {
          const [failedCount, totalCount] = await Promise.all([
            db
              .select({ total: knowledgeDocuments.id })
              .from(knowledgeDocuments)
              .where(
                and(
                  eq(knowledgeDocuments.userId, userId),
                  eq(knowledgeDocuments.tenantId, tenantId),
                  eq(knowledgeDocuments.status, "failed")
                )
              ),
            db
              .select({ total: knowledgeDocuments.id })
              .from(knowledgeDocuments)
              .where(
                and(
                  eq(knowledgeDocuments.userId, userId),
                  eq(knowledgeDocuments.tenantId, tenantId)
                )
              ),
          ]);

          const failed = failedCount.length;
          const total = totalCount.length;
          const failurePct = total === 0 ? 0 : (failed / total) * 100;
          if (failurePct >= rule.threshold) {
            await createAlertEvent(db, {
              tenantId,
              userId,
              workflowId: null,
              alertRuleId: rule.id,
              ruleType: rule.ruleType,
              severity: rule.severity,
              message: `Corpus health alert: ${failurePct.toFixed(2)}% failed documents`,
              payload: {
                failedDocuments: failed,
                totalDocuments: total,
                failurePct,
                thresholdPct: rule.threshold,
              },
            });
          }
        }
      }
    },

    async getPrometheusMetrics(userId, tenantId = DEFAULT_TENANT_ID) {
      const [rules, events, executionRows, corporaRows] = await Promise.all([
        db
          .select({ id: alertRules.id })
          .from(alertRules)
          .where(
            and(
              eq(alertRules.userId, userId),
              eq(alertRules.tenantId, tenantId),
              eq(alertRules.isActive, true)
            )
          ),
        db
          .select()
          .from(alertEvents)
          .where(and(eq(alertEvents.userId, userId), eq(alertEvents.tenantId, tenantId))),
        db
          .select({ status: executions.status })
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(and(eq(workflows.userId, userId), eq(workflows.tenantId, tenantId))),
        db
          .select({ status: knowledgeCorpora.status })
          .from(knowledgeCorpora)
          .where(and(eq(knowledgeCorpora.userId, userId), eq(knowledgeCorpora.tenantId, tenantId))),
      ]);

      const lines = [
        "# HELP rex_alert_rules_active Total active alert rules",
        "# TYPE rex_alert_rules_active gauge",
        `rex_alert_rules_active{user_id="${userId}"} ${rules.length}`,
        "# HELP rex_alert_events_total Total alert events",
        "# TYPE rex_alert_events_total counter",
        `rex_alert_events_total{user_id="${userId}"} ${events.length}`,
        "# HELP rex_executions_total Total executions",
        "# TYPE rex_executions_total counter",
        `rex_executions_total{user_id="${userId}"} ${executionRows.length}`,
        "# HELP rex_corpora_total Total corpora",
        "# TYPE rex_corpora_total gauge",
        `rex_corpora_total{user_id="${userId}"} ${corporaRows.length}`,
      ];

      return `${lines.join("\n")}\n`;
    },
  };
}

async function createAlertEvent(
  db: Database,
  input: {
    tenantId: string;
    userId: string;
    workflowId: string | null;
    alertRuleId: string | null;
    ruleType: string;
    severity: string;
    message: string;
    payload: Record<string, unknown>;
  }
): Promise<void> {
  await db.insert(alertEvents).values({
    tenantId: input.tenantId,
    userId: input.userId,
    workflowId: input.workflowId,
    alertRuleId: input.alertRuleId,
    ruleType: input.ruleType,
    severity: input.severity,
    message: input.message.slice(0, 1024),
    payload: input.payload,
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
