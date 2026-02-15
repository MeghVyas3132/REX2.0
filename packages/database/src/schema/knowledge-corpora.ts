// ──────────────────────────────────────────────
// REX - Knowledge Corpora Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { executions } from "./executions.js";

export const knowledgeCorpora = pgTable(
  "knowledge_corpora",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2048 }).default("").notNull(),
    scopeType: varchar("scope_type", { length: 30 }).default("user").notNull(), // user | workflow | execution
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
    executionId: uuid("execution_id").references(() => executions.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("ingesting").notNull(), // ingesting | ready | failed
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("knowledge_corpora_user_id_idx").on(table.userId),
    scopeTypeIdx: index("knowledge_corpora_scope_type_idx").on(table.scopeType),
    workflowIdIdx: index("knowledge_corpora_workflow_id_idx").on(table.workflowId),
    executionIdIdx: index("knowledge_corpora_execution_id_idx").on(table.executionId),
    statusIdx: index("knowledge_corpora_status_idx").on(table.status),
  })
);
