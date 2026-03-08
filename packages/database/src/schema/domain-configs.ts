// ──────────────────────────────────────────────
// REX - Domain Configs Table Schema
// Per-user/per-workflow runtime overlays
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";

export const domainConfigs = pgTable(
  "domain_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 80 }).default("default").notNull(),
    config: jsonb("config").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("domain_configs_user_id_idx").on(table.userId),
    workflowIdIdx: index("domain_configs_workflow_id_idx").on(table.workflowId),
    domainIdx: index("domain_configs_domain_idx").on(table.domain),
    activeIdx: index("domain_configs_is_active_idx").on(table.isActive),
  })
);
