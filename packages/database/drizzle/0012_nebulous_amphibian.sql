CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_id" uuid,
	"alert_rule_id" uuid,
	"rule_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'warn' NOT NULL,
	"message" varchar(1024) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_id" uuid,
	"rule_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'warn' NOT NULL,
	"threshold" integer DEFAULT 1 NOT NULL,
	"window_minutes" integer DEFAULT 60 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_subject_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject_user_id" uuid NOT NULL,
	"request_type" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"response" text,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"due_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_legal_basis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"gdpr_basis" varchar(30),
	"dpdp_basis" varchar(30),
	"purpose_description" text DEFAULT '' NOT NULL,
	"data_categories" text[] DEFAULT '{}' NOT NULL,
	"cross_border_transfer" boolean DEFAULT false NOT NULL,
	"transfer_safeguards" text,
	"retention_days" integer,
	"last_reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_legal_basis_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_node_rex_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"node_id" varchar(100) NOT NULL,
	"r_score" smallint DEFAULT 0 NOT NULL,
	"e_score" smallint DEFAULT 0 NOT NULL,
	"x_score" smallint DEFAULT 0 NOT NULL,
	"total_score" smallint DEFAULT 0 NOT NULL,
	"is_rex_enabled" boolean DEFAULT false NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"gaps" text[] DEFAULT '{}' NOT NULL,
	"auto_fixes_available" text[] DEFAULT '{}' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_display" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" uuid,
	"category" varchar(100),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_publications_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "data_access_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"subject_user_id" uuid NOT NULL,
	"action" varchar(80) NOT NULL,
	"resource_type" varchar(80) NOT NULL,
	"resource_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"workflow_id" uuid,
	"domain" varchar(80) DEFAULT 'default' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"execution_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(40) DEFAULT 'execute' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"validated_at" timestamp with time zone,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardrail_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"execution_id" uuid NOT NULL,
	"node_id" varchar(255) NOT NULL,
	"node_type" varchar(100) NOT NULL,
	"guard_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'warn' NOT NULL,
	"reason" varchar(1024) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hyperparameter_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"profile_a_id" uuid NOT NULL,
	"profile_b_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hyperparameter_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" varchar(2048) DEFAULT '' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iam_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"workflow_id" uuid,
	"action" varchar(40) NOT NULL,
	"effect" varchar(10) DEFAULT 'allow' NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "abac_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"resource_type" varchar(50) NOT NULL,
	"action" varchar(30) NOT NULL,
	"conditions" jsonb NOT NULL,
	"effect" varchar(10) DEFAULT 'allow' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(40) NOT NULL,
	"model" varchar(120) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"context_window" integer,
	"max_output_tokens" integer,
	"supports_streaming" boolean DEFAULT false NOT NULL,
	"supports_tools" boolean DEFAULT false NOT NULL,
	"quality_tier" varchar(30) DEFAULT 'standard' NOT NULL,
	"cost_input_per_1k" numeric(12, 6),
	"cost_output_per_1k" numeric(12, 6),
	"capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_catalogue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(30) NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"manifest" jsonb NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rex_hints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_catalogue_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"resource_type" varchar(80) NOT NULL,
	"retention_days" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_data_residency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"country_code" char(2) NOT NULL,
	"allowed_regions" text[] DEFAULT '{}' NOT NULL,
	"blocked_provider_endpoints" text[] DEFAULT '{}' NOT NULL,
	"enforcement" varchar(10) DEFAULT 'warn' NOT NULL,
	"applies_to" text[] DEFAULT '{"all"}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"allowed_node_types" text[] DEFAULT '{}' NOT NULL,
	"allowed_plugin_slugs" text[] DEFAULT '{}' NOT NULL,
	"max_workflows" integer DEFAULT 10 NOT NULL,
	"max_executions_per_month" integer DEFAULT 1000 NOT NULL,
	"max_knowledge_corpora" integer DEFAULT 5 NOT NULL,
	"max_users" integer DEFAULT 10 NOT NULL,
	"max_api_keys" integer DEFAULT 5 NOT NULL,
	"custom_limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_plans_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_plugins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plugin_slug" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"byok_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_role" varchar(20) DEFAULT 'org_viewer' NOT NULL,
	"interface_access" varchar(20) DEFAULT 'business' NOT NULL,
	"abac_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"plan_tier" varchar(20) DEFAULT 'starter' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_residency_country" char(2),
	"data_residency_region" varchar(50),
	"gdpr_dpa_contact" varchar(255),
	"dpdp_data_fiduciary_name" varchar(255),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" varchar(80) NOT NULL,
	"policy_version" varchar(40) NOT NULL,
	"granted" boolean NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "strategy" varchar(40);--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "retriever_key" varchar(100);--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "branch_index" integer;--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "selected" boolean;--> statement-breakpoint
ALTER TABLE "execution_steps" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "executions" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "embedding_vector" vector(1536);--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "page_number" integer;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "section_path" varchar(1024);--> statement-breakpoint
ALTER TABLE "knowledge_corpora" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'editor' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "global_role" varchar(20) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_given_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "source_template_id" varchar(100);--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "source_template_version" integer;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "source_template_params" jsonb;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_legal_basis" ADD CONSTRAINT "workflow_legal_basis_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_legal_basis" ADD CONSTRAINT "workflow_legal_basis_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_legal_basis" ADD CONSTRAINT "workflow_legal_basis_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_node_rex_scores" ADD CONSTRAINT "workflow_node_rex_scores_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_publications" ADD CONSTRAINT "workflow_publications_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_publications" ADD CONSTRAINT "workflow_publications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_publications" ADD CONSTRAINT "workflow_publications_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_audit_logs" ADD CONSTRAINT "data_access_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_audit_logs" ADD CONSTRAINT "data_access_audit_logs_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_configs" ADD CONSTRAINT "domain_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_configs" ADD CONSTRAINT "domain_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_configs" ADD CONSTRAINT "domain_configs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_profile_a_id_hyperparameter_profiles_id_fk" FOREIGN KEY ("profile_a_id") REFERENCES "public"."hyperparameter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_profile_b_id_hyperparameter_profiles_id_fk" FOREIGN KEY ("profile_b_id") REFERENCES "public"."hyperparameter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_profiles" ADD CONSTRAINT "hyperparameter_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_profiles" ADD CONSTRAINT "hyperparameter_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hyperparameter_profiles" ADD CONSTRAINT "hyperparameter_profiles_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam_policies" ADD CONSTRAINT "iam_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam_policies" ADD CONSTRAINT "iam_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam_policies" ADD CONSTRAINT "iam_policies_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abac_policies" ADD CONSTRAINT "abac_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_data_residency" ADD CONSTRAINT "tenant_data_residency_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plans" ADD CONSTRAINT "tenant_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plugins" ADD CONSTRAINT "tenant_plugins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plugins" ADD CONSTRAINT "tenant_plugins_plugin_slug_plugin_catalogue_slug_fk" FOREIGN KEY ("plugin_slug") REFERENCES "public"."plugin_catalogue"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plugins" ADD CONSTRAINT "tenant_plugins_enabled_by_users_id_fk" FOREIGN KEY ("enabled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_events_tenant_id_idx" ON "alert_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "alert_events_user_id_idx" ON "alert_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_events_workflow_id_idx" ON "alert_events" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alert_events_rule_type_idx" ON "alert_events" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "alert_events_severity_idx" ON "alert_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alert_events_triggered_at_idx" ON "alert_events" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "alert_rules_tenant_id_idx" ON "alert_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_rules_workflow_id_idx" ON "alert_rules" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alert_rules_rule_type_idx" ON "alert_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "alert_rules_is_active_idx" ON "alert_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "data_subject_requests_tenant_id_idx" ON "data_subject_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "data_subject_requests_subject_user_id_idx" ON "data_subject_requests" USING btree ("subject_user_id");--> statement-breakpoint
CREATE INDEX "data_subject_requests_request_type_idx" ON "data_subject_requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "data_subject_requests_status_idx" ON "data_subject_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "data_subject_requests_due_date_idx" ON "data_subject_requests" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "workflow_legal_basis_workflow_id_idx" ON "workflow_legal_basis" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_legal_basis_tenant_id_idx" ON "workflow_legal_basis" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workflow_node_rex_scores_workflow_id_idx" ON "workflow_node_rex_scores" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_node_rex_scores_total_score_idx" ON "workflow_node_rex_scores" USING btree ("total_score");--> statement-breakpoint
CREATE INDEX "workflow_node_rex_scores_is_rex_enabled_idx" ON "workflow_node_rex_scores" USING btree ("is_rex_enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_node_rex_scores_workflow_node_unique" ON "workflow_node_rex_scores" USING btree ("workflow_id","node_id");--> statement-breakpoint
CREATE INDEX "workflow_publications_workflow_id_idx" ON "workflow_publications" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_publications_tenant_id_idx" ON "workflow_publications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workflow_publications_is_published_idx" ON "workflow_publications" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "workflow_publications_category_idx" ON "workflow_publications" USING btree ("category");--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_actor_user_id_idx" ON "data_access_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_subject_user_id_idx" ON "data_access_audit_logs" USING btree ("subject_user_id");--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_action_idx" ON "data_access_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_created_at_idx" ON "data_access_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "domain_configs_tenant_id_idx" ON "domain_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "domain_configs_user_id_idx" ON "domain_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "domain_configs_workflow_id_idx" ON "domain_configs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "domain_configs_domain_idx" ON "domain_configs" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "domain_configs_is_active_idx" ON "domain_configs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "execution_authorizations_tenant_id_idx" ON "execution_authorizations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "execution_authorizations_execution_id_idx" ON "execution_authorizations" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "execution_authorizations_workflow_id_idx" ON "execution_authorizations" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "execution_authorizations_user_id_idx" ON "execution_authorizations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "execution_authorizations_expires_at_idx" ON "execution_authorizations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "execution_authorizations_revoked_idx" ON "execution_authorizations" USING btree ("revoked");--> statement-breakpoint
CREATE INDEX "guardrail_events_tenant_id_idx" ON "guardrail_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "guardrail_events_user_id_idx" ON "guardrail_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "guardrail_events_workflow_id_idx" ON "guardrail_events" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "guardrail_events_execution_id_idx" ON "guardrail_events" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "guardrail_events_guard_type_idx" ON "guardrail_events" USING btree ("guard_type");--> statement-breakpoint
CREATE INDEX "guardrail_events_severity_idx" ON "guardrail_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_tenant_id_idx" ON "hyperparameter_experiments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_user_id_idx" ON "hyperparameter_experiments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_workflow_id_idx" ON "hyperparameter_experiments" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_status_idx" ON "hyperparameter_experiments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_tenant_id_idx" ON "hyperparameter_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_user_id_idx" ON "hyperparameter_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_workflow_id_idx" ON "hyperparameter_profiles" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_is_default_idx" ON "hyperparameter_profiles" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_is_active_idx" ON "hyperparameter_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "iam_policies_tenant_id_idx" ON "iam_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "iam_policies_user_id_idx" ON "iam_policies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "iam_policies_workflow_id_idx" ON "iam_policies" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "iam_policies_action_idx" ON "iam_policies" USING btree ("action");--> statement-breakpoint
CREATE INDEX "iam_policies_is_active_idx" ON "iam_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "abac_policies_tenant_id_idx" ON "abac_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "abac_policies_resource_type_idx" ON "abac_policies" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "abac_policies_action_idx" ON "abac_policies" USING btree ("action");--> statement-breakpoint
CREATE INDEX "abac_policies_is_active_idx" ON "abac_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "abac_policies_priority_idx" ON "abac_policies" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "admin_audit_log_actor_id_idx" ON "admin_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_audit_log_target_type_idx" ON "admin_audit_log" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "model_registry_provider_idx" ON "model_registry" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "model_registry_is_active_idx" ON "model_registry" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "model_registry_provider_model_unique" ON "model_registry" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX "plugin_catalogue_slug_idx" ON "plugin_catalogue" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "plugin_catalogue_category_idx" ON "plugin_catalogue" USING btree ("category");--> statement-breakpoint
CREATE INDEX "plugin_catalogue_is_active_idx" ON "plugin_catalogue" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "plugin_catalogue_is_builtin_idx" ON "plugin_catalogue" USING btree ("is_builtin");--> statement-breakpoint
CREATE INDEX "retention_policies_tenant_id_idx" ON "retention_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "retention_policies_user_id_idx" ON "retention_policies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "retention_policies_resource_type_idx" ON "retention_policies" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "retention_policies_is_active_idx" ON "retention_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tenant_data_residency_tenant_id_idx" ON "tenant_data_residency" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_data_residency_country_code_idx" ON "tenant_data_residency" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "tenant_plans_tenant_id_idx" ON "tenant_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_plugins_tenant_id_idx" ON "tenant_plugins" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_plugins_plugin_slug_idx" ON "tenant_plugins" USING btree ("plugin_slug");--> statement-breakpoint
CREATE INDEX "tenant_plugins_is_enabled_idx" ON "tenant_plugins" USING btree ("is_enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_plugins_tenant_plugin_unique" ON "tenant_plugins" USING btree ("tenant_id","plugin_slug");--> statement-breakpoint
CREATE INDEX "tenant_users_tenant_id_idx" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_users_user_id_idx" ON "tenant_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_users_is_active_idx" ON "tenant_users" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_tenant_user_unique" ON "tenant_users" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenants_is_active_idx" ON "tenants" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tenants_plan_tier_idx" ON "tenants" USING btree ("plan_tier");--> statement-breakpoint
CREATE INDEX "user_consents_tenant_id_idx" ON "user_consents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_consents_user_id_idx" ON "user_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_consents_consent_type_idx" ON "user_consents" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "user_consents_created_at_idx" ON "user_consents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workflow_permissions_tenant_id_idx" ON "workflow_permissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workflow_permissions_workflow_id_idx" ON "workflow_permissions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_permissions_user_id_idx" ON "workflow_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workflow_permissions_expires_at_idx" ON "workflow_permissions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_permissions_workflow_user_unique" ON "workflow_permissions" USING btree ("workflow_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_tenant_id_idx" ON "workspace_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_unique" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspaces_tenant_id_idx" ON "workspaces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces" USING btree ("owner_user_id");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_steps" ADD CONSTRAINT "execution_steps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_corpora" ADD CONSTRAINT "knowledge_corpora_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_provider_idx" ON "api_keys" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_retriever_key_idx" ON "execution_retrieval_events" USING btree ("retriever_key");--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_strategy_idx" ON "execution_retrieval_events" USING btree ("strategy");--> statement-breakpoint
CREATE INDEX "execution_steps_tenant_id_idx" ON "execution_steps" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "executions_tenant_id_idx" ON "executions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "knowledge_corpora_tenant_id_idx" ON "knowledge_corpora" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_tenant_id_idx" ON "knowledge_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "users_global_role_idx" ON "users" USING btree ("global_role");--> statement-breakpoint
CREATE INDEX "workflows_tenant_id_idx" ON "workflows" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workflows_workspace_id_idx" ON "workflows" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workflows_source_template_id_idx" ON "workflows" USING btree ("source_template_id");