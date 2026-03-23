// ──────────────────────────────────────────────
// REX - Alert Rules Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { tenants } from "./tenants.js";

export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
    ruleType: varchar("rule_type", { length: 50 }).notNull(), // latency-breach | corpus-health-alert | guardrail-triggered
    severity: varchar("severity", { length: 20 }).default("warn").notNull(), // warn | critical
    threshold: integer("threshold").default(1).notNull(),
    windowMinutes: integer("window_minutes").default(60).notNull(),
    config: jsonb("config").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("alert_rules_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("alert_rules_user_id_idx").on(table.userId),
    workflowIdIdx: index("alert_rules_workflow_id_idx").on(table.workflowId),
    ruleTypeIdx: index("alert_rules_rule_type_idx").on(table.ruleType),
    activeIdx: index("alert_rules_is_active_idx").on(table.isActive),
  })
);
