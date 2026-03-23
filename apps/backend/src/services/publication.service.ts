import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { workflowPublications, workflows } from "@rex/database";

interface PublicationInput {
  workflowId: string;
  title: string;
  description?: string;
  icon?: string;
  inputSchema: Record<string, unknown>;
  outputDisplay: Record<string, unknown>;
  category?: string;
  tags?: string[];
}

export interface PublicationService {
  create(tenantId: string, actorUserId: string, input: PublicationInput): Promise<{ id: string }>;
  list(tenantId: string, includeUnpublished?: boolean): Promise<Array<{
    id: string;
    workflowId: string;
    title: string;
    description: string | null;
    icon: string | null;
    category: string | null;
    tags: string[];
    isPublished: boolean;
    publishedAt: Date | null;
  }>>;
  getById(tenantId: string, publicationId: string): Promise<{
    id: string;
    workflowId: string;
    title: string;
    description: string | null;
    icon: string | null;
    inputSchema: Record<string, unknown>;
    outputDisplay: Record<string, unknown>;
    category: string | null;
    tags: string[];
    isPublished: boolean;
    publishedAt: Date | null;
  } | null>;
  update(tenantId: string, publicationId: string, input: Partial<PublicationInput>): Promise<{ id: string }>;
  remove(tenantId: string, publicationId: string): Promise<void>;
  publish(tenantId: string, publicationId: string, actorUserId: string): Promise<{ id: string }>;
  unpublish(tenantId: string, publicationId: string): Promise<{ id: string }>;
}

export function createPublicationService(db: Database): PublicationService {
  return {
    async create(tenantId, actorUserId, input) {
      const [workflow] = await db
        .select({ id: workflows.id })
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.tenantId, tenantId)))
        .limit(1);

      if (!workflow) throw new Error("Workflow not found");

      const [created] = await db
        .insert(workflowPublications)
        .values({
          tenantId,
          workflowId: input.workflowId,
          title: input.title,
          description: input.description ?? null,
          icon: input.icon ?? null,
          inputSchema: input.inputSchema,
          outputDisplay: input.outputDisplay,
          category: input.category ?? null,
          tags: input.tags ?? [],
          publishedBy: actorUserId,
          isPublished: false,
        })
        .onConflictDoUpdate({
          target: workflowPublications.workflowId,
          set: {
            title: input.title,
            description: input.description ?? null,
            icon: input.icon ?? null,
            inputSchema: input.inputSchema,
            outputDisplay: input.outputDisplay,
            category: input.category ?? null,
            tags: input.tags ?? [],
          },
        })
        .returning({ id: workflowPublications.id });

      if (!created) throw new Error("Failed to create publication");
      return created;
    },

    async list(tenantId, includeUnpublished = true) {
      const rows = await db
        .select({
          id: workflowPublications.id,
          workflowId: workflowPublications.workflowId,
          title: workflowPublications.title,
          description: workflowPublications.description,
          icon: workflowPublications.icon,
          category: workflowPublications.category,
          tags: workflowPublications.tags,
          isPublished: workflowPublications.isPublished,
          publishedAt: workflowPublications.publishedAt,
        })
        .from(workflowPublications)
        .where(
          includeUnpublished
            ? eq(workflowPublications.tenantId, tenantId)
            : and(
                eq(workflowPublications.tenantId, tenantId),
                eq(workflowPublications.isPublished, true)
              )
        )
        .orderBy(desc(workflowPublications.createdAt));

      return rows;
    },

    async getById(tenantId, publicationId) {
      const [row] = await db
        .select({
          id: workflowPublications.id,
          workflowId: workflowPublications.workflowId,
          title: workflowPublications.title,
          description: workflowPublications.description,
          icon: workflowPublications.icon,
          inputSchema: workflowPublications.inputSchema,
          outputDisplay: workflowPublications.outputDisplay,
          category: workflowPublications.category,
          tags: workflowPublications.tags,
          isPublished: workflowPublications.isPublished,
          publishedAt: workflowPublications.publishedAt,
        })
        .from(workflowPublications)
        .where(and(eq(workflowPublications.id, publicationId), eq(workflowPublications.tenantId, tenantId)))
        .limit(1);

      if (!row) return null;
      return {
        ...row,
        inputSchema: toRecord(row.inputSchema),
        outputDisplay: toRecord(row.outputDisplay),
      };
    },

    async update(tenantId, publicationId, input) {
      const [updated] = await db
        .update(workflowPublications)
        .set({
          title: input.title,
          description: input.description,
          icon: input.icon,
          inputSchema: input.inputSchema,
          outputDisplay: input.outputDisplay,
          category: input.category,
          tags: input.tags,
        })
        .where(and(eq(workflowPublications.id, publicationId), eq(workflowPublications.tenantId, tenantId)))
        .returning({ id: workflowPublications.id });

      if (!updated) throw new Error("Publication not found");
      return updated;
    },

    async remove(tenantId, publicationId) {
      await db
        .delete(workflowPublications)
        .where(and(eq(workflowPublications.id, publicationId), eq(workflowPublications.tenantId, tenantId)));
    },

    async publish(tenantId, publicationId, actorUserId) {
      const [updated] = await db
        .update(workflowPublications)
        .set({
          isPublished: true,
          publishedAt: new Date(),
          publishedBy: actorUserId,
        })
        .where(and(eq(workflowPublications.id, publicationId), eq(workflowPublications.tenantId, tenantId)))
        .returning({ id: workflowPublications.id });

      if (!updated) throw new Error("Publication not found");
      return updated;
    },

    async unpublish(tenantId, publicationId) {
      const [updated] = await db
        .update(workflowPublications)
        .set({ isPublished: false, publishedAt: null })
        .where(and(eq(workflowPublications.id, publicationId), eq(workflowPublications.tenantId, tenantId)))
        .returning({ id: workflowPublications.id });

      if (!updated) throw new Error("Publication not found");
      return updated;
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
