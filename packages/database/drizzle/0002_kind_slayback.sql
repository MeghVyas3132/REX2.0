CREATE TABLE "execution_retrieval_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"node_id" varchar(255) NOT NULL,
	"node_type" varchar(100) NOT NULL,
	"query" text NOT NULL,
	"top_k" integer NOT NULL,
	"attempt" integer NOT NULL,
	"max_attempts" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"matches_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer NOT NULL,
	"error_message" varchar(4096),
	"scope_type" varchar(30),
	"corpus_id" uuid,
	"workflow_id_scope" uuid,
	"execution_id_scope" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD CONSTRAINT "execution_retrieval_events_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_execution_id_idx" ON "execution_retrieval_events" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_node_id_idx" ON "execution_retrieval_events" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_status_idx" ON "execution_retrieval_events" USING btree ("status");