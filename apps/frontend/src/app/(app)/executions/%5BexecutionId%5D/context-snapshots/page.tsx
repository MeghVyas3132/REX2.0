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
    <section>
      <h1>Context Snapshots</h1>
      <p>Execution ID: {executionId}</p>

      <Card title="Current Snapshot">
        <p>Status: {query.data.status}</p>
        <p>Started: {query.data.startedAt}</p>
        <p>Completed: {query.data.completedAt ?? "-"}</p>
      </Card>
    </section>
  );
}
