// ──────────────────────────────────────────────
// REX - Knowledge Chunks Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, integer, text } from "drizzle-orm/pg-core";
import { knowledgeCorpora } from "./knowledge-corpora.js";
import { knowledgeDocuments } from "./knowledge-documents.js";

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    corpusId: uuid("corpus_id")
      .notNull()
      .references(() => knowledgeCorpora.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count"),
    embedding: jsonb("embedding").default([]).notNull(),
    embeddingModel: varchar("embedding_model", { length: 100 }).default("rex-hash-v1").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    corpusIdIdx: index("knowledge_chunks_corpus_id_idx").on(table.corpusId),
    documentIdIdx: index("knowledge_chunks_document_id_idx").on(table.documentId),
    corpusChunkIdx: index("knowledge_chunks_corpus_chunk_idx").on(table.corpusId, table.chunkIndex),
  })
);
