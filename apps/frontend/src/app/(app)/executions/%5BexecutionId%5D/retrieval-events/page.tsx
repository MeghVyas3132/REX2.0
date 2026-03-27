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
    <section>
      <h1>Retrieval Events</h1>
      <p>Execution ID: {executionId}</p>

      <Card title="Event Stream Status">
        <p>Execution status: {query.data.status}</p>
        <p>Progress: {query.data.stepsCompleted}/{query.data.stepsTotal}</p>
      </Card>
    </section>
  );
}
