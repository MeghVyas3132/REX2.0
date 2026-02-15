CREATE TABLE "execution_step_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"node_id" varchar(255) NOT NULL,
	"node_type" varchar(100) NOT NULL,
	"attempt" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"duration_ms" integer NOT NULL,
	"reason" varchar(4096),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_step_attempts" ADD CONSTRAINT "execution_step_attempts_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_step_attempts_execution_id_idx" ON "execution_step_attempts" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "execution_step_attempts_node_id_idx" ON "execution_step_attempts" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "execution_step_attempts_status_idx" ON "execution_step_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "execution_step_attempts_attempt_idx" ON "execution_step_attempts" USING btree ("attempt");