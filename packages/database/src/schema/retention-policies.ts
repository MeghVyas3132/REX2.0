// ──────────────────────────────────────────────
// REX - Retention Policies Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const retentionPolicies = pgTable(
  "retention_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    resourceType: varchar("resource_type", { length: 80 }).notNull(), // executions | knowledge_documents | guardrail_events | audit_logs
    retentionDays: integer("retention_days").notNull(),
    config: jsonb("config").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("retention_policies_user_id_idx").on(table.userId),
    resourceTypeIdx: index("retention_policies_resource_type_idx").on(table.resourceType),
    activeIdx: index("retention_policies_is_active_idx").on(table.isActive),
  })
);
