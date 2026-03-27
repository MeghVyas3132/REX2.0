// ──────────────────────────────────────────────
// REX - Workflows Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";
import { tenants } from "./tenants.js";

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2048 }).default("").notNull(),
    status: varchar("status", { length: 20 }).default("inactive").notNull(), // "active" | "inactive"
    nodes: jsonb("nodes").default([]).notNull(),
    edges: jsonb("edges").default([]).notNull(),
    version: integer("version").default(1).notNull(),
    isAssigned: boolean("is_assigned").default(false).notNull(), // true if assigned by admin, false if user created
    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
    sourceTemplateId: varchar("source_template_id", { length: 100 }),
    sourceTemplateVersion: integer("source_template_version"),
    sourceTemplateParams: jsonb("source_template_params"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("workflows_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("workflows_user_id_idx").on(table.userId),
    workspaceIdIdx: index("workflows_workspace_id_idx").on(table.workspaceId),
    statusIdx: index("workflows_status_idx").on(table.status),
    sourceTemplateIdIdx: index("workflows_source_template_id_idx").on(table.sourceTemplateId),
  })
);
