"use client";

import { useEffect } from "react";
import { KnowledgeQueryConsole } from "@/components/knowledge/KnowledgeQueryConsole";
import { useCorporaQuery } from "@/features/knowledge/queries";
import { telemetry, useTelemetryPageView } from "@/lib/telemetry/observability";

export default function KnowledgeQueryPage() {
  const { data, isLoading, isError } = useCorporaQuery(1, 20);
  useTelemetryPageView("knowledge.query");

  useEffect(() => {
    if (isError) {
      telemetry.trackQueryError("knowledge", "Failed to load retrieval metadata");
    }
  }, [isError]);

  if (isLoading) return <div className="page-state">Loading query console...</div>;
  if (isError) return <div className="page-state">Failed to load retrieval metadata.</div>;

  return (
    <section>
      <h1>Knowledge Query</h1>
      <p>Use corpus metadata to validate retrieval readiness.</p>
      <KnowledgeQueryConsole corpora={data?.corpora ?? []} />
    </section>
  );
}
