// ──────────────────────────────────────────────
// REX - Alert Events Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { alertRules } from "./alert-rules.js";

export const alertEvents = pgTable(
  "alert_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
    alertRuleId: uuid("alert_rule_id").references(() => alertRules.id, { onDelete: "set null" }),
    ruleType: varchar("rule_type", { length: 50 }).notNull(),
    severity: varchar("severity", { length: 20 }).default("warn").notNull(),
    message: varchar("message", { length: 1024 }).notNull(),
    payload: jsonb("payload").default({}).notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("alert_events_user_id_idx").on(table.userId),
    workflowIdIdx: index("alert_events_workflow_id_idx").on(table.workflowId),
    ruleTypeIdx: index("alert_events_rule_type_idx").on(table.ruleType),
    severityIdx: index("alert_events_severity_idx").on(table.severity),
    triggeredAtIdx: index("alert_events_triggered_at_idx").on(table.triggeredAt),
  })
);
