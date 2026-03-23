// ──────────────────────────────────────────────
// REX - Compliance Service
// Consent, audit logging, retention
// ──────────────────────────────────────────────

import { and, count, desc, eq, isNull, lte, or } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  alertEvents,
  dataSubjectRequests,
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
  workflowLegalBasis,
  workflowNodeRexScores,
  workflowPublications,
  workflows,
} from "@rex/database";
import { DEFAULT_TENANT_ID } from "./tenant-default.js";

export interface ComplianceService {
  recordAuditLog(input: {
    actorUserId: string;
    subjectUserId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    tenantId?: string;
  }): Promise<void>;
  setConsent(userId: string, input: {
    consentType: string;
    policyVersion: string;
    granted: boolean;
    metadata?: Record<string, unknown>;
  }, tenantId?: string): Promise<{ id: string }>;
  listConsents(userId: string, tenantId?: string): Promise<Array<{
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
  }, tenantId?: string): Promise<{ id: string }>;
  runRetentionSweep(userId: string, tenantId?: string): Promise<Record<string, number>>;
  setWorkflowLegalBasis(input: {
    tenantId?: string;
    workflowId: string;
    reviewedBy: string;
    gdprBasis?: string | null;
    dpdpBasis?: string | null;
    purposeDescription: string;
    dataCategories: string[];
    crossBorderTransfer?: boolean;
    transferSafeguards?: string | null;
    retentionDays?: number | null;
  }): Promise<{ id: string }>;
  getWorkflowLegalBasis(tenantId: string, workflowId: string): Promise<{
    id: string;
    workflowId: string;
    gdprBasis: string | null;
    dpdpBasis: string | null;
    purposeDescription: string;
    dataCategories: string[];
    crossBorderTransfer: boolean;
    transferSafeguards: string | null;
    retentionDays: number | null;
    lastReviewedAt: Date | null;
    reviewedBy: string | null;
  } | null>;
  createDataSubjectRequest(input: {
    tenantId?: string;
    subjectUserId: string;
    requestType: string;
    description: string;
    dueDate?: Date;
  }): Promise<{ id: string }>;
  listDataSubjectRequests(tenantId: string, subjectUserId?: string): Promise<Array<{
    id: string;
    subjectUserId: string;
    requestType: string;
    status: string;
    description: string;
    response: string | null;
    processedBy: string | null;
    processedAt: Date | null;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }>>;
  respondDataSubjectRequest(input: {
    tenantId?: string;
    requestId: string;
    actorUserId: string;
    status: "in_progress" | "completed" | "rejected";
    response?: string;
  }): Promise<{ id: string }>;
  getComplianceReport(tenantId: string): Promise<{
    generatedAt: string;
    summary: {
      totalWorkflows: number;
      rexEnabledWorkflows: number;
      averageRexScore: number;
      publishedWorkflows: number;
      legalBasisCoveragePercent: number;
      openDataSubjectRequests: number;
    };
  }>;
}

interface ComplianceSummaryInput {
  totalWorkflows: number;
  publishedWorkflows: number;
  legalBasisCount: number;
  openDataSubjectRequests: number;
  workflowRexScores: Array<{ workflowId: string; totalScore: number }>;
}

export function buildComplianceSummary(input: ComplianceSummaryInput): {
  totalWorkflows: number;
  rexEnabledWorkflows: number;
  averageRexScore: number;
  publishedWorkflows: number;
  legalBasisCoveragePercent: number;
  openDataSubjectRequests: number;
} {
  const scoresByWorkflow = new Map<string, number[]>();
  for (const row of input.workflowRexScores) {
    const scores = scoresByWorkflow.get(row.workflowId) ?? [];
    scores.push(row.totalScore);
    scoresByWorkflow.set(row.workflowId, scores);
  }

  const workflowAverages = Array.from(scoresByWorkflow.values()).map((scores) => {
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  });

  const averageRexScore =
    workflowAverages.length === 0
      ? 0
      : Math.round(
          workflowAverages.reduce((sum, value) => sum + value, 0) / workflowAverages.length
        );

  const rexEnabledWorkflows = workflowAverages.filter((value) => value >= 70).length;
  const legalBasisCoveragePercent =
    input.totalWorkflows === 0
      ? 100
      : Math.round((input.legalBasisCount / input.totalWorkflows) * 100);

  return {
    totalWorkflows: input.totalWorkflows,
    rexEnabledWorkflows,
    averageRexScore,
    publishedWorkflows: input.publishedWorkflows,
    legalBasisCoveragePercent,
    openDataSubjectRequests: input.openDataSubjectRequests,
  };
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

    async setConsent(userId, input, tenantId = DEFAULT_TENANT_ID) {
      const [existing] = await db
        .select({ id: userConsents.id })
        .from(userConsents)
        .where(
          and(
            eq(userConsents.tenantId, tenantId),
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
          tenantId,
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

    async listConsents(userId, tenantId = DEFAULT_TENANT_ID) {
      const rows = await db
        .select()
        .from(userConsents)
        .where(and(eq(userConsents.userId, userId), eq(userConsents.tenantId, tenantId)));

      return rows.map((row) => ({
        id: row.id,
        consentType: row.consentType,
        policyVersion: row.policyVersion,
        granted: row.granted,
        metadata: toRecord(row.metadata),
        updatedAt: row.updatedAt,
      }));
    },

    async upsertRetentionPolicy(userId, input, tenantId = DEFAULT_TENANT_ID) {
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
              eq(retentionPolicies.tenantId, tenantId),
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
          tenantId,
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

    async runRetentionSweep(userId, tenantId = DEFAULT_TENANT_ID) {
      const policies = await db
        .select()
        .from(retentionPolicies)
        .where(
          and(
            eq(retentionPolicies.tenantId, tenantId),
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
                eq(guardrailEvents.tenantId, tenantId),
                eq(guardrailEvents.userId, userId),
                lte(guardrailEvents.createdAt, cutoff)
              )
            )
            .returning({ id: guardrailEvents.id });
          deleted.guardrail_events = (deleted.guardrail_events ?? 0) + rows.length;
        } else if (policy.resourceType === "alert_events") {
          const rows = await db
            .delete(alertEvents)
            .where(
              and(
                eq(alertEvents.tenantId, tenantId),
                eq(alertEvents.userId, userId),
                lte(alertEvents.triggeredAt, cutoff)
              )
            )
            .returning({ id: alertEvents.id });
          deleted.alert_events = (deleted.alert_events ?? 0) + rows.length;
        } else if (policy.resourceType === "knowledge_documents") {
          const rows = await db
            .delete(knowledgeDocuments)
            .where(
              and(
                eq(knowledgeDocuments.tenantId, tenantId),
                eq(knowledgeDocuments.userId, userId),
                lte(knowledgeDocuments.createdAt, cutoff)
              )
            )
            .returning({ id: knowledgeDocuments.id });
          deleted.knowledge_documents = (deleted.knowledge_documents ?? 0) + rows.length;
        } else if (policy.resourceType === "executions") {
          const ownedWorkflows = await db
            .select({ id: workflows.id })
            .from(workflows)
            .where(and(eq(workflows.userId, userId), eq(workflows.tenantId, tenantId)));
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
                eq(executions.tenantId, tenantId),
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

    async setWorkflowLegalBasis(input) {
      const tenantId = input.tenantId ?? DEFAULT_TENANT_ID;
      const [existing] = await db
        .select({ id: workflowLegalBasis.id })
        .from(workflowLegalBasis)
        .where(
          and(
            eq(workflowLegalBasis.tenantId, tenantId),
            eq(workflowLegalBasis.workflowId, input.workflowId)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(workflowLegalBasis)
          .set({
            gdprBasis: input.gdprBasis ?? null,
            dpdpBasis: input.dpdpBasis ?? null,
            purposeDescription: input.purposeDescription,
            dataCategories: input.dataCategories,
            crossBorderTransfer: input.crossBorderTransfer ?? false,
            transferSafeguards: input.transferSafeguards ?? null,
            retentionDays: input.retentionDays ?? null,
            lastReviewedAt: new Date(),
            reviewedBy: input.reviewedBy,
          })
          .where(eq(workflowLegalBasis.id, existing.id))
          .returning({ id: workflowLegalBasis.id });
        if (!updated) throw new Error("Failed to update legal basis");
        return updated;
      }

      const [created] = await db
        .insert(workflowLegalBasis)
        .values({
          tenantId,
          workflowId: input.workflowId,
          gdprBasis: input.gdprBasis ?? null,
          dpdpBasis: input.dpdpBasis ?? null,
          purposeDescription: input.purposeDescription,
          dataCategories: input.dataCategories,
          crossBorderTransfer: input.crossBorderTransfer ?? false,
          transferSafeguards: input.transferSafeguards ?? null,
          retentionDays: input.retentionDays ?? null,
          lastReviewedAt: new Date(),
          reviewedBy: input.reviewedBy,
        })
        .returning({ id: workflowLegalBasis.id });

      if (!created) throw new Error("Failed to create legal basis");
      return created;
    },

    async getWorkflowLegalBasis(tenantId, workflowId) {
      const [row] = await db
        .select()
        .from(workflowLegalBasis)
        .where(
          and(
            eq(workflowLegalBasis.tenantId, tenantId),
            eq(workflowLegalBasis.workflowId, workflowId)
          )
        )
        .limit(1);

      if (!row) return null;
      return {
        id: row.id,
        workflowId: row.workflowId,
        gdprBasis: row.gdprBasis,
        dpdpBasis: row.dpdpBasis,
        purposeDescription: row.purposeDescription,
        dataCategories: row.dataCategories,
        crossBorderTransfer: row.crossBorderTransfer,
        transferSafeguards: row.transferSafeguards,
        retentionDays: row.retentionDays,
        lastReviewedAt: row.lastReviewedAt,
        reviewedBy: row.reviewedBy,
      };
    },

    async createDataSubjectRequest(input) {
      const tenantId = input.tenantId ?? DEFAULT_TENANT_ID;
      const dueDate = input.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const [created] = await db
        .insert(dataSubjectRequests)
        .values({
          tenantId,
          subjectUserId: input.subjectUserId,
          requestType: input.requestType,
          description: input.description,
          status: "pending",
          dueDate,
        })
        .returning({ id: dataSubjectRequests.id });

      if (!created) throw new Error("Failed to create data subject request");
      return created;
    },

    async listDataSubjectRequests(tenantId, subjectUserId) {
      const rows = await db
        .select()
        .from(dataSubjectRequests)
        .where(
          subjectUserId
            ? and(
                eq(dataSubjectRequests.tenantId, tenantId),
                eq(dataSubjectRequests.subjectUserId, subjectUserId)
              )
            : eq(dataSubjectRequests.tenantId, tenantId)
        )
        .orderBy(desc(dataSubjectRequests.createdAt));

      return rows.map((row) => ({
        id: row.id,
        subjectUserId: row.subjectUserId,
        requestType: row.requestType,
        status: row.status,
        description: row.description,
        response: row.response,
        processedBy: row.processedBy,
        processedAt: row.processedAt,
        dueDate: row.dueDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    },

    async respondDataSubjectRequest(input) {
      const tenantId = input.tenantId ?? DEFAULT_TENANT_ID;
      const [updated] = await db
        .update(dataSubjectRequests)
        .set({
          status: input.status,
          response: input.response ?? null,
          processedBy: input.actorUserId,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dataSubjectRequests.tenantId, tenantId),
            eq(dataSubjectRequests.id, input.requestId)
          )
        )
        .returning({ id: dataSubjectRequests.id });

      if (!updated) throw new Error("Data subject request not found");
      return updated;
    },

    async getComplianceReport(tenantId) {
      const [workflowCounts, publicationCounts, legalBasisCounts, rexRows, dsarCounts] = await Promise.all([
        db.select({ total: count() }).from(workflows).where(eq(workflows.tenantId, tenantId)),
        db
          .select({ total: count() })
          .from(workflowPublications)
          .where(
            and(
              eq(workflowPublications.tenantId, tenantId),
              eq(workflowPublications.isPublished, true)
            )
          ),
        db.select({ total: count() }).from(workflowLegalBasis).where(eq(workflowLegalBasis.tenantId, tenantId)),
        db
          .select({
            workflowId: workflowNodeRexScores.workflowId,
            totalScore: workflowNodeRexScores.totalScore,
          })
          .from(workflowNodeRexScores)
          .innerJoin(workflows, eq(workflows.id, workflowNodeRexScores.workflowId))
          .where(eq(workflows.tenantId, tenantId)),
        db
          .select({ total: count() })
          .from(dataSubjectRequests)
          .where(
            and(
              eq(dataSubjectRequests.tenantId, tenantId),
              or(
                eq(dataSubjectRequests.status, "pending"),
                eq(dataSubjectRequests.status, "in_progress")
              )
            )
          ),
      ]);

      const summary = buildComplianceSummary({
        totalWorkflows: workflowCounts[0]?.total ?? 0,
        publishedWorkflows: publicationCounts[0]?.total ?? 0,
        legalBasisCount: legalBasisCounts[0]?.total ?? 0,
        openDataSubjectRequests: dsarCounts[0]?.total ?? 0,
        workflowRexScores: rexRows,
      });

      return {
        generatedAt: new Date().toISOString(),
        summary,
      };
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
