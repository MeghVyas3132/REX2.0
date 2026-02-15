// ──────────────────────────────────────────────
// REX - Execution Context Snapshots Table Schema
// Persists mutable execution context independently
// from per-step node outputs
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { executions } from "./executions.js";

export const executionContextSnapshots = pgTable(
  "execution_context_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    reason: varchar("reason", { length: 20 }).notNull(), // init | step | final | error
    nodeId: varchar("node_id", { length: 255 }),
    nodeType: varchar("node_type", { length: 100 }),
    state: jsonb("state").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    executionIdIdx: index("execution_context_snapshots_execution_id_idx").on(table.executionId),
    executionSequenceIdx: index("execution_context_snapshots_execution_sequence_idx").on(
      table.executionId,
      table.sequence
    ),
    reasonIdx: index("execution_context_snapshots_reason_idx").on(table.reason),
  })
);
