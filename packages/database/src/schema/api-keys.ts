// ──────────────────────────────────────────────
// REX - API Keys Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 20 }).notNull(), // "gemini" | "groq"
  encryptedKey: varchar("encrypted_key", { length: 1024 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
