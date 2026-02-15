CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corpus_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"token_count" integer,
	"embedding" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding_model" varchar(100) DEFAULT 'rex-hash-v1' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_corpora" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(2048) DEFAULT '' NOT NULL,
	"scope_type" varchar(30) DEFAULT 'user' NOT NULL,
	"workflow_id" uuid,
	"execution_id" uuid,
	"status" varchar(20) DEFAULT 'ingesting' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corpus_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" varchar(30) DEFAULT 'upload' NOT NULL,
	"title" varchar(255) NOT NULL,
	"mime_type" varchar(100),
	"content_text" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error" varchar(4096),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_corpus_id_knowledge_corpora_id_fk" FOREIGN KEY ("corpus_id") REFERENCES "public"."knowledge_corpora"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_corpora" ADD CONSTRAINT "knowledge_corpora_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_corpora" ADD CONSTRAINT "knowledge_corpora_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_corpora" ADD CONSTRAINT "knowledge_corpora_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_corpus_id_knowledge_corpora_id_fk" FOREIGN KEY ("corpus_id") REFERENCES "public"."knowledge_corpora"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_chunks_corpus_id_idx" ON "knowledge_chunks" USING btree ("corpus_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_document_id_idx" ON "knowledge_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_corpus_chunk_idx" ON "knowledge_chunks" USING btree ("corpus_id","chunk_index");--> statement-breakpoint
CREATE INDEX "knowledge_corpora_user_id_idx" ON "knowledge_corpora" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_corpora_scope_type_idx" ON "knowledge_corpora" USING btree ("scope_type");--> statement-breakpoint
CREATE INDEX "knowledge_corpora_workflow_id_idx" ON "knowledge_corpora" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "knowledge_corpora_execution_id_idx" ON "knowledge_corpora" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "knowledge_corpora_status_idx" ON "knowledge_corpora" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_documents_corpus_id_idx" ON "knowledge_documents" USING btree ("corpus_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_user_id_idx" ON "knowledge_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_status_idx" ON "knowledge_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_documents_created_at_idx" ON "knowledge_documents" USING btree ("created_at");