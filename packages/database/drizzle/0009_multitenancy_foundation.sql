-- ──────────────────────────────────────────────
-- REX 2.0 - Multi-tenancy Foundation Migration
-- This is a BREAKING migration that adds tenant isolation to all tables
-- ──────────────────────────────────────────────

-- Step 1: Add global_role column to users table for super admin support
ALTER TABLE "users" ADD COLUMN "global_role" varchar(20) DEFAULT 'user' NOT NULL;
--> statement-breakpoint
-- Update existing admin users to super_admin (if any were marked as admin role)
UPDATE "users" SET "global_role" = 'super_admin' WHERE "role" = 'admin';
--> statement-breakpoint

-- Step 2: Create the core tenants table
CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(80) NOT NULL UNIQUE,
  "plan_tier" varchar(20) DEFAULT 'starter' NOT NULL
    CHECK ("plan_tier" IN ('starter', 'pro', 'enterprise', 'custom')),
  "is_active" boolean DEFAULT true NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "data_residency_country" char(2),
  "data_residency_region" varchar(50),
  "gdpr_dpa_contact" varchar(255),
  "dpdp_data_fiduciary_name" varchar(255),
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "tenants_is_active_idx" ON "tenants" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "tenants_plan_tier_idx" ON "tenants" USING btree ("plan_tier");
--> statement-breakpoint

-- Step 3: Create tenant_users table (user-to-tenant membership)
CREATE TABLE "tenant_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_role" varchar(20) DEFAULT 'org_viewer' NOT NULL
    CHECK ("tenant_role" IN ('org_admin', 'org_editor', 'org_viewer')),
  "interface_access" varchar(20) DEFAULT 'business' NOT NULL
    CHECK ("interface_access" IN ('business', 'studio', 'both')),
  "abac_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "invited_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("tenant_id", "user_id")
);
--> statement-breakpoint
CREATE INDEX "tenant_users_tenant_id_idx" ON "tenant_users" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "tenant_users_user_id_idx" ON "tenant_users" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "tenant_users_is_active_idx" ON "tenant_users" USING btree ("is_active");
--> statement-breakpoint

-- Step 4: Create tenant_plans table
CREATE TABLE "tenant_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE UNIQUE,
  "plan_name" varchar(100) NOT NULL,
  "allowed_node_types" text[] DEFAULT '{}'::text[] NOT NULL,
  "allowed_plugin_slugs" text[] DEFAULT '{}'::text[] NOT NULL,
  "max_workflows" integer DEFAULT 10 NOT NULL,
  "max_executions_per_month" integer DEFAULT 1000 NOT NULL,
  "max_knowledge_corpora" integer DEFAULT 5 NOT NULL,
  "max_users" integer DEFAULT 10 NOT NULL,
  "max_api_keys" integer DEFAULT 5 NOT NULL,
  "custom_limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "valid_from" timestamp with time zone DEFAULT now() NOT NULL,
  "valid_until" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tenant_plans_tenant_id_idx" ON "tenant_plans" USING btree ("tenant_id");
--> statement-breakpoint

-- Step 5: Create plugin_catalogue table
CREATE TABLE "plugin_catalogue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "category" varchar(30) NOT NULL
    CHECK ("category" IN (
      'ai_llm', 'data_storage', 'communication', 'business_crm',
      'logic_control', 'trigger', 'compliance_rex', 'developer'
    )),
  "version" varchar(20) DEFAULT '1.0.0' NOT NULL,
  "manifest" jsonb NOT NULL,
  "is_public" boolean DEFAULT true NOT NULL,
  "is_builtin" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "rex_hints" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "plugin_catalogue_slug_idx" ON "plugin_catalogue" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "plugin_catalogue_category_idx" ON "plugin_catalogue" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "plugin_catalogue_is_active_idx" ON "plugin_catalogue" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "plugin_catalogue_is_builtin_idx" ON "plugin_catalogue" USING btree ("is_builtin");
--> statement-breakpoint

-- Step 6: Create tenant_plugins table (per-tenant plugin enablement + BYOK)
CREATE TABLE "tenant_plugins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "plugin_slug" varchar(100) NOT NULL REFERENCES "plugin_catalogue"("slug") ON DELETE CASCADE,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "byok_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "config_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "enabled_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("tenant_id", "plugin_slug")
);
--> statement-breakpoint
CREATE INDEX "tenant_plugins_tenant_id_idx" ON "tenant_plugins" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "tenant_plugins_plugin_slug_idx" ON "tenant_plugins" USING btree ("plugin_slug");
--> statement-breakpoint
CREATE INDEX "tenant_plugins_is_enabled_idx" ON "tenant_plugins" USING btree ("is_enabled");
--> statement-breakpoint

-- Step 7: Create workflow_node_rex_scores table
CREATE TABLE "workflow_node_rex_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "node_id" varchar(100) NOT NULL,
  "r_score" smallint DEFAULT 0 NOT NULL CHECK ("r_score" BETWEEN 0 AND 100),
  "e_score" smallint DEFAULT 0 NOT NULL CHECK ("e_score" BETWEEN 0 AND 100),
  "x_score" smallint DEFAULT 0 NOT NULL CHECK ("x_score" BETWEEN 0 AND 100),
  "total_score" smallint DEFAULT 0 NOT NULL CHECK ("total_score" BETWEEN 0 AND 100),
  "is_rex_enabled" boolean DEFAULT false NOT NULL,
  "breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "gaps" text[] DEFAULT '{}'::text[] NOT NULL,
  "auto_fixes_available" text[] DEFAULT '{}'::text[] NOT NULL,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("workflow_id", "node_id")
);
--> statement-breakpoint
CREATE INDEX "workflow_node_rex_scores_workflow_id_idx" ON "workflow_node_rex_scores" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "workflow_node_rex_scores_total_score_idx" ON "workflow_node_rex_scores" USING btree ("total_score");
--> statement-breakpoint
CREATE INDEX "workflow_node_rex_scores_is_rex_enabled_idx" ON "workflow_node_rex_scores" USING btree ("is_rex_enabled");
--> statement-breakpoint

-- Step 8: Create workflow_publications table (Business mode)
CREATE TABLE "workflow_publications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE UNIQUE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "description" text,
  "icon" varchar(50),
  "input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "output_display" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "published_at" timestamp with time zone,
  "published_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "category" varchar(100),
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "workflow_publications_workflow_id_idx" ON "workflow_publications" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "workflow_publications_tenant_id_idx" ON "workflow_publications" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "workflow_publications_is_published_idx" ON "workflow_publications" USING btree ("is_published");
--> statement-breakpoint
CREATE INDEX "workflow_publications_category_idx" ON "workflow_publications" USING btree ("category");
--> statement-breakpoint

-- Step 9: Create workflow_legal_basis table (GDPR / DPDP compliance)
CREATE TABLE "workflow_legal_basis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE UNIQUE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "gdpr_basis" varchar(30) CHECK ("gdpr_basis" IN (
    'consent', 'legitimate_interest', 'contract',
    'legal_obligation', 'vital_interests', 'public_task'
  )),
  "dpdp_basis" varchar(30) CHECK ("dpdp_basis" IN (
    'consent', 'legitimate_use', 'legal_obligation', 'medical_emergency'
  )),
  "purpose_description" text DEFAULT '' NOT NULL,
  "data_categories" text[] DEFAULT '{}'::text[] NOT NULL,
  "cross_border_transfer" boolean DEFAULT false NOT NULL,
  "transfer_safeguards" text,
  "retention_days" integer,
  "last_reviewed_at" timestamp with time zone,
  "reviewed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "workflow_legal_basis_workflow_id_idx" ON "workflow_legal_basis" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "workflow_legal_basis_tenant_id_idx" ON "workflow_legal_basis" USING btree ("tenant_id");
--> statement-breakpoint

-- Step 10: Create tenant_data_residency table
CREATE TABLE "tenant_data_residency" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "country_code" char(2) NOT NULL,
  "allowed_regions" text[] DEFAULT '{}'::text[] NOT NULL,
  "blocked_provider_endpoints" text[] DEFAULT '{}'::text[] NOT NULL,
  "enforcement" varchar(10) DEFAULT 'warn' NOT NULL
    CHECK ("enforcement" IN ('warn', 'block')),
  "applies_to" text[] DEFAULT '{all}'::text[] NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tenant_data_residency_tenant_id_idx" ON "tenant_data_residency" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "tenant_data_residency_country_code_idx" ON "tenant_data_residency" USING btree ("country_code");
--> statement-breakpoint

-- Step 11: Create admin_audit_log table
CREATE TABLE "admin_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(100) NOT NULL,
  "target_type" varchar(50) NOT NULL,
  "target_id" uuid,
  "old_value" jsonb,
  "new_value" jsonb,
  "ip_address" inet,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_audit_log_actor_id_idx" ON "admin_audit_log" USING btree ("actor_id");
--> statement-breakpoint
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "admin_audit_log_target_type_idx" ON "admin_audit_log" USING btree ("target_type");
--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log" USING btree ("created_at");
--> statement-breakpoint

-- Step 12: Create abac_policies table
CREATE TABLE "abac_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "resource_type" varchar(50) NOT NULL,
  "action" varchar(30) NOT NULL,
  "conditions" jsonb NOT NULL,
  "effect" varchar(10) DEFAULT 'allow' NOT NULL CHECK ("effect" IN ('allow', 'deny')),
  "priority" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "abac_policies_tenant_id_idx" ON "abac_policies" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "abac_policies_resource_type_idx" ON "abac_policies" USING btree ("resource_type");
--> statement-breakpoint
CREATE INDEX "abac_policies_action_idx" ON "abac_policies" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "abac_policies_is_active_idx" ON "abac_policies" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "abac_policies_priority_idx" ON "abac_policies" USING btree ("priority");
--> statement-breakpoint

-- ──────────────────────────────────────────────
-- Step 13: Add tenant_id to all existing tables
-- Uses a DEFAULT tenant for existing data (migration strategy)
-- ──────────────────────────────────────────────

-- Create a default tenant for existing data migration
INSERT INTO "tenants" ("id", "name", "slug", "plan_tier", "is_active", "settings")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Tenant',
  'default',
  'enterprise',
  true,
  '{}'::jsonb
);
--> statement-breakpoint

-- Insert default tenant plan
INSERT INTO "tenant_plans" ("tenant_id", "plan_name", "max_workflows", "max_executions_per_month", "max_users")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Enterprise',
  1000,
  100000,
  1000
);
--> statement-breakpoint

-- Add tenant_id to workflows table
ALTER TABLE "workflows" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "workflows" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "workflows_tenant_id_idx" ON "workflows" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to executions table
ALTER TABLE "executions" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "executions" SET "tenant_id" = (SELECT "tenant_id" FROM "workflows" WHERE "workflows"."id" = "executions"."workflow_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "executions" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "executions" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "executions_tenant_id_idx" ON "executions" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to execution_steps table
ALTER TABLE "execution_steps" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "execution_steps" SET "tenant_id" = (SELECT "tenant_id" FROM "executions" WHERE "executions"."id" = "execution_steps"."execution_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "execution_steps" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "execution_steps" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "execution_steps_tenant_id_idx" ON "execution_steps" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to execution_context_snapshots table
ALTER TABLE "execution_context_snapshots" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "execution_context_snapshots" SET "tenant_id" = (SELECT "tenant_id" FROM "executions" WHERE "executions"."id" = "execution_context_snapshots"."execution_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "execution_context_snapshots" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "execution_context_snapshots" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "execution_context_snapshots_tenant_id_idx" ON "execution_context_snapshots" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to knowledge_corpora table
ALTER TABLE "knowledge_corpora" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "knowledge_corpora" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "knowledge_corpora" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "knowledge_corpora_tenant_id_idx" ON "knowledge_corpora" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to knowledge_documents table
ALTER TABLE "knowledge_documents" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "knowledge_documents" SET "tenant_id" = (SELECT "tenant_id" FROM "knowledge_corpora" WHERE "knowledge_corpora"."id" = "knowledge_documents"."corpus_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "knowledge_documents" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "knowledge_documents" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "knowledge_documents_tenant_id_idx" ON "knowledge_documents" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to api_keys table
ALTER TABLE "api_keys" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "api_keys" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to workspaces table
ALTER TABLE "workspaces" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "workspaces" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "workspaces_tenant_id_idx" ON "workspaces" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to workspace_members table
ALTER TABLE "workspace_members" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "workspace_members" SET "tenant_id" = (SELECT "tenant_id" FROM "workspaces" WHERE "workspaces"."id" = "workspace_members"."workspace_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "workspace_members" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "workspace_members_tenant_id_idx" ON "workspace_members" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to domain_configs table
ALTER TABLE "domain_configs" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "domain_configs" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "domain_configs" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "domain_configs_tenant_id_idx" ON "domain_configs" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to alert_rules table
ALTER TABLE "alert_rules" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "alert_rules" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "alert_rules" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "alert_rules_tenant_id_idx" ON "alert_rules" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to alert_events table
ALTER TABLE "alert_events" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "alert_events" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "alert_events" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "alert_events_tenant_id_idx" ON "alert_events" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to user_consents table
ALTER TABLE "user_consents" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "user_consents" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "user_consents" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "user_consents_tenant_id_idx" ON "user_consents" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to retention_policies table
ALTER TABLE "retention_policies" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "retention_policies" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "retention_policies" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "retention_policies_tenant_id_idx" ON "retention_policies" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to iam_policies table
ALTER TABLE "iam_policies" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "iam_policies" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "iam_policies" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "iam_policies_tenant_id_idx" ON "iam_policies" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to workflow_permissions table
ALTER TABLE "workflow_permissions" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "workflow_permissions" SET "tenant_id" = (SELECT "tenant_id" FROM "workflows" WHERE "workflows"."id" = "workflow_permissions"."workflow_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "workflow_permissions" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "workflow_permissions" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "workflow_permissions_tenant_id_idx" ON "workflow_permissions" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to guardrail_events table (if exists)
ALTER TABLE "guardrail_events" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "guardrail_events" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "guardrail_events" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "guardrail_events_tenant_id_idx" ON "guardrail_events" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to hyperparameter_profiles table
ALTER TABLE "hyperparameter_profiles" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "hyperparameter_profiles" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "hyperparameter_profiles" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_tenant_id_idx" ON "hyperparameter_profiles" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to hyperparameter_experiments table
ALTER TABLE "hyperparameter_experiments" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "hyperparameter_experiments" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_tenant_id_idx" ON "hyperparameter_experiments" USING btree ("tenant_id");
--> statement-breakpoint

-- Add tenant_id to execution_authorizations table
ALTER TABLE "execution_authorizations" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "execution_authorizations" SET "tenant_id" = (SELECT "tenant_id" FROM "executions" WHERE "executions"."id" = "execution_authorizations"."execution_id") WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "execution_authorizations" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "execution_authorizations" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "execution_authorizations_tenant_id_idx" ON "execution_authorizations" USING btree ("tenant_id");
--> statement-breakpoint

-- Migrate existing users to default tenant with org_admin role
INSERT INTO "tenant_users" ("tenant_id", "user_id", "tenant_role", "interface_access", "is_active")
SELECT
  '00000000-0000-0000-0000-000000000001',
  "id",
  CASE WHEN "role" = 'admin' THEN 'org_admin' ELSE 'org_editor' END,
  'both',
  true
FROM "users"
ON CONFLICT ("tenant_id", "user_id") DO NOTHING;
--> statement-breakpoint

-- Add a comment noting tenant isolation requirement
COMMENT ON TABLE "tenants" IS 'Core tenancy table. All tenant-scoped queries MUST filter by tenant_id using withTenant helper.';
