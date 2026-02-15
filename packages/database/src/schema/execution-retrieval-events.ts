// ──────────────────────────────────────────────
// REX - Execution Retrieval Events Table Schema
// Stores per-attempt retrieval traces for observability
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp, index, text, boolean } from "drizzle-orm/pg-core";
import { executions } from "./executions.js";

export const executionRetrievalEvents = pgTable(
  "execution_retrieval_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id", { length: 255 }).notNull(),
    nodeType: varchar("node_type", { length: 100 }).notNull(),
    query: text("query").notNull(),
    topK: integer("top_k").notNull(),
    attempt: integer("attempt").notNull(),
    maxAttempts: integer("max_attempts").notNull(),
    status: varchar("status", { length: 20 }).notNull(), // success | empty | failed
    matchesCount: integer("matches_count").default(0).notNull(),
    durationMs: integer("duration_ms").notNull(),
    errorMessage: varchar("error_message", { length: 4096 }),
    scopeType: varchar("scope_type", { length: 30 }),
    corpusId: uuid("corpus_id"),
    workflowIdScope: uuid("workflow_id_scope"),
    executionIdScope: uuid("execution_id_scope"),
    strategy: varchar("strategy", { length: 40 }),
    retrieverKey: varchar("retriever_key", { length: 100 }),
    branchIndex: integer("branch_index"),
    selected: boolean("selected"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    executionIdIdx: index("execution_retrieval_events_execution_id_idx").on(table.executionId),
    nodeIdIdx: index("execution_retrieval_events_node_id_idx").on(table.nodeId),
    statusIdx: index("execution_retrieval_events_status_idx").on(table.status),
    retrieverKeyIdx: index("execution_retrieval_events_retriever_key_idx").on(table.retrieverKey),
    strategyIdx: index("execution_retrieval_events_strategy_idx").on(table.strategy),
  })
);
