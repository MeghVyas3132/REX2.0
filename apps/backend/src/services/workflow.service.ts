// ──────────────────────────────────────────────
// REX - Workflow Service
// ──────────────────────────────────────────────

import { eq, and, desc, sql, count } from "drizzle-orm";
import type { Database } from "@rex/database";
import { workflows } from "@rex/database";
import { createLogger } from "@rex/utils";
import type { WorkflowNode, WorkflowEdge } from "@rex/types";

const logger = createLogger("workflow-service");

export interface WorkflowService {
  create(
    userId: string,
    name: string,
    description: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<WorkflowRecord>;
  getById(userId: string, workflowId: string): Promise<WorkflowRecord | null>;
  list(userId: string, page: number, limit: number): Promise<{ data: WorkflowRecord[]; total: number }>;
  update(userId: string, workflowId: string, data: Partial<WorkflowUpdateInput>): Promise<WorkflowRecord>;
  delete(userId: string, workflowId: string): Promise<void>;
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
  createdAt: Date;
  updatedAt: Date;
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
    async create(userId, name, description, nodes, edges) {
      logger.info({ userId, name }, "Creating workflow");

      const [workflow] = await db
        .insert(workflows)
        .values({
          userId,
          name,
          description,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        })
        .returning();

      if (!workflow) {
        throw new Error("Failed to create workflow");
      }

      logger.info({ workflowId: workflow.id }, "Workflow created");
      return workflow as WorkflowRecord;
    },

    async getById(userId, workflowId) {
      const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
        .limit(1);

      return (workflow as WorkflowRecord) ?? null;
    },

    async list(userId, page, limit) {
      const offset = (page - 1) * limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(workflows)
          .where(eq(workflows.userId, userId))
          .orderBy(desc(workflows.updatedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(workflows)
          .where(eq(workflows.userId, userId)),
      ]);

      const total = totalResult[0]?.total ?? 0;

      return {
        data: data as WorkflowRecord[],
        total,
      };
    },

    async update(userId, workflowId, data) {
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
        .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
        .returning();

      if (!workflow) {
        throw new Error("Workflow not found or access denied");
      }

      logger.info({ workflowId }, "Workflow updated");
      return workflow as WorkflowRecord;
    },

    async delete(userId, workflowId) {
      const result = await db
        .delete(workflows)
        .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
        .returning({ id: workflows.id });

      if (result.length === 0) {
        throw new Error("Workflow not found or access denied");
      }

      logger.info({ workflowId }, "Workflow deleted");
    },
  };
}
