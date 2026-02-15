ALTER TABLE "execution_retrieval_events" ADD COLUMN "strategy" varchar(40);
--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "retriever_key" varchar(100);
--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "branch_index" integer;
--> statement-breakpoint
ALTER TABLE "execution_retrieval_events" ADD COLUMN "selected" boolean;
--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_retriever_key_idx" ON "execution_retrieval_events" USING btree ("retriever_key");
--> statement-breakpoint
CREATE INDEX "execution_retrieval_events_strategy_idx" ON "execution_retrieval_events" USING btree ("strategy");
