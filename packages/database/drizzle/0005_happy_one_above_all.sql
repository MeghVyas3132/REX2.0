ALTER TABLE "workflows" ADD COLUMN "source_template_id" varchar(100);
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "source_template_version" integer;
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "source_template_params" jsonb;
--> statement-breakpoint
CREATE INDEX "workflows_source_template_id_idx" ON "workflows" USING btree ("source_template_id");
