// ──────────────────────────────────────────────
// REX - Workspace Service
// ──────────────────────────────────────────────

import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { workspaceMembers, workspaces, workflows } from "@rex/database";
import { DEFAULT_TENANT_ID } from "./tenant-default.js";

export interface WorkspaceService {
  ensurePersonalWorkspace(userId: string): Promise<{ id: string; name: string }>;
  listForUser(userId: string): Promise<Array<{ id: string; name: string; role: string }>>;
  create(userId: string, name: string): Promise<{ id: string; name: string }>;
  addMember(
    ownerUserId: string,
    workspaceId: string,
    memberUserId: string,
    role: "admin" | "editor" | "viewer"
  ): Promise<void>;
  assignWorkflow(
    ownerUserId: string,
    workspaceId: string,
    workflowId: string
  ): Promise<void>;
}

export function createWorkspaceService(db: Database): WorkspaceService {
  return {
    async ensurePersonalWorkspace(userId) {
      const [existing] = await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces)
        .where(and(eq(workspaces.ownerUserId, userId), eq(workspaces.name, "Personal")))
        .limit(1);
      if (existing) return existing;

      const [created] = await db
        .insert(workspaces)
        .values({
          tenantId: DEFAULT_TENANT_ID,
          ownerUserId: userId,
          name: "Personal",
        })
        .returning({ id: workspaces.id, name: workspaces.name });
      if (!created) throw new Error("Failed to create personal workspace");

      await db.insert(workspaceMembers).values({
        tenantId: DEFAULT_TENANT_ID,
        workspaceId: created.id,
        userId,
        role: "admin",
      });

      return created;
    },

    async listForUser(userId) {
      await this.ensurePersonalWorkspace(userId);
      const rows = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.userId, userId));
      return rows;
    },

    async create(userId, name) {
      const normalizedName = name.trim().slice(0, 255);
      if (!normalizedName) throw new Error("Workspace name is required");
      const [workspace] = await db
        .insert(workspaces)
        .values({
          tenantId: DEFAULT_TENANT_ID,
          ownerUserId: userId,
          name: normalizedName,
        })
        .returning({ id: workspaces.id, name: workspaces.name });
      if (!workspace) throw new Error("Failed to create workspace");

      await db.insert(workspaceMembers).values({
        tenantId: DEFAULT_TENANT_ID,
        workspaceId: workspace.id,
        userId,
        role: "admin",
      });
      return workspace;
    },

    async addMember(ownerUserId, workspaceId, memberUserId, role) {
      const [workspace] = await db
        .select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      if (!workspace) throw new Error("Workspace not found");
      if (workspace.ownerUserId !== ownerUserId) {
        throw new Error("Only workspace owner can add members");
      }

      const [existing] = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, memberUserId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(workspaceMembers)
          .set({ role, updatedAt: new Date() })
          .where(eq(workspaceMembers.id, existing.id));
        return;
      }

      await db.insert(workspaceMembers).values({
        tenantId: DEFAULT_TENANT_ID,
        workspaceId,
        userId: memberUserId,
        role,
      });
    },

    async assignWorkflow(ownerUserId, workspaceId, workflowId) {
      const [workspace] = await db
        .select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      if (!workspace || workspace.ownerUserId !== ownerUserId) {
        throw new Error("Workspace not found or access denied");
      }

      const updated = await db
        .update(workflows)
        .set({ workspaceId, updatedAt: new Date() })
        .where(and(eq(workflows.id, workflowId), eq(workflows.userId, ownerUserId)))
        .returning({ id: workflows.id });
      if (updated.length === 0) {
        throw new Error("Workflow not found or access denied");
      }
    },
  };
}
