// ──────────────────────────────────────────────
// REX - Guardrail Events Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { executions } from "./executions.js";
import { tenants } from "./tenants.js";

export const guardrailEvents = pgTable(
  "guardrail_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id", { length: 255 }).notNull(),
    nodeType: varchar("node_type", { length: 100 }).notNull(),
    guardType: varchar("guard_type", { length: 50 }).notNull(), // input | output
    severity: varchar("severity", { length: 20 }).default("warn").notNull(), // warn | block
    reason: varchar("reason", { length: 1024 }).notNull(),
    payload: jsonb("payload").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("guardrail_events_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("guardrail_events_user_id_idx").on(table.userId),
    workflowIdIdx: index("guardrail_events_workflow_id_idx").on(table.workflowId),
    executionIdIdx: index("guardrail_events_execution_id_idx").on(table.executionId),
    guardTypeIdx: index("guardrail_events_guard_type_idx").on(table.guardType),
    severityIdx: index("guardrail_events_severity_idx").on(table.severity),
  })
);
