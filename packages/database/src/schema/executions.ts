// ──────────────────────────────────────────────
// REX - Executions Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { workflows } from "./workflows.js";

export const executions = pgTable(
  "executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | running | completed | failed
    triggerPayload: jsonb("trigger_payload").default({}).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    errorMessage: varchar("error_message", { length: 4096 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("executions_workflow_id_idx").on(table.workflowId),
    statusIdx: index("executions_status_idx").on(table.status),
    createdAtIdx: index("executions_created_at_idx").on(table.createdAt),
  })
);
