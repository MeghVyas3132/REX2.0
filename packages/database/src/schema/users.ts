// ──────────────────────────────────────────────
// REX - Users Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).default("editor").notNull(), // admin | editor | viewer (legacy, per-tenant role now in tenant_users)
    globalRole: varchar("global_role", { length: 20 }).default("user").notNull(), // super_admin | user
    consentGivenAt: timestamp("consent_given_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    globalRoleIdx: index("users_global_role_idx").on(table.globalRole),
  })
);
