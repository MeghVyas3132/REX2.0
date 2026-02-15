// ──────────────────────────────────────────────
// REX - Knowledge Service
// Creates corpora/documents and enqueues ingestion jobs
// ──────────────────────────────────────────────

import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  knowledgeCorpora,
  knowledgeDocuments,
  knowledgeChunks,
  workflows,
  executions,
} from "@rex/database";
import type {
  KnowledgeScopeType,
  KnowledgeSourceType,
  KnowledgeCorpusStatus,
  KnowledgeDocumentStatus,
} from "@rex/types";
import {
  createLogger,
  sanitizeErrorMessage,
  buildDeterministicEmbedding,
  cosineSimilarity,
  parseEmbedding,
} from "@rex/utils";
import { enqueueKnowledgeIngestion } from "../queue/client.js";

const logger = createLogger("knowledge-service");

export interface CreateKnowledgeCorpusInput {
  name: string;
  description?: string;
  scopeType?: KnowledgeScopeType;
  workflowId?: string;
  executionId?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestKnowledgeDocumentInput {
  corpusId: string;
  title: string;
  contentText: string;
  sourceType?: KnowledgeSourceType;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeService {
  createCorpus(userId: string, input: CreateKnowledgeCorpusInput): Promise<{ id: string }>;
  ingestDocument(userId: string, input: IngestKnowledgeDocumentInput): Promise<{ documentId: string; jobId: string }>;
  listCorpora(
    userId: string,
    filters: ListKnowledgeCorporaFilters,
    page: number,
    limit: number
  ): Promise<{ data: KnowledgeCorpusRecord[]; total: number }>;
  listDocuments(
    userId: string,
    corpusId: string,
    page: number,
    limit: number
  ): Promise<{ data: KnowledgeDocumentRecord[]; total: number }>;
  listChunks(
    userId: string,
    documentId: string,
    page: number,
    limit: number
  ): Promise<{ data: KnowledgeChunkRecord[]; total: number }>;
  query(userId: string, input: QueryKnowledgeInput): Promise<QueryKnowledgeResult>;
}

export interface ListKnowledgeCorporaFilters {
  scopeType?: KnowledgeScopeType;
  workflowId?: string;
  executionId?: string;
}

export interface QueryKnowledgeInput {
  query: string;
  topK: number;
  corpusId?: string;
  scopeType?: KnowledgeScopeType;
  workflowId?: string;
  executionId?: string;
}

interface KnowledgeCorpusRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  scopeType: string;
  workflowId: string | null;
  executionId: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface KnowledgeDocumentRecord {
  id: string;
  corpusId: string;
  userId: string;
  sourceType: string;
  title: string;
  mimeType: string | null;
  status: string;
  error: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface KnowledgeChunkRecord {
  id: string;
  corpusId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  embeddingModel: string;
  metadata: unknown;
  createdAt: Date;
}

interface QueryKnowledgeResult {
  query: string;
  matches: Array<{
    corpusId: string;
    documentId: string;
    chunkId: string;
    chunkIndex: number;
    score: number;
    content: string;
    title: string;
    sourceType: string;
    metadata: unknown;
  }>;
}

export function createKnowledgeService(db: Database): KnowledgeService {
  return {
    async createCorpus(userId, input) {
      const scopeType = input.scopeType ?? "user";
      const status: KnowledgeCorpusStatus = "ingesting";

      if (scopeType === "workflow" && !input.workflowId) {
        throw new Error("workflowId is required when scopeType is workflow");
      }
      if (scopeType === "execution" && !input.executionId) {
        throw new Error("executionId is required when scopeType is execution");
      }

      if (input.workflowId) {
        const [workflow] = await db
          .select({ id: workflows.id })
          .from(workflows)
          .where(and(eq(workflows.id, input.workflowId), eq(workflows.userId, userId)))
          .limit(1);
        if (!workflow) {
          throw new Error("Workflow not found or access denied");
        }
      }

      if (input.executionId) {
        const [execution] = await db
          .select({ id: executions.id, workflowId: executions.workflowId })
          .from(executions)
          .where(eq(executions.id, input.executionId))
          .limit(1);
        if (!execution) {
          throw new Error("Execution not found");
        }

        const [workflow] = await db
          .select({ id: workflows.id })
          .from(workflows)
          .where(and(eq(workflows.id, execution.workflowId), eq(workflows.userId, userId)))
          .limit(1);
        if (!workflow) {
          throw new Error("Execution not found or access denied");
        }
      }

      const [corpus] = await db
        .insert(knowledgeCorpora)
        .values({
          userId,
          name: input.name,
          description: input.description ?? "",
          scopeType,
          workflowId: input.workflowId ?? null,
          executionId: input.executionId ?? null,
          status,
          metadata: input.metadata ?? {},
        })
        .returning({ id: knowledgeCorpora.id });

      if (!corpus) {
        throw new Error("Failed to create knowledge corpus");
      }

      logger.info({ corpusId: corpus.id, userId, scopeType }, "Knowledge corpus created");
      return { id: corpus.id };
    },

    async ingestDocument(userId, input) {
      const [corpus] = await db
        .select({ id: knowledgeCorpora.id, userId: knowledgeCorpora.userId })
        .from(knowledgeCorpora)
        .where(eq(knowledgeCorpora.id, input.corpusId))
        .limit(1);

      if (!corpus || corpus.userId !== userId) {
        throw new Error("Knowledge corpus not found or access denied");
      }

      const status: KnowledgeDocumentStatus = "pending";
      const [document] = await db
        .insert(knowledgeDocuments)
        .values({
          corpusId: input.corpusId,
          userId,
          sourceType: input.sourceType ?? "upload",
          title: input.title,
          mimeType: input.mimeType ?? null,
          contentText: input.contentText,
          status,
          metadata: input.metadata ?? {},
        })
        .returning({ id: knowledgeDocuments.id });

      if (!document) {
        throw new Error("Failed to create knowledge document");
      }

      let jobId: string;
      try {
        jobId = await enqueueKnowledgeIngestion({
          corpusId: input.corpusId,
          documentId: document.id,
          userId,
        });
      } catch (err) {
        const error = sanitizeErrorMessage(err);
        await db
          .update(knowledgeDocuments)
          .set({
            status: "failed",
            error,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeDocuments.id, document.id));
        throw err;
      }

      logger.info({
        userId,
        corpusId: input.corpusId,
        documentId: document.id,
        jobId,
      }, "Knowledge document ingestion enqueued");

      return { documentId: document.id, jobId };
    },

    async listCorpora(userId, filters, page, limit) {
      const conditions = [eq(knowledgeCorpora.userId, userId)];
      if (filters.scopeType) {
        conditions.push(eq(knowledgeCorpora.scopeType, filters.scopeType));
      }
      if (filters.workflowId) {
        conditions.push(eq(knowledgeCorpora.workflowId, filters.workflowId));
      }
      if (filters.executionId) {
        conditions.push(eq(knowledgeCorpora.executionId, filters.executionId));
      }

      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      const offset = (page - 1) * limit;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(knowledgeCorpora)
          .where(whereClause)
          .orderBy(desc(knowledgeCorpora.updatedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(knowledgeCorpora)
          .where(whereClause),
      ]);

      return {
        data: data as KnowledgeCorpusRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async listDocuments(userId, corpusId, page, limit) {
      const [corpus] = await db
        .select({ id: knowledgeCorpora.id })
        .from(knowledgeCorpora)
        .where(and(eq(knowledgeCorpora.id, corpusId), eq(knowledgeCorpora.userId, userId)))
        .limit(1);

      if (!corpus) {
        throw new Error("Knowledge corpus not found or access denied");
      }

      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db
          .select({
            id: knowledgeDocuments.id,
            corpusId: knowledgeDocuments.corpusId,
            userId: knowledgeDocuments.userId,
            sourceType: knowledgeDocuments.sourceType,
            title: knowledgeDocuments.title,
            mimeType: knowledgeDocuments.mimeType,
            status: knowledgeDocuments.status,
            error: knowledgeDocuments.error,
            metadata: knowledgeDocuments.metadata,
            createdAt: knowledgeDocuments.createdAt,
            updatedAt: knowledgeDocuments.updatedAt,
          })
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.corpusId, corpusId))
          .orderBy(desc(knowledgeDocuments.updatedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.corpusId, corpusId)),
      ]);

      return {
        data: data as KnowledgeDocumentRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async listChunks(userId, documentId, page, limit) {
      const [document] = await db
        .select({
          id: knowledgeDocuments.id,
          userId: knowledgeDocuments.userId,
        })
        .from(knowledgeDocuments)
        .where(eq(knowledgeDocuments.id, documentId))
        .limit(1);

      if (!document || document.userId !== userId) {
        throw new Error("Knowledge document not found or access denied");
      }

      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db
          .select({
            id: knowledgeChunks.id,
            corpusId: knowledgeChunks.corpusId,
            documentId: knowledgeChunks.documentId,
            chunkIndex: knowledgeChunks.chunkIndex,
            content: knowledgeChunks.content,
            tokenCount: knowledgeChunks.tokenCount,
            embeddingModel: knowledgeChunks.embeddingModel,
            metadata: knowledgeChunks.metadata,
            createdAt: knowledgeChunks.createdAt,
          })
          .from(knowledgeChunks)
          .where(eq(knowledgeChunks.documentId, documentId))
          .orderBy(knowledgeChunks.chunkIndex)
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(knowledgeChunks)
          .where(eq(knowledgeChunks.documentId, documentId)),
      ]);

      return {
        data: data as KnowledgeChunkRecord[],
        total: totalResult[0]?.total ?? 0,
      };
    },

    async query(userId, input) {
      const topK = Math.max(1, Math.min(Math.floor(input.topK), 50));
      const scope = normalizeQueryScope(input);
      const corpusConditions = [eq(knowledgeCorpora.userId, userId)];
      if (input.corpusId) corpusConditions.push(eq(knowledgeCorpora.id, input.corpusId));
      if (scope.scopeType) corpusConditions.push(eq(knowledgeCorpora.scopeType, scope.scopeType));
      if (scope.workflowId) corpusConditions.push(eq(knowledgeCorpora.workflowId, scope.workflowId));
      if (scope.executionId) corpusConditions.push(eq(knowledgeCorpora.executionId, scope.executionId));

      const corpusWhere = corpusConditions.length === 1 ? corpusConditions[0] : and(...corpusConditions);
      const corpora = await db
        .select({ id: knowledgeCorpora.id })
        .from(knowledgeCorpora)
        .where(corpusWhere);

      const corpusIds = corpora.map((c) => c.id);
      if (corpusIds.length === 0) {
        return { query: input.query, matches: [] };
      }

      const candidateLimit = Math.max(Math.min(topK * 40, 1000), topK * 5);
      const candidates = await db
        .select({
          chunkId: knowledgeChunks.id,
          corpusId: knowledgeChunks.corpusId,
          documentId: knowledgeChunks.documentId,
          chunkIndex: knowledgeChunks.chunkIndex,
          content: knowledgeChunks.content,
          embedding: knowledgeChunks.embedding,
          metadata: knowledgeChunks.metadata,
          title: knowledgeDocuments.title,
          sourceType: knowledgeDocuments.sourceType,
        })
        .from(knowledgeChunks)
        .innerJoin(knowledgeDocuments, eq(knowledgeDocuments.id, knowledgeChunks.documentId))
        .where(inArray(knowledgeChunks.corpusId, corpusIds))
        .limit(candidateLimit);

      const queryEmbedding = buildDeterministicEmbedding(input.query, 64);

      const ranked = candidates
        .map((candidate) => {
          const embedding = parseEmbedding(candidate.embedding);
          const score = cosineSimilarity(queryEmbedding, embedding);
          return {
            corpusId: candidate.corpusId,
            documentId: candidate.documentId,
            chunkId: candidate.chunkId,
            chunkIndex: candidate.chunkIndex,
            score,
            content: candidate.content,
            title: candidate.title,
            sourceType: candidate.sourceType,
            metadata: candidate.metadata,
          };
        })
        .filter((item) => Number.isFinite(item.score))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return {
        query: input.query,
        matches: ranked,
      };
    },
  };
}

function normalizeQueryScope(input: QueryKnowledgeInput): {
  scopeType?: KnowledgeScopeType;
  workflowId?: string;
  executionId?: string;
} {
  if (input.scopeType === "workflow") {
    return {
      scopeType: "workflow",
      workflowId: input.workflowId,
    };
  }

  if (input.scopeType === "execution") {
    return {
      scopeType: "execution",
      executionId: input.executionId,
    };
  }

  return {
    scopeType: input.scopeType,
    workflowId: input.workflowId,
    executionId: input.executionId,
  };
}
