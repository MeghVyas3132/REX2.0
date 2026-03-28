"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useExecutionQuery } from "@/features/executions/queries";

export default function ContextSnapshotsPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId: rawExecutionId } = use(params);
  const executionId = decodeURIComponent(rawExecutionId);
  const query = useExecutionQuery(executionId);

  if (query.isLoading) return <div className="page-state">Loading context snapshots...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load context snapshots.</div>;

  return (
    <section className="detail-page-shell execution-subdetail-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Execution Telemetry</p>
        <h1>Context Snapshots</h1>
        <p className="detail-page-subtitle">Execution ID: {executionId}</p>
      </header>

      <Card className="detail-card" title="Current Snapshot">
        <div className="detail-kv-list">
          <p className="detail-kv-item">Status: {query.data.status}</p>
          <p className="detail-kv-item">Started: {query.data.startedAt}</p>
          <p className="detail-kv-item">Completed: {query.data.completedAt ?? "-"}</p>
        </div>
      </Card>
    </section>
  );
}
