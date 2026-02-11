// ──────────────────────────────────────────────
// REX - Execution Steps Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { executions } from "./executions.js";

export const executionSteps = pgTable(
  "execution_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id", { length: 255 }).notNull(),
    nodeType: varchar("node_type", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | running | completed | failed | skipped
    input: jsonb("input").default({}).notNull(),
    output: jsonb("output"),
    durationMs: integer("duration_ms"),
    error: varchar("error", { length: 4096 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    executionIdIdx: index("execution_steps_execution_id_idx").on(table.executionId),
    nodeIdIdx: index("execution_steps_node_id_idx").on(table.nodeId),
  })
);
