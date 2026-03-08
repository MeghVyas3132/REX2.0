// ──────────────────────────────────────────────
// REX - Data Access Audit Logs Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const dataAccessAuditLogs = pgTable(
  "data_access_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectUserId: uuid("subject_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 80 }).notNull(), // export | delete | view | query
    resourceType: varchar("resource_type", { length: 80 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actorUserIdIdx: index("data_access_audit_logs_actor_user_id_idx").on(table.actorUserId),
    subjectUserIdIdx: index("data_access_audit_logs_subject_user_id_idx").on(table.subjectUserId),
    actionIdx: index("data_access_audit_logs_action_idx").on(table.action),
    createdAtIdx: index("data_access_audit_logs_created_at_idx").on(table.createdAt),
  })
);
