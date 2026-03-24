// ──────────────────────────────────────────────
// REX - Workflow Service
// ──────────────────────────────────────────────

import { eq, and, desc, sql, count } from "drizzle-orm";
import type { Database } from "@rex/database";
import { workflows } from "@rex/database";
import { createLogger } from "@rex/utils";
import type { WorkflowNode, WorkflowEdge, WorkflowTemplateId } from "@rex/types";

const logger = createLogger("workflow-service");

export interface WorkflowService {
  create(
    tenantId: string,
    userId: string,
    name: string,
    description: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    sourceTemplate?: WorkflowTemplateSourceInput
  ): Promise<WorkflowRecord>;
  getById(
    tenantId: string,
    userId: string,
    tenantRole: "org_admin" | "org_editor" | "org_viewer",
    workflowId: string
  ): Promise<WorkflowRecord | null>;
  list(
    tenantId: string,
    userId: string,
    tenantRole: "org_admin" | "org_editor" | "org_viewer",
    page: number,
    limit: number
  ): Promise<{ data: WorkflowRecord[]; total: number }>;
  update(
    tenantId: string,
    userId: string,
    tenantRole: "org_admin" | "org_editor" | "org_viewer",
    workflowId: string,
    data: Partial<WorkflowUpdateInput>
  ): Promise<WorkflowRecord>;
  delete(
    tenantId: string,
    userId: string,
    tenantRole: "org_admin" | "org_editor" | "org_viewer",
    workflowId: string
  ): Promise<void>;
}

export interface WorkflowRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: string;
  nodes: unknown;
  edges: unknown;
  version: number;
  sourceTemplateId: string | null;
  sourceTemplateVersion: number | null;
  sourceTemplateParams: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTemplateSourceInput {
  templateId: WorkflowTemplateId;
  templateVersion: number;
  templateParams?: Record<string, unknown>;
}

interface WorkflowUpdateInput {
  name: string;
  description: string;
  status: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function createWorkflowService(db: Database): WorkflowService {
  return {
    async create(tenantId, userId, name, description, nodes, edges, sourceTemplate) {
      logger.info({ userId, name }, "Creating workflow");

      const [workflow] = await db
        .insert(workflows)
        .values({
          tenantId,
          userId,
          name,
          description,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          sourceTemplateId: sourceTemplate?.templateId ?? null,
          sourceTemplateVersion: sourceTemplate?.templateVersion ?? null,
          sourceTemplateParams: sourceTemplate?.templateParams
            ? JSON.parse(JSON.stringify(sourceTemplate.templateParams))
            : null,
        })
        .returning();

      if (!workflow) {
        throw new Error("Failed to create workflow");
      }

      logger.info({ workflowId: workflow.id }, "Workflow created");
      return workflow as WorkflowRecord;
    },

    async getById(tenantId, _userId, tenantRole, workflowId) {
      const isManagerLike = tenantRole === "org_admin" || tenantRole === "org_editor";

      const [workflow] = await db
        .select()
        .from(workflows)
        .where(
          isManagerLike
            ? and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId))
            : and(
                eq(workflows.id, workflowId),
                eq(workflows.tenantId, tenantId),
                eq(workflows.status, "active")
              )
        )
        .limit(1);

      return (workflow as WorkflowRecord) ?? null;
    },

    async list(tenantId, _userId, tenantRole, page, limit) {
      const offset = (page - 1) * limit;
      const isManagerLike = tenantRole === "org_admin" || tenantRole === "org_editor";
      const whereClause = isManagerLike
        ? and(eq(workflows.tenantId, tenantId))
        : and(eq(workflows.tenantId, tenantId), eq(workflows.status, "active"));

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(workflows)
          .where(whereClause)
          .orderBy(desc(workflows.updatedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(workflows)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.total ?? 0;

      return {
        data: data as WorkflowRecord[],
        total,
      };
    },

    async update(tenantId, _userId, tenantRole, workflowId, data) {
      if (tenantRole === "org_viewer") {
        throw new Error("Workflow update is not allowed for viewer role");
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData["name"] = data.name;
      if (data.description !== undefined) updateData["description"] = data.description;
      if (data.status !== undefined) updateData["status"] = data.status;
      if (data.nodes !== undefined) updateData["nodes"] = JSON.parse(JSON.stringify(data.nodes));
      if (data.edges !== undefined) updateData["edges"] = JSON.parse(JSON.stringify(data.edges));

      // Increment version if nodes or edges change
      if (data.nodes !== undefined || data.edges !== undefined) {
        updateData["version"] = sql`${workflows.version} + 1`;
      }

      const [workflow] = await db
        .update(workflows)
        .set(updateData)
        .where(
          and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId))
        )
        .returning();

      if (!workflow) {
        throw new Error("Workflow not found or access denied");
      }

      logger.info({ workflowId }, "Workflow updated");
      return workflow as WorkflowRecord;
    },

    async delete(tenantId, _userId, tenantRole, workflowId) {
      if (tenantRole === "org_viewer") {
        throw new Error("Workflow delete is not allowed for viewer role");
      }

      const result = await db
        .delete(workflows)
        .where(
          and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId))
        )
        .returning({ id: workflows.id });

      if (result.length === 0) {
        throw new Error("Workflow not found or access denied");
      }

      logger.info({ workflowId }, "Workflow deleted");
    },
  };
}
