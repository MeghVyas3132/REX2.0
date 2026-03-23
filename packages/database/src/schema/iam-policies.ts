// ──────────────────────────────────────────────
// REX - IAM Policies Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { tenants } from "./tenants.js";

export const iamPolicies = pgTable(
  "iam_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 40 }).notNull(), // view | edit | delete | execute | manage
    effect: varchar("effect", { length: 10 }).default("allow").notNull(), // allow | deny
    conditions: jsonb("conditions").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("iam_policies_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("iam_policies_user_id_idx").on(table.userId),
    workflowIdIdx: index("iam_policies_workflow_id_idx").on(table.workflowId),
    actionIdx: index("iam_policies_action_idx").on(table.action),
    activeIdx: index("iam_policies_is_active_idx").on(table.isActive),
  })
);
