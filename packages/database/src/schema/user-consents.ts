// ──────────────────────────────────────────────
// REX - User Consents Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const userConsents = pgTable(
  "user_consents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    consentType: varchar("consent_type", { length: 80 }).notNull(), // terms | privacy | analytics | training
    policyVersion: varchar("policy_version", { length: 40 }).notNull(),
    granted: boolean("granted").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_consents_user_id_idx").on(table.userId),
    consentTypeIdx: index("user_consents_consent_type_idx").on(table.consentType),
    createdAtIdx: index("user_consents_created_at_idx").on(table.createdAt),
  })
);
