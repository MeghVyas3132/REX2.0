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
    <section>
      <h1>Execution Attempts</h1>
      <p>Execution ID: {executionId}</p>

      <Card title="Attempt Summary">
        <p>Completed steps: {query.data.stepsCompleted}</p>
        <p>Remaining steps: {remaining}</p>
        <p>Status: {query.data.status}</p>
      </Card>
    </section>
  );
}
