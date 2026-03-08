CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "embedding_vector" vector(1536);
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "page_number" integer;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "section_path" varchar(1024);
--> statement-breakpoint
CREATE TABLE "workflow_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iam_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "execution_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "workspace_id" uuid;
--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "hyperparameter_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "hyperparameter_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" varchar(80) NOT NULL,
	"policy_version" varchar(40) NOT NULL,
	"granted" boolean NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"resource_type" varchar(80) NOT NULL,
	"retention_days" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "iam_policies" ADD CONSTRAINT "iam_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "iam_policies" ADD CONSTRAINT "iam_policies_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "execution_authorizations" ADD CONSTRAINT "execution_authorizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hyperparameter_profiles" ADD CONSTRAINT "hyperparameter_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hyperparameter_profiles" ADD CONSTRAINT "hyperparameter_profiles_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_profile_a_id_hyperparameter_profiles_id_fk" FOREIGN KEY ("profile_a_id") REFERENCES "public"."hyperparameter_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hyperparameter_experiments" ADD CONSTRAINT "hyperparameter_experiments_profile_b_id_hyperparameter_profiles_id_fk" FOREIGN KEY ("profile_b_id") REFERENCES "public"."hyperparameter_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "data_access_audit_logs" ADD CONSTRAINT "data_access_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "data_access_audit_logs" ADD CONSTRAINT "data_access_audit_logs_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "workflows_workspace_id_idx" ON "workflows" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_vector_hnsw_idx" ON "knowledge_chunks" USING hnsw ("embedding_vector" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX "workflow_permissions_workflow_id_idx" ON "workflow_permissions" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "workflow_permissions_user_id_idx" ON "workflow_permissions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "workflow_permissions_expires_at_idx" ON "workflow_permissions" USING btree ("expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_permissions_workflow_user_unique" ON "workflow_permissions" USING btree ("workflow_id","user_id");
--> statement-breakpoint
CREATE INDEX "iam_policies_user_id_idx" ON "iam_policies" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "iam_policies_workflow_id_idx" ON "iam_policies" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "iam_policies_action_idx" ON "iam_policies" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "iam_policies_is_active_idx" ON "iam_policies" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "execution_authorizations_execution_id_idx" ON "execution_authorizations" USING btree ("execution_id");
--> statement-breakpoint
CREATE INDEX "execution_authorizations_workflow_id_idx" ON "execution_authorizations" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "execution_authorizations_user_id_idx" ON "execution_authorizations" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "execution_authorizations_expires_at_idx" ON "execution_authorizations" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "execution_authorizations_revoked_idx" ON "execution_authorizations" USING btree ("revoked");
--> statement-breakpoint
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_unique" ON "workspace_members" USING btree ("workspace_id","user_id");
--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_user_id_idx" ON "hyperparameter_profiles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_workflow_id_idx" ON "hyperparameter_profiles" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_is_default_idx" ON "hyperparameter_profiles" USING btree ("is_default");
--> statement-breakpoint
CREATE INDEX "hyperparameter_profiles_is_active_idx" ON "hyperparameter_profiles" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_user_id_idx" ON "hyperparameter_experiments" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_workflow_id_idx" ON "hyperparameter_experiments" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "hyperparameter_experiments_status_idx" ON "hyperparameter_experiments" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "alert_rules_workflow_id_idx" ON "alert_rules" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "alert_rules_rule_type_idx" ON "alert_rules" USING btree ("rule_type");
--> statement-breakpoint
CREATE INDEX "alert_rules_is_active_idx" ON "alert_rules" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "alert_events_user_id_idx" ON "alert_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "alert_events_workflow_id_idx" ON "alert_events" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "alert_events_rule_type_idx" ON "alert_events" USING btree ("rule_type");
--> statement-breakpoint
CREATE INDEX "alert_events_severity_idx" ON "alert_events" USING btree ("severity");
--> statement-breakpoint
CREATE INDEX "alert_events_triggered_at_idx" ON "alert_events" USING btree ("triggered_at");
--> statement-breakpoint
CREATE INDEX "user_consents_user_id_idx" ON "user_consents" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_consents_consent_type_idx" ON "user_consents" USING btree ("consent_type");
--> statement-breakpoint
CREATE INDEX "user_consents_created_at_idx" ON "user_consents" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_actor_user_id_idx" ON "data_access_audit_logs" USING btree ("actor_user_id");
--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_subject_user_id_idx" ON "data_access_audit_logs" USING btree ("subject_user_id");
--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_action_idx" ON "data_access_audit_logs" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "data_access_audit_logs_created_at_idx" ON "data_access_audit_logs" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "retention_policies_user_id_idx" ON "retention_policies" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "retention_policies_resource_type_idx" ON "retention_policies" USING btree ("resource_type");
--> statement-breakpoint
CREATE INDEX "retention_policies_is_active_idx" ON "retention_policies" USING btree ("is_active");
