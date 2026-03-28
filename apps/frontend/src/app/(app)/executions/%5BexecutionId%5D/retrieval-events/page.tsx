"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useExecutionQuery } from "@/features/executions/queries";

export default function RetrievalEventsPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId: rawExecutionId } = use(params);
  const executionId = decodeURIComponent(rawExecutionId);
  const query = useExecutionQuery(executionId);

  if (query.isLoading) return <div className="page-state">Loading retrieval events...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load retrieval events.</div>;

  return (
    <section className="detail-page-shell execution-subdetail-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Execution Telemetry</p>
        <h1>Retrieval Events</h1>
        <p className="detail-page-subtitle">Execution ID: {executionId}</p>
      </header>

      <Card className="detail-card" title="Event Stream Status">
        <div className="detail-kv-list">
          <p className="detail-kv-item">Execution status: {query.data.status}</p>
          <p className="detail-kv-item">Progress: {query.data.stepsCompleted}/{query.data.stepsTotal}</p>
        </div>
      </Card>
    </section>
  );
}
