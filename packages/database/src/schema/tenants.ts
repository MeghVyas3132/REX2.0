// ──────────────────────────────────────────────
// REX - Tenants Schema (Multi-tenancy Foundation)
// ──────────────────────────────────────────────

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  char,
  index,
  uniqueIndex,
  integer,
  inet,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

// ─── Core Tenants Table ───────────────────────────────────────────────────

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    planTier: varchar("plan_tier", { length: 20 }).default("starter").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    dataResidencyCountry: char("data_residency_country", { length: 2 }),
    dataResidencyRegion: varchar("data_residency_region", { length: 50 }),
    gdprDpaContact: varchar("gdpr_dpa_contact", { length: 255 }),
    dpdpDataFiduciaryName: varchar("dpdp_data_fiduciary_name", { length: 255 }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("tenants_slug_idx").on(table.slug),
    isActiveIdx: index("tenants_is_active_idx").on(table.isActive),
    planTierIdx: index("tenants_plan_tier_idx").on(table.planTier),
  })
);

// ─── Tenant Users (User-to-Tenant Membership) ─────────────────────────────

export const tenantUsers = pgTable(
  "tenant_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantRole: varchar("tenant_role", { length: 20 }).default("org_viewer").notNull(),
    interfaceAccess: varchar("interface_access", { length: 20 }).default("business").notNull(),
    abacAttributes: jsonb("abac_attributes").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("tenant_users_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("tenant_users_user_id_idx").on(table.userId),
    isActiveIdx: index("tenant_users_is_active_idx").on(table.isActive),
    tenantUserUniqueIdx: uniqueIndex("tenant_users_tenant_user_unique").on(
      table.tenantId,
      table.userId
    ),
  })
);

// ─── Tenant Plans ─────────────────────────────────────────────────────────

export const tenantPlans = pgTable(
  "tenant_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" })
      .unique(),
    planName: varchar("plan_name", { length: 100 }).notNull(),
    allowedNodeTypes: text("allowed_node_types").array().default([]).notNull(),
    allowedPluginSlugs: text("allowed_plugin_slugs").array().default([]).notNull(),
    maxWorkflows: integer("max_workflows").default(10).notNull(),
    maxExecutionsPerMonth: integer("max_executions_per_month").default(1000).notNull(),
    maxKnowledgeCorpora: integer("max_knowledge_corpora").default(5).notNull(),
    maxUsers: integer("max_users").default(10).notNull(),
    maxApiKeys: integer("max_api_keys").default(5).notNull(),
    customLimits: jsonb("custom_limits").default({}).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("tenant_plans_tenant_id_idx").on(table.tenantId),
  })
);

// ─── Plugin Catalogue ─────────────────────────────────────────────────────

export const pluginCatalogue = pgTable(
  "plugin_catalogue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 30 }).notNull(),
    version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
    manifest: jsonb("manifest").notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    isBuiltin: boolean("is_builtin").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    technicalLevel: varchar("technical_level", { length: 20 }).default("advanced").notNull(), // "basic" | "advanced"
    rexHints: jsonb("rex_hints").default({}).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deleteScheduledFor: timestamp("delete_scheduled_for", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("plugin_catalogue_slug_idx").on(table.slug),
    categoryIdx: index("plugin_catalogue_category_idx").on(table.category),
    isActiveIdx: index("plugin_catalogue_is_active_idx").on(table.isActive),
    isBuiltinIdx: index("plugin_catalogue_is_builtin_idx").on(table.isBuiltin),
    technicalLevelIdx: index("plugin_catalogue_technical_level_idx").on(table.technicalLevel),
    deletedAtIdx: index("plugin_catalogue_deleted_at_idx").on(table.deletedAt),
  })
);

// ─── Tenant Plugins ───────────────────────────────────────────────────────

export const tenantPlugins = pgTable(
  "tenant_plugins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    pluginSlug: varchar("plugin_slug", { length: 100 })
      .notNull()
      .references(() => pluginCatalogue.slug, { onDelete: "cascade" }),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    byokConfig: jsonb("byok_config").default({}).notNull(),
    configOverrides: jsonb("config_overrides").default({}).notNull(),
    enabledBy: uuid("enabled_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("tenant_plugins_tenant_id_idx").on(table.tenantId),
    pluginSlugIdx: index("tenant_plugins_plugin_slug_idx").on(table.pluginSlug),
    isEnabledIdx: index("tenant_plugins_is_enabled_idx").on(table.isEnabled),
    tenantPluginUniqueIdx: uniqueIndex("tenant_plugins_tenant_plugin_unique").on(
      table.tenantId,
      table.pluginSlug
    ),
  })
);

// ─── Tenant Data Residency ────────────────────────────────────────────────

export const tenantDataResidency = pgTable(
  "tenant_data_residency",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    countryCode: char("country_code", { length: 2 }).notNull(),
    allowedRegions: text("allowed_regions").array().default([]).notNull(),
    blockedProviderEndpoints: text("blocked_provider_endpoints").array().default([]).notNull(),
    enforcement: varchar("enforcement", { length: 10 }).default("warn").notNull(),
    appliesTo: text("applies_to").array().default(["all"]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("tenant_data_residency_tenant_id_idx").on(table.tenantId),
    countryCodeIdx: index("tenant_data_residency_country_code_idx").on(table.countryCode),
  })
);

// ─── ABAC Policies ────────────────────────────────────────────────────────

export const abacPolicies = pgTable(
  "abac_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    action: varchar("action", { length: 30 }).notNull(),
    conditions: jsonb("conditions").notNull(),
    effect: varchar("effect", { length: 10 }).default("allow").notNull(),
    priority: integer("priority").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("abac_policies_tenant_id_idx").on(table.tenantId),
    resourceTypeIdx: index("abac_policies_resource_type_idx").on(table.resourceType),
    actionIdx: index("abac_policies_action_idx").on(table.action),
    isActiveIdx: index("abac_policies_is_active_idx").on(table.isActive),
    priorityIdx: index("abac_policies_priority_idx").on(table.priority),
  })
);

// ─── Admin Audit Log ──────────────────────────────────────────────────────

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: uuid("target_id"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actorIdIdx: index("admin_audit_log_actor_id_idx").on(table.actorId),
    actionIdx: index("admin_audit_log_action_idx").on(table.action),
    targetTypeIdx: index("admin_audit_log_target_type_idx").on(table.targetType),
    createdAtIdx: index("admin_audit_log_created_at_idx").on(table.createdAt),
  })
);
