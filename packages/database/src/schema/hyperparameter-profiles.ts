// ──────────────────────────────────────────────
// REX - Hyperparameter Profiles Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { tenants } from "./tenants.js";

export const hyperparameterProfiles = pgTable(
  "hyperparameter_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2048 }).default("").notNull(),
    config: jsonb("config").default({}).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("hyperparameter_profiles_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("hyperparameter_profiles_user_id_idx").on(table.userId),
    workflowIdIdx: index("hyperparameter_profiles_workflow_id_idx").on(table.workflowId),
    defaultIdx: index("hyperparameter_profiles_is_default_idx").on(table.isDefault),
    activeIdx: index("hyperparameter_profiles_is_active_idx").on(table.isActive),
  })
);
