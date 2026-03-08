// ──────────────────────────────────────────────
// REX - Hyperparameter Experiments Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { hyperparameterProfiles } from "./hyperparameter-profiles.js";

export const hyperparameterExperiments = pgTable(
  "hyperparameter_experiments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    profileAId: uuid("profile_a_id")
      .notNull()
      .references(() => hyperparameterProfiles.id, { onDelete: "cascade" }),
    profileBId: uuid("profile_b_id")
      .notNull()
      .references(() => hyperparameterProfiles.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | running | completed | failed
    summary: jsonb("summary").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("hyperparameter_experiments_user_id_idx").on(table.userId),
    workflowIdIdx: index("hyperparameter_experiments_workflow_id_idx").on(table.workflowId),
    statusIdx: index("hyperparameter_experiments_status_idx").on(table.status),
  })
);
