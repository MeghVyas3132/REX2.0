// ──────────────────────────────────────────────
// REX - Workflow Permissions Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";

export const workflowPermissions = pgTable(
  "workflow_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("viewer").notNull(), // viewer | editor
    attributes: jsonb("attributes").default({}).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflow_permissions_workflow_id_idx").on(table.workflowId),
    userIdIdx: index("workflow_permissions_user_id_idx").on(table.userId),
    expiresAtIdx: index("workflow_permissions_expires_at_idx").on(table.expiresAt),
    workflowUserUniqueIdx: uniqueIndex("workflow_permissions_workflow_user_unique").on(
      table.workflowId,
      table.userId
    ),
  })
);
