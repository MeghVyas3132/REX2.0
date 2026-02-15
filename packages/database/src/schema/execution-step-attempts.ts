// ──────────────────────────────────────────────
// REX - Execution Step Attempts Table Schema
// Stores per-node per-attempt retry traces
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { executions } from "./executions.js";

export const executionStepAttempts = pgTable(
  "execution_step_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id", { length: 255 }).notNull(),
    nodeType: varchar("node_type", { length: 100 }).notNull(),
    attempt: integer("attempt").notNull(),
    status: varchar("status", { length: 20 }).notNull(), // completed | retry | failed
    durationMs: integer("duration_ms").notNull(),
    reason: varchar("reason", { length: 4096 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    executionIdIdx: index("execution_step_attempts_execution_id_idx").on(table.executionId),
    nodeIdIdx: index("execution_step_attempts_node_id_idx").on(table.nodeId),
    statusIdx: index("execution_step_attempts_status_idx").on(table.status),
    attemptIdx: index("execution_step_attempts_attempt_idx").on(table.attempt),
  })
);
