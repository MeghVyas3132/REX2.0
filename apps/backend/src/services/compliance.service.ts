// ──────────────────────────────────────────────
// REX - Compliance Service
// Consent, audit logging, retention
// ──────────────────────────────────────────────

import { and, eq, isNull, lte, or } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  alertEvents,
  dataAccessAuditLogs,
  executionContextSnapshots,
  executionRetrievalEvents,
  executionStepAttempts,
  executionSteps,
  executions,
  guardrailEvents,
  knowledgeDocuments,
  retentionPolicies,
  userConsents,
  workflows,
} from "@rex/database";

export interface ComplianceService {
  recordAuditLog(input: {
    actorUserId: string;
    subjectUserId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  setConsent(userId: string, input: {
    consentType: string;
    policyVersion: string;
    granted: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }>;
  listConsents(userId: string): Promise<Array<{
    id: string;
    consentType: string;
    policyVersion: string;
    granted: boolean;
    metadata: Record<string, unknown>;
    updatedAt: Date;
  }>>;
  upsertRetentionPolicy(userId: string, input: {
    id?: string;
    resourceType: "executions" | "knowledge_documents" | "guardrail_events" | "audit_logs" | "alert_events";
    retentionDays: number;
    config?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<{ id: string }>;
  runRetentionSweep(userId: string): Promise<Record<string, number>>;
}

export function createComplianceService(db: Database): ComplianceService {
  return {
    async recordAuditLog(input) {
      await db.insert(dataAccessAuditLogs).values({
        actorUserId: input.actorUserId,
        subjectUserId: input.subjectUserId,
        action: input.action.slice(0, 80),
        resourceType: input.resourceType.slice(0, 80),
        resourceId: input.resourceId?.slice(0, 255) ?? null,
        metadata: input.metadata ?? {},
      });
    },

    async setConsent(userId, input) {
      const [existing] = await db
        .select({ id: userConsents.id })
        .from(userConsents)
        .where(
          and(
            eq(userConsents.userId, userId),
            eq(userConsents.consentType, input.consentType)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(userConsents)
          .set({
            policyVersion: input.policyVersion,
            granted: input.granted,
            metadata: input.metadata ?? {},
            updatedAt: new Date(),
          })
          .where(eq(userConsents.id, existing.id))
          .returning({ id: userConsents.id });
        if (!updated) throw new Error("Failed to update consent");
        return updated;
      }

      const [created] = await db
        .insert(userConsents)
        .values({
          userId,
          consentType: input.consentType,
          policyVersion: input.policyVersion,
          granted: input.granted,
          metadata: input.metadata ?? {},
        })
        .returning({ id: userConsents.id });
      if (!created) throw new Error("Failed to create consent");
      return created;
    },

    async listConsents(userId) {
      const rows = await db
        .select()
        .from(userConsents)
        .where(eq(userConsents.userId, userId));

      return rows.map((row) => ({
        id: row.id,
        consentType: row.consentType,
        policyVersion: row.policyVersion,
        granted: row.granted,
        metadata: toRecord(row.metadata),
        updatedAt: row.updatedAt,
      }));
    },

    async upsertRetentionPolicy(userId, input) {
      if (input.id) {
        const [updated] = await db
          .update(retentionPolicies)
          .set({
            retentionDays: input.retentionDays,
            config: input.config ?? {},
            isActive: input.isActive ?? true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(retentionPolicies.id, input.id),
              or(eq(retentionPolicies.userId, userId), isNull(retentionPolicies.userId))
            )
          )
          .returning({ id: retentionPolicies.id });
        if (!updated) throw new Error("Policy not found or access denied");
        return updated;
      }

      const [created] = await db
        .insert(retentionPolicies)
        .values({
          userId,
          resourceType: input.resourceType,
          retentionDays: input.retentionDays,
          config: input.config ?? {},
          isActive: input.isActive ?? true,
        })
        .returning({ id: retentionPolicies.id });
      if (!created) throw new Error("Failed to create retention policy");
      return created;
    },

    async runRetentionSweep(userId) {
      const policies = await db
        .select()
        .from(retentionPolicies)
        .where(
          and(
            eq(retentionPolicies.isActive, true),
            or(eq(retentionPolicies.userId, userId), isNull(retentionPolicies.userId))
          )
        );

      const deleted: Record<string, number> = {};

      for (const policy of policies) {
        const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

        if (policy.resourceType === "audit_logs") {
          const rows = await db
            .delete(dataAccessAuditLogs)
            .where(
              and(
                eq(dataAccessAuditLogs.subjectUserId, userId),
                lte(dataAccessAuditLogs.createdAt, cutoff)
              )
            )
            .returning({ id: dataAccessAuditLogs.id });
          deleted.audit_logs = (deleted.audit_logs ?? 0) + rows.length;
        } else if (policy.resourceType === "guardrail_events") {
          const rows = await db
            .delete(guardrailEvents)
            .where(
              and(
                eq(guardrailEvents.userId, userId),
                lte(guardrailEvents.createdAt, cutoff)
              )
            )
            .returning({ id: guardrailEvents.id });
          deleted.guardrail_events = (deleted.guardrail_events ?? 0) + rows.length;
        } else if (policy.resourceType === "alert_events") {
          const rows = await db
            .delete(alertEvents)
            .where(and(eq(alertEvents.userId, userId), lte(alertEvents.triggeredAt, cutoff)))
            .returning({ id: alertEvents.id });
          deleted.alert_events = (deleted.alert_events ?? 0) + rows.length;
        } else if (policy.resourceType === "knowledge_documents") {
          const rows = await db
            .delete(knowledgeDocuments)
            .where(and(eq(knowledgeDocuments.userId, userId), lte(knowledgeDocuments.createdAt, cutoff)))
            .returning({ id: knowledgeDocuments.id });
          deleted.knowledge_documents = (deleted.knowledge_documents ?? 0) + rows.length;
        } else if (policy.resourceType === "executions") {
          const ownedWorkflows = await db
            .select({ id: workflows.id })
            .from(workflows)
            .where(eq(workflows.userId, userId));
          const workflowIds = ownedWorkflows.map((wf) => wf.id);
          if (workflowIds.length === 0) {
            continue;
          }
          const oldExecutions = await db
            .select({ id: executions.id })
            .from(executions)
            .where(
              and(
                or(...workflowIds.map((workflowId) => eq(executions.workflowId, workflowId))),
                lte(executions.createdAt, cutoff)
              )
            );
          const executionIds = oldExecutions.map((row) => row.id);
          if (executionIds.length === 0) {
            continue;
          }

          await db.delete(executionStepAttempts).where(or(...executionIds.map((id) => eq(executionStepAttempts.executionId, id))));
          await db.delete(executionContextSnapshots).where(or(...executionIds.map((id) => eq(executionContextSnapshots.executionId, id))));
          await db.delete(executionRetrievalEvents).where(or(...executionIds.map((id) => eq(executionRetrievalEvents.executionId, id))));
          await db.delete(executionSteps).where(or(...executionIds.map((id) => eq(executionSteps.executionId, id))));

          const rows = await db
            .delete(executions)
            .where(or(...executionIds.map((id) => eq(executions.id, id))))
            .returning({ id: executions.id });
          deleted.executions = (deleted.executions ?? 0) + rows.length;
        }
      }

      return deleted;
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
