// ──────────────────────────────────────────────
// REX - Compliance & REX Scores Schema
// ──────────────────────────────────────────────

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  integer,
  smallint,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workflows } from "./workflows.js";
import { tenants } from "./tenants.js";

// ─── Workflow Node REX Scores ─────────────────────────────────────────────

export const workflowNodeRexScores = pgTable(
  "workflow_node_rex_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    nodeId: varchar("node_id", { length: 100 }).notNull(),
    rScore: smallint("r_score").default(0).notNull(),
    eScore: smallint("e_score").default(0).notNull(),
    xScore: smallint("x_score").default(0).notNull(),
    totalScore: smallint("total_score").default(0).notNull(),
    isRexEnabled: boolean("is_rex_enabled").default(false).notNull(),
    breakdown: jsonb("breakdown").default({}).notNull(),
    gaps: text("gaps").array().default([]).notNull(),
    autoFixesAvailable: text("auto_fixes_available").array().default([]).notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflow_node_rex_scores_workflow_id_idx").on(table.workflowId),
    totalScoreIdx: index("workflow_node_rex_scores_total_score_idx").on(table.totalScore),
    isRexEnabledIdx: index("workflow_node_rex_scores_is_rex_enabled_idx").on(table.isRexEnabled),
    workflowNodeUniqueIdx: uniqueIndex("workflow_node_rex_scores_workflow_node_unique").on(
      table.workflowId,
      table.nodeId
    ),
  })
);

// ─── Workflow Publications (Business Mode) ───────────────────────────────

export const workflowPublications = pgTable(
  "workflow_publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" })
      .unique(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    inputSchema: jsonb("input_schema").default({}).notNull(),
    outputDisplay: jsonb("output_display").default({}).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: uuid("published_by").references(() => users.id, { onDelete: "set null" }),
    category: varchar("category", { length: 100 }),
    tags: text("tags").array().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflow_publications_workflow_id_idx").on(table.workflowId),
    tenantIdIdx: index("workflow_publications_tenant_id_idx").on(table.tenantId),
    isPublishedIdx: index("workflow_publications_is_published_idx").on(table.isPublished),
    categoryIdx: index("workflow_publications_category_idx").on(table.category),
  })
);

// ─── Workflow Legal Basis (GDPR / DPDP) ───────────────────────────────────

export const workflowLegalBasis = pgTable(
  "workflow_legal_basis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" })
      .unique(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    gdprBasis: varchar("gdpr_basis", { length: 30 }),
    dpdpBasis: varchar("dpdp_basis", { length: 30 }),
    purposeDescription: text("purpose_description").default("").notNull(),
    dataCategories: text("data_categories").array().default([]).notNull(),
    crossBorderTransfer: boolean("cross_border_transfer").default(false).notNull(),
    transferSafeguards: text("transfer_safeguards"),
    retentionDays: integer("retention_days"),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflow_legal_basis_workflow_id_idx").on(table.workflowId),
    tenantIdIdx: index("workflow_legal_basis_tenant_id_idx").on(table.tenantId),
  })
);

// ─── Data Subject Requests (DSAR) ─────────────────────────────────────────

export const dataSubjectRequests = pgTable(
  "data_subject_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    subjectUserId: uuid("subject_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestType: varchar("request_type", { length: 30 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    description: text("description").default("").notNull(),
    response: text("response"),
    processedBy: uuid("processed_by").references(() => users.id, { onDelete: "set null" }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("data_subject_requests_tenant_id_idx").on(table.tenantId),
    subjectUserIdIdx: index("data_subject_requests_subject_user_id_idx").on(table.subjectUserId),
    requestTypeIdx: index("data_subject_requests_request_type_idx").on(table.requestType),
    statusIdx: index("data_subject_requests_status_idx").on(table.status),
    dueDateIdx: index("data_subject_requests_due_date_idx").on(table.dueDate),
  })
);
