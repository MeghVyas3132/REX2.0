// ──────────────────────────────────────────────
// REX - Knowledge Ingestion Job Handler
// Chunks documents and stores deterministic embeddings
// ──────────────────────────────────────────────

import type { Job } from "bullmq";
import type { ApiProviderType, EmbeddingProviderType, KnowledgeIngestionJobPayload } from "@rex/types";
import type { Database } from "@rex/database";
import {
  apiKeys,
  domainConfigs,
  knowledgeDocuments,
  knowledgeChunks,
  knowledgeCorpora,
} from "@rex/database";
import { and, eq, isNull, or } from "drizzle-orm";
import {
  createLogger,
  decrypt,
  loadConfig,
  sanitizeErrorMessage,
  chunkText,
  estimateTokens,
  buildDeterministicEmbedding,
} from "@rex/utils";

const logger = createLogger("knowledge-handler");
const EMBEDDING_DIMENSIONS = 1536;

export async function handleKnowledgeIngestionJob(
  job: Job<KnowledgeIngestionJobPayload>,
  db: Database
): Promise<void> {
  const { corpusId, documentId, userId } = job.data;
  const config = loadConfig();

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

    const [corpus] = await db
      .select({ workflowId: knowledgeCorpora.workflowId })
      .from(knowledgeCorpora)
      .where(eq(knowledgeCorpora.id, corpusId))
      .limit(1);
    const embeddingSettings = await resolveEmbeddingSettings(db, userId, corpus?.workflowId ?? undefined);
    const getProviderApiKey = async (provider: ApiProviderType): Promise<string | null> => {
      const [key] = await db
        .select({ encryptedKey: apiKeys.encryptedKey })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
        .limit(1);
      if (!key) return null;
      return decrypt(key.encryptedKey, config.encryption.masterKey);
    };

    const chunks = chunkDocumentByPage(document.contentText);
    if (chunks.length === 0) {
      throw new Error("Document content is empty after normalization");
    }

    const vectors = await embedChunkContents(
      chunks.map((chunk) => chunk.content),
      embeddingSettings.provider,
      embeddingSettings.model,
      getProviderApiKey
    );

    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));

    await db.insert(knowledgeChunks).values(
      chunks.map((chunk, index) => ({
        corpusId,
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: estimateTokens(chunk.content),
        embedding: vectors[index] ?? [],
        embeddingVector: toVectorLiteral(vectors[index] ?? []),
        embeddingModel: embeddingSettings.model,
        pageNumber: chunk.pageNumber,
        sectionPath: chunk.sectionPath,
        metadata: {
          start: chunk.startOffset,
          end: chunk.endOffset,
          pageNumber: chunk.pageNumber,
          sectionPath: chunk.sectionPath,
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

async function resolveEmbeddingSettings(
  db: Database,
  userId: string,
  workflowId?: string
): Promise<{ provider: EmbeddingProviderType; model: string }> {
  const rows = await db
    .select({
      config: domainConfigs.config,
      userId: domainConfigs.userId,
      workflowId: domainConfigs.workflowId,
    })
    .from(domainConfigs)
    .where(
      and(
        eq(domainConfigs.isActive, true),
        or(eq(domainConfigs.userId, userId), isNull(domainConfigs.userId)),
        workflowId
          ? or(eq(domainConfigs.workflowId, workflowId), isNull(domainConfigs.workflowId))
          : isNull(domainConfigs.workflowId)
      )
    );

  const sorted = rows.sort((a, b) => {
    const left = (a.userId ? 1 : 0) + (a.workflowId ? 2 : 0);
    const right = (b.userId ? 1 : 0) + (b.workflowId ? 2 : 0);
    return left - right;
  });
  const merged = sorted.reduce<Record<string, unknown>>(
    (acc, row) => deepMerge(acc, toRecord(row.config)),
    {}
  );
  const retrieval = toRecord(merged["retrieval"]);
  const provider = parseEmbeddingProvider(retrieval["embeddingProvider"]) ?? "deterministic";
  const model = asString(retrieval["embeddingModel"]) ?? "rex-hash-v1-1536";

  return { provider, model };
}

async function embedChunkContents(
  texts: string[],
  provider: EmbeddingProviderType,
  model: string,
  getProviderApiKey: (provider: ApiProviderType) => Promise<string | null>
): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    if (provider === "openai") {
      const key = await getProviderApiKey("openai");
      if (key) {
        return await embedWithOpenAI(texts, key, model);
      }
      logger.warn({ provider }, "OpenAI API key missing; using deterministic embeddings");
    }

    if (provider === "cohere") {
      const key = await getProviderApiKey("cohere");
      if (key) {
        return await embedWithCohere(texts, key, model);
      }
      logger.warn({ provider }, "Cohere API key missing; using deterministic embeddings");
    }

    return texts.map((text) => buildDeterministicEmbedding(text, EMBEDDING_DIMENSIONS));
  } catch (err) {
    logger.warn(
      { provider, error: err instanceof Error ? err.message : "Unknown error" },
      "Embedding request failed; falling back to deterministic embeddings"
    );
    return texts.map((text) => buildDeterministicEmbedding(text, EMBEDDING_DIMENSIONS));
  }
}

async function embedWithOpenAI(
  texts: string[],
  apiKey: string,
  model?: string
): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model ?? "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
  }
  const json = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  return (json.data ?? []).map((item) => item.embedding ?? []);
}

async function embedWithCohere(
  texts: string[],
  apiKey: string,
  model?: string
): Promise<number[][]> {
  const response = await fetch("https://api.cohere.com/v1/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model ?? "embed-english-v3.0",
      texts,
      input_type: "search_document",
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Cohere embeddings failed (${response.status}): ${body}`);
  }
  const json = (await response.json()) as { embeddings?: number[][] };
  return json.embeddings ?? [];
}

interface ChunkWithPage {
  index: number;
  content: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
  sectionPath: string;
}

function chunkDocumentByPage(contentText: string): ChunkWithPage[] {
  const pages = contentText.split("\f");
  const chunks: ChunkWithPage[] = [];
  let index = 0;
  let offset = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex] ?? "";
    const pageNumber = pageIndex + 1;
    const sectionPath = extractSectionPath(page, pageNumber);
    const pageChunks = chunkText(page, {
      chunkSizeChars: 1200,
      chunkOverlapChars: 200,
    });

    for (const chunk of pageChunks) {
      chunks.push({
        index,
        content: chunk.content,
        startOffset: offset + chunk.start,
        endOffset: offset + chunk.end,
        pageNumber,
        sectionPath,
      });
      index += 1;
    }

    offset += page.length + 1;
  }

  return chunks;
}

function extractSectionPath(pageText: string, pageNumber: number): string {
  for (const rawLine of pageText.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) return line.replace(/^#+\s*/, "").slice(0, 255);
    if (line.toUpperCase() === line && line.length >= 5 && line.length <= 80) {
      return line.slice(0, 255);
    }
  }
  return `page-${pageNumber}`;
}

function parseEmbeddingProvider(value: unknown): EmbeddingProviderType | null {
  if (value === "deterministic" || value === "openai" || value === "cohere") {
    return value;
  }
  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, overlayValue] of Object.entries(overlay)) {
    const baseValue = out[key];
    if (
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue) &&
      overlayValue &&
      typeof overlayValue === "object" &&
      !Array.isArray(overlayValue)
    ) {
      out[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overlayValue as Record<string, unknown>
      );
      continue;
    }
    out[key] = overlayValue;
  }
  return out;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toVectorLiteral(vector: number[]): string {
  const values = vector
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value.toFixed(8)));
  return `[${values.join(",")}]`;
}
