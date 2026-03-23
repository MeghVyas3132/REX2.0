// ──────────────────────────────────────────────
// REX - Workspace Members Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";
import { tenants } from "./tenants.js";

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("viewer").notNull(), // admin | editor | viewer
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("workspace_members_tenant_id_idx").on(table.tenantId),
    workspaceIdIdx: index("workspace_members_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("workspace_members_user_id_idx").on(table.userId),
    workspaceUserUniqueIdx: uniqueIndex("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId
    ),
  })
);
