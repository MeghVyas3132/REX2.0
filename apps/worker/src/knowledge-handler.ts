// ──────────────────────────────────────────────
// REX - Knowledge Ingestion Job Handler
// Chunks documents and stores deterministic embeddings
// ──────────────────────────────────────────────

import type { Job } from "bullmq";
import type { KnowledgeIngestionJobPayload } from "@rex/types";
import type { Database } from "@rex/database";
import {
  knowledgeDocuments,
  knowledgeChunks,
  knowledgeCorpora,
} from "@rex/database";
import { and, eq } from "drizzle-orm";
import {
  createLogger,
  sanitizeErrorMessage,
  chunkText,
  estimateTokens,
  buildDeterministicEmbedding,
} from "@rex/utils";

const logger = createLogger("knowledge-handler");

const EMBEDDING_DIMENSIONS = 64;

export async function handleKnowledgeIngestionJob(
  job: Job<KnowledgeIngestionJobPayload>,
  db: Database
): Promise<void> {
  const { corpusId, documentId, userId } = job.data;

  logger.info({ jobId: job.id, corpusId, documentId }, "Processing knowledge ingestion job");

  await db
    .update(knowledgeDocuments)
    .set({ status: "processing", updatedAt: new Date(), error: null })
    .where(
      and(
        eq(knowledgeDocuments.id, documentId),
        eq(knowledgeDocuments.corpusId, corpusId),
        eq(knowledgeDocuments.userId, userId)
      )
    );

  await db
    .update(knowledgeCorpora)
    .set({ status: "ingesting", updatedAt: new Date() })
    .where(eq(knowledgeCorpora.id, corpusId));

  try {
    const [document] = await db
      .select({
        id: knowledgeDocuments.id,
        corpusId: knowledgeDocuments.corpusId,
        contentText: knowledgeDocuments.contentText,
      })
      .from(knowledgeDocuments)
      .where(
        and(
          eq(knowledgeDocuments.id, documentId),
          eq(knowledgeDocuments.corpusId, corpusId),
          eq(knowledgeDocuments.userId, userId)
        )
      )
      .limit(1);

    if (!document) {
      throw new Error("Knowledge document not found");
    }

    const chunks = chunkText(document.contentText, {
      chunkSizeChars: 1200,
      chunkOverlapChars: 200,
    });
    if (chunks.length === 0) {
      throw new Error("Document content is empty after normalization");
    }

    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));

    await db.insert(knowledgeChunks).values(
      chunks.map((chunk) => ({
        corpusId,
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: estimateTokens(chunk.content),
        embedding: buildDeterministicEmbedding(chunk.content, EMBEDDING_DIMENSIONS),
        embeddingModel: "rex-hash-v1",
        metadata: {
          start: chunk.start,
          end: chunk.end,
        },
      }))
    );

    await db
      .update(knowledgeDocuments)
      .set({ status: "ready", updatedAt: new Date(), error: null })
      .where(eq(knowledgeDocuments.id, documentId));

    await updateCorpusStatus(db, corpusId);

    logger.info({
      jobId: job.id,
      corpusId,
      documentId,
      chunkCount: chunks.length,
    }, "Knowledge ingestion completed");
  } catch (err) {
    const error = sanitizeErrorMessage(err);

    await db
      .update(knowledgeDocuments)
      .set({ status: "failed", error, updatedAt: new Date() })
      .where(eq(knowledgeDocuments.id, documentId));

    await db
      .update(knowledgeCorpora)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(knowledgeCorpora.id, corpusId));

    logger.error({ corpusId, documentId, error }, "Knowledge ingestion failed");
    throw err;
  }
}

async function updateCorpusStatus(db: Database, corpusId: string): Promise<void> {
  const statuses = await db
    .select({ status: knowledgeDocuments.status })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.corpusId, corpusId));

  let status: "ingesting" | "ready" | "failed" = "ready";

  if (statuses.some((row) => row.status === "failed")) {
    status = "failed";
  } else if (
    statuses.some((row) => row.status === "pending" || row.status === "processing")
  ) {
    status = "ingesting";
  }

  await db
    .update(knowledgeCorpora)
    .set({ status, updatedAt: new Date() })
    .where(eq(knowledgeCorpora.id, corpusId));
}
