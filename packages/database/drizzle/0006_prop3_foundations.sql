ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'editor' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_given_at" timestamp with time zone;
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
CREATE TABLE "domain_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"workflow_id" uuid,
	"domain" varchar(80) DEFAULT 'default' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardrail_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
ALTER TABLE "domain_configs" ADD CONSTRAINT "domain_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "domain_configs" ADD CONSTRAINT "domain_configs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "guardrail_events" ADD CONSTRAINT "guardrail_events_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "model_registry_provider_idx" ON "model_registry" USING btree ("provider");
--> statement-breakpoint
CREATE INDEX "model_registry_is_active_idx" ON "model_registry" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "domain_configs_user_id_idx" ON "domain_configs" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "domain_configs_workflow_id_idx" ON "domain_configs" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "domain_configs_domain_idx" ON "domain_configs" USING btree ("domain");
--> statement-breakpoint
CREATE INDEX "domain_configs_is_active_idx" ON "domain_configs" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "guardrail_events_user_id_idx" ON "guardrail_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "guardrail_events_workflow_id_idx" ON "guardrail_events" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "guardrail_events_execution_id_idx" ON "guardrail_events" USING btree ("execution_id");
--> statement-breakpoint
CREATE INDEX "guardrail_events_guard_type_idx" ON "guardrail_events" USING btree ("guard_type");
--> statement-breakpoint
CREATE INDEX "guardrail_events_severity_idx" ON "guardrail_events" USING btree ("severity");
--> statement-breakpoint
CREATE UNIQUE INDEX "model_registry_provider_model_unique" ON "model_registry" USING btree ("provider", "model");
