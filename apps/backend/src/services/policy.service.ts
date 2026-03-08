// ──────────────────────────────────────────────
// REX - Policy Service
// Workflow sharing and IAM policies
// ──────────────────────────────────────────────

import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { iamPolicies, workflowPermissions, workflows } from "@rex/database";

export interface PolicyService {
  listWorkflowPermissions(ownerUserId: string, workflowId: string): Promise<Array<{
    id: string;
    userId: string;
    role: string;
    attributes: Record<string, unknown>;
    expiresAt: Date | null;
  }>>;
  upsertWorkflowPermission(
    ownerUserId: string,
    workflowId: string,
    input: {
      userId: string;
      role: "viewer" | "editor";
      attributes?: Record<string, unknown>;
      expiresAt?: Date | null;
    }
  ): Promise<void>;
  listPolicies(userId: string): Promise<Array<{
    id: string;
    userId: string | null;
    workflowId: string | null;
    action: string;
    effect: string;
    conditions: Record<string, unknown>;
    isActive: boolean;
  }>>;
  upsertPolicy(
    actorUserId: string,
    input: {
      id?: string;
      userId?: string | null;
      workflowId?: string | null;
      action: string;
      effect: "allow" | "deny";
      conditions?: Record<string, unknown>;
      isActive?: boolean;
    }
  ): Promise<{ id: string }>;
}

export function createPolicyService(db: Database): PolicyService {
  return {
    async listWorkflowPermissions(ownerUserId, workflowId) {
      const [workflow] = await db
        .select({ id: workflows.id, userId: workflows.userId })
        .from(workflows)
        .where(eq(workflows.id, workflowId))
        .limit(1);
      if (!workflow || workflow.userId !== ownerUserId) {
        throw new Error("Workflow not found or access denied");
      }

      const rows = await db
        .select({
          id: workflowPermissions.id,
          userId: workflowPermissions.userId,
          role: workflowPermissions.role,
          attributes: workflowPermissions.attributes,
          expiresAt: workflowPermissions.expiresAt,
        })
        .from(workflowPermissions)
        .where(eq(workflowPermissions.workflowId, workflowId));

      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        role: row.role,
        attributes: toRecord(row.attributes),
        expiresAt: row.expiresAt,
      }));
    },

    async upsertWorkflowPermission(ownerUserId, workflowId, input) {
      const [workflow] = await db
        .select({ id: workflows.id, userId: workflows.userId })
        .from(workflows)
        .where(eq(workflows.id, workflowId))
        .limit(1);
      if (!workflow || workflow.userId !== ownerUserId) {
        throw new Error("Workflow not found or access denied");
      }

      const [existing] = await db
        .select({ id: workflowPermissions.id })
        .from(workflowPermissions)
        .where(
          and(
            eq(workflowPermissions.workflowId, workflowId),
            eq(workflowPermissions.userId, input.userId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(workflowPermissions)
          .set({
            role: input.role,
            attributes: input.attributes ?? {},
            expiresAt: input.expiresAt ?? null,
            updatedAt: new Date(),
          })
          .where(eq(workflowPermissions.id, existing.id));
        return;
      }

      await db.insert(workflowPermissions).values({
        workflowId,
        userId: input.userId,
        role: input.role,
        attributes: input.attributes ?? {},
        expiresAt: input.expiresAt ?? null,
      });
    },

    async listPolicies(userId) {
      const rows = await db
        .select()
        .from(iamPolicies)
        .where(eq(iamPolicies.userId, userId));
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        workflowId: row.workflowId,
        action: row.action,
        effect: row.effect,
        conditions: toRecord(row.conditions),
        isActive: row.isActive,
      }));
    },

    async upsertPolicy(actorUserId, input) {
      if (input.id) {
        const [existing] = await db
          .select({ id: iamPolicies.id, userId: iamPolicies.userId })
          .from(iamPolicies)
          .where(eq(iamPolicies.id, input.id))
          .limit(1);
        if (!existing || existing.userId !== actorUserId) {
          throw new Error("Policy not found or access denied");
        }

        const [updated] = await db
          .update(iamPolicies)
          .set({
            action: input.action,
            effect: input.effect,
            conditions: input.conditions ?? {},
            isActive: input.isActive ?? true,
            updatedAt: new Date(),
          })
          .where(eq(iamPolicies.id, input.id))
          .returning({ id: iamPolicies.id });
        if (!updated) throw new Error("Failed to update policy");
        return updated;
      }

      const [created] = await db
        .insert(iamPolicies)
        .values({
          userId: input.userId ?? actorUserId,
          workflowId: input.workflowId ?? null,
          action: input.action,
          effect: input.effect,
          conditions: input.conditions ?? {},
          isActive: input.isActive ?? true,
        })
        .returning({ id: iamPolicies.id });
      if (!created) throw new Error("Failed to create policy");
      return created;
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
