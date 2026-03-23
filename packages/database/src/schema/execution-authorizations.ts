// ──────────────────────────────────────────────
// REX - Execution Authorizations Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, boolean, jsonb } from "drizzle-orm/pg-core";
import { executions } from "./executions.js";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { tenants } from "./tenants.js";

export const executionAuthorizations = pgTable(
  "execution_authorizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 40 }).default("execute").notNull(),
    attributes: jsonb("attributes").default({}).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("execution_authorizations_tenant_id_idx").on(table.tenantId),
    executionIdIdx: index("execution_authorizations_execution_id_idx").on(table.executionId),
    workflowIdIdx: index("execution_authorizations_workflow_id_idx").on(table.workflowId),
    userIdIdx: index("execution_authorizations_user_id_idx").on(table.userId),
    expiresAtIdx: index("execution_authorizations_expires_at_idx").on(table.expiresAt),
    revokedIdx: index("execution_authorizations_revoked_idx").on(table.revoked),
  })
);
