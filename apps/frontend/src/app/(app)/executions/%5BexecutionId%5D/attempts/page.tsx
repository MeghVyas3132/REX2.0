"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useExecutionQuery } from "@/features/executions/queries";

export default function AttemptsPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId: rawExecutionId } = use(params);
  const executionId = decodeURIComponent(rawExecutionId);
  const query = useExecutionQuery(executionId);

  if (query.isLoading) return <div className="page-state">Loading attempts...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load attempts.</div>;

  const remaining = Math.max(0, query.data.stepsTotal - query.data.stepsCompleted);

  return (
    <section className="detail-page-shell execution-subdetail-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Execution Telemetry</p>
        <h1>Execution Attempts</h1>
        <p className="detail-page-subtitle">Execution ID: {executionId}</p>
      </header>

      <Card className="detail-card" title="Attempt Summary">
        <div className="detail-kv-list">
          <p className="detail-kv-item">Completed steps: {query.data.stepsCompleted}</p>
          <p className="detail-kv-item">Remaining steps: {remaining}</p>
          <p className="detail-kv-item">Status: {query.data.status}</p>
        </div>
      </Card>
    </section>
  );
}
