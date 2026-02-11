// ──────────────────────────────────────────────
// REX - Workflows Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2048 }).default("").notNull(),
    status: varchar("status", { length: 20 }).default("inactive").notNull(), // "active" | "inactive"
    nodes: jsonb("nodes").default([]).notNull(),
    edges: jsonb("edges").default([]).notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("workflows_user_id_idx").on(table.userId),
    statusIdx: index("workflows_status_idx").on(table.status),
  })
);
