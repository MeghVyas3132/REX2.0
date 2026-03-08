// ──────────────────────────────────────────────
// REX - Model Registry Table Schema
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, boolean, timestamp, index, numeric, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const modelRegistry = pgTable(
  "model_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: varchar("provider", { length: 40 }).notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    contextWindow: integer("context_window"),
    maxOutputTokens: integer("max_output_tokens"),
    supportsStreaming: boolean("supports_streaming").default(false).notNull(),
    supportsTools: boolean("supports_tools").default(false).notNull(),
    qualityTier: varchar("quality_tier", { length: 30 }).default("standard").notNull(), // fast | standard | premium
    costInputPer1k: numeric("cost_input_per_1k", { precision: 12, scale: 6 }),
    costOutputPer1k: numeric("cost_output_per_1k", { precision: 12, scale: 6 }),
    capabilities: jsonb("capabilities").default({}).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerIdx: index("model_registry_provider_idx").on(table.provider),
    activeIdx: index("model_registry_is_active_idx").on(table.isActive),
    providerModelUniqueIdx: uniqueIndex("model_registry_provider_model_unique").on(table.provider, table.model),
  })
);
