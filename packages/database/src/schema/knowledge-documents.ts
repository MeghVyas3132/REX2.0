// ──────────────────────────────────────────────
// REX - Knowledge Documents Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, text } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { knowledgeCorpora } from "./knowledge-corpora.js";

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    corpusId: uuid("corpus_id")
      .notNull()
      .references(() => knowledgeCorpora.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 30 }).default("upload").notNull(), // upload | inline | api
    title: varchar("title", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    contentText: text("content_text").notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | processing | ready | failed
    error: varchar("error", { length: 4096 }),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    corpusIdIdx: index("knowledge_documents_corpus_id_idx").on(table.corpusId),
    userIdIdx: index("knowledge_documents_user_id_idx").on(table.userId),
    statusIdx: index("knowledge_documents_status_idx").on(table.status),
    createdAtIdx: index("knowledge_documents_created_at_idx").on(table.createdAt),
  })
);
