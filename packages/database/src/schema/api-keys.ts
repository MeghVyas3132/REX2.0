// ──────────────────────────────────────────────
// REX - API Keys Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 20 }).notNull(), // "gemini" | "groq"
    encryptedKey: varchar("encrypted_key", { length: 1024 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("api_keys_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    providerIdx: index("api_keys_provider_idx").on(table.provider),
  })
);
