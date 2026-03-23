-- ──────────────────────────────────────────────
-- REX 2.0 - Data Subject Requests (DSAR)
-- ──────────────────────────────────────────────

CREATE TABLE "data_subject_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "subject_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "request_type" varchar(30) NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "response" text,
  "processed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "processed_at" timestamp with time zone,
  "due_date" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "data_subject_requests_tenant_id_idx" ON "data_subject_requests" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "data_subject_requests_subject_user_id_idx" ON "data_subject_requests" USING btree ("subject_user_id");
--> statement-breakpoint
CREATE INDEX "data_subject_requests_request_type_idx" ON "data_subject_requests" USING btree ("request_type");
--> statement-breakpoint
CREATE INDEX "data_subject_requests_status_idx" ON "data_subject_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "data_subject_requests_due_date_idx" ON "data_subject_requests" USING btree ("due_date");
