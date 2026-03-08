// ──────────────────────────────────────────────
// REX - KPI & Observability Service
// ──────────────────────────────────────────────

import { and, eq, gte } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  executions,
  executionSteps,
  executionRetrievalEvents,
  guardrailEvents,
  workflows,
  knowledgeCorpora,
  knowledgeDocuments,
} from "@rex/database";

export interface KpiSummary {
  windowDays: number;
  ttftMs: number | null;
  latency: {
    avgStepMs: number;
    p95StepMs: number;
    breaches: number;
    thresholdMs: number;
  };
  retrieval: {
    totalEvents: number;
    hitRate: number;
    emptyRate: number;
    failureRate: number;
  };
  guardrails: {
    triggered: number;
  };
  corpus: {
    totalCorpora: number;
    failedCorpora: number;
    totalDocuments: number;
    failedDocuments: number;
    staleCorpora: number;
  };
  executions: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
}

export interface KpiTimepoint {
  date: string;
  executions: number;
  failures: number;
  avgStepMs: number;
  retrievalHitRate: number;
  guardrailTriggers: number;
}

export interface KpiService {
  getSummary(userId: string, days: number, latencyThresholdMs: number): Promise<KpiSummary>;
  getTimeseries(userId: string, days: number): Promise<KpiTimepoint[]>;
}

export function createKpiService(db: Database): KpiService {
  return {
    async getSummary(userId, days, latencyThresholdMs) {
      const normalizedDays = normalizeDays(days);
      const since = daysAgo(normalizedDays);
      const staleCutoff = daysAgo(30);

      const [executionRows, stepRows, retrievalRows, guardrailRows, corporaRows, documentRows] =
        await Promise.all([
          db
            .select({
              status: executions.status,
              createdAt: executions.createdAt,
            })
            .from(executions)
            .innerJoin(workflows, eq(workflows.id, executions.workflowId))
            .where(
              and(
                eq(workflows.userId, userId),
                gte(executions.createdAt, since)
              )
            ),
          db
            .select({
              durationMs: executionSteps.durationMs,
            })
            .from(executionSteps)
            .innerJoin(executions, eq(executions.id, executionSteps.executionId))
            .innerJoin(workflows, eq(workflows.id, executions.workflowId))
            .where(
              and(
                eq(workflows.userId, userId),
                gte(executions.createdAt, since)
              )
            ),
          db
            .select({
              status: executionRetrievalEvents.status,
              matchesCount: executionRetrievalEvents.matchesCount,
            })
            .from(executionRetrievalEvents)
            .innerJoin(executions, eq(executions.id, executionRetrievalEvents.executionId))
            .innerJoin(workflows, eq(workflows.id, executions.workflowId))
            .where(
              and(
                eq(workflows.userId, userId),
                gte(executions.createdAt, since)
              )
            ),
          db
            .select({
              id: guardrailEvents.id,
            })
            .from(guardrailEvents)
            .where(
              and(
                eq(guardrailEvents.userId, userId),
                gte(guardrailEvents.createdAt, since)
              )
            ),
          db
            .select({
              status: knowledgeCorpora.status,
              updatedAt: knowledgeCorpora.updatedAt,
            })
            .from(knowledgeCorpora)
            .where(eq(knowledgeCorpora.userId, userId)),
          db
            .select({
              status: knowledgeDocuments.status,
            })
            .from(knowledgeDocuments)
            .where(eq(knowledgeDocuments.userId, userId)),
        ]);

      const stepDurations = stepRows
        .map((row) => row.durationMs)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const avgStepMs = round2(average(stepDurations));
      const p95StepMs = round2(percentile(stepDurations, 95));
      const breaches = stepDurations.filter((duration) => duration > latencyThresholdMs).length;

      const totalRetrieval = retrievalRows.length;
      const retrievalHits = retrievalRows.filter((row) => row.matchesCount > 0).length;
      const retrievalEmpties = retrievalRows.filter((row) => row.status === "empty").length;
      const retrievalFailures = retrievalRows.filter((row) => row.status === "failed").length;

      const totalExecutions = executionRows.length;
      const completed = executionRows.filter((row) => row.status === "completed").length;
      const failed = executionRows.filter((row) => row.status === "failed").length;
      const running = executionRows.filter(
        (row) => row.status === "running" || row.status === "pending"
      ).length;

      const failedCorpora = corporaRows.filter((row) => row.status === "failed").length;
      const staleCorpora = corporaRows.filter((row) => row.updatedAt < staleCutoff).length;
      const failedDocuments = documentRows.filter((row) => row.status === "failed").length;

      return {
        windowDays: normalizedDays,
        ttftMs: null,
        latency: {
          avgStepMs,
          p95StepMs,
          breaches,
          thresholdMs: latencyThresholdMs,
        },
        retrieval: {
          totalEvents: totalRetrieval,
          hitRate: ratio(retrievalHits, totalRetrieval),
          emptyRate: ratio(retrievalEmpties, totalRetrieval),
          failureRate: ratio(retrievalFailures, totalRetrieval),
        },
        guardrails: {
          triggered: guardrailRows.length,
        },
        corpus: {
          totalCorpora: corporaRows.length,
          failedCorpora,
          totalDocuments: documentRows.length,
          failedDocuments,
          staleCorpora,
        },
        executions: {
          total: totalExecutions,
          completed,
          failed,
          running,
        },
      };
    },

    async getTimeseries(userId, days) {
      const normalizedDays = normalizeDays(days);
      const since = daysAgo(normalizedDays);

      const [executionRows, stepRows, retrievalRows, guardrailRows] = await Promise.all([
        db
          .select({
            executionId: executions.id,
            status: executions.status,
            createdAt: executions.createdAt,
          })
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(
            and(
              eq(workflows.userId, userId),
              gte(executions.createdAt, since)
            )
          ),
        db
          .select({
            executionId: executionSteps.executionId,
            durationMs: executionSteps.durationMs,
            createdAt: executionSteps.createdAt,
          })
          .from(executionSteps)
          .innerJoin(executions, eq(executions.id, executionSteps.executionId))
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(
            and(
              eq(workflows.userId, userId),
              gte(executions.createdAt, since)
            )
          ),
        db
          .select({
            status: executionRetrievalEvents.status,
            matchesCount: executionRetrievalEvents.matchesCount,
            createdAt: executionRetrievalEvents.createdAt,
          })
          .from(executionRetrievalEvents)
          .innerJoin(executions, eq(executions.id, executionRetrievalEvents.executionId))
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(
            and(
              eq(workflows.userId, userId),
              gte(executions.createdAt, since)
            )
          ),
        db
          .select({
            createdAt: guardrailEvents.createdAt,
          })
          .from(guardrailEvents)
          .where(
            and(
              eq(guardrailEvents.userId, userId),
              gte(guardrailEvents.createdAt, since)
            )
          ),
      ]);

      const points = bootstrapTimepoints(normalizedDays);
      for (const row of executionRows) {
        const key = formatDay(row.createdAt);
        const point = points.get(key);
        if (!point) continue;
        point.executions += 1;
        if (row.status === "failed") {
          point.failures += 1;
        }
      }

      for (const row of stepRows) {
        if (typeof row.durationMs !== "number" || !Number.isFinite(row.durationMs)) {
          continue;
        }
        const key = formatDay(row.createdAt);
        const point = points.get(key);
        if (!point) continue;
        point._stepTotal += row.durationMs;
        point._stepCount += 1;
      }

      for (const row of retrievalRows) {
        const key = formatDay(row.createdAt);
        const point = points.get(key);
        if (!point) continue;
        point._retrievalTotal += 1;
        if (row.matchesCount > 0) {
          point._retrievalHits += 1;
        }
      }

      for (const row of guardrailRows) {
        const key = formatDay(row.createdAt);
        const point = points.get(key);
        if (!point) continue;
        point.guardrailTriggers += 1;
      }

      return Array.from(points.values()).map((point) => ({
        date: point.date,
        executions: point.executions,
        failures: point.failures,
        avgStepMs: point._stepCount > 0 ? round2(point._stepTotal / point._stepCount) : 0,
        retrievalHitRate:
          point._retrievalTotal > 0
            ? round2((point._retrievalHits / point._retrievalTotal) * 100)
            : 0,
        guardrailTriggers: point.guardrailTriggers,
      }));
    },
  };
}

function normalizeDays(value: number): number {
  if (!Number.isFinite(value)) return 7;
  const normalized = Math.floor(value);
  return Math.max(1, Math.min(90, normalized));
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return round2((numerator / denominator) * 100);
}

function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bootstrapTimepoints(days: number): Map<string, TimepointMutable> {
  const map = new Map<string, TimepointMutable>();
  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset--) {
    const current = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const day = formatDay(current);
    map.set(day, {
      date: day,
      executions: 0,
      failures: 0,
      guardrailTriggers: 0,
      _stepTotal: 0,
      _stepCount: 0,
      _retrievalTotal: 0,
      _retrievalHits: 0,
    });
  }
  return map;
}

interface TimepointMutable {
  date: string;
  executions: number;
  failures: number;
  guardrailTriggers: number;
  _stepTotal: number;
  _stepCount: number;
  _retrievalTotal: number;
  _retrievalHits: number;
}
